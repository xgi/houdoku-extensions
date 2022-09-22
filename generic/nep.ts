import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  PageRequesterData,
  GetDirectoryFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  WebviewResponse,
  Chapter,
  LanguageKey,
  Series,
  SeriesStatus,
} from "houdoku-extension-lib";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

import { findElementWithText } from "../util/parsing";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Complete: SeriesStatus.COMPLETED,
  Cancelled: SeriesStatus.CANCELLED,
};

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  Manga: LanguageKey.JAPANESE,
  Manhua: LanguageKey.CHINESE_SIMP,
  Manhwa: LanguageKey.KOREAN,
  Doujinshi: LanguageKey.JAPANESE,
  OEL: LanguageKey.ENGLISH,
  "One-shot": LanguageKey.JAPANESE,
};

type DirectoryEntry = {
  indexName: string;
  seriesName: string;
};

const PAGE_SIZE = 48;

export class NepClient {
  extensionId: string;
  baseUrl: string;
  util: UtilFunctions;

  fullDirectoryList: DirectoryEntry[];

  constructor(extensionId: string, baseUrl: string, utilFns: UtilFunctions) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.util = utilFns;

    this.fullDirectoryList = [];
  }

  _getDirectoryList = () => {
    return this.util.webviewFn(`${this.baseUrl}/directory`).then((response: WebviewResponse) => {
      let contentStr = response.text
        .split("vm.FullDirectory = ")
        .pop()!
        .split("vm.CurrLetter")[0]
        .trim();
      contentStr = contentStr.substr(0, contentStr.length - 1);
      const content = JSON.parse(contentStr);

      this.fullDirectoryList = content["Directory"].map((entry: any) => {
        return {
          indexName: entry.i,
          seriesName: entry.s,
        };
      });
    });
  };

  _parseDirectoryList = (directoryList: DirectoryEntry[]): Series[] => {
    return directoryList.map((entry) => {
      return {
        id: undefined,
        extensionId: this.extensionId,
        sourceId: entry.indexName,

        title: entry.seriesName,
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tags: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: LanguageKey.JAPANESE,
        numberUnread: 0,
        remoteCoverUrl: `https://temp.compsci88.com/cover/${entry.indexName}.jpg`,
      };
    });
  };

  _decodeChapterId = (id: string): { path: string; number: number } => {
    let index = "";
    let t = id.substring(0, 1);
    if (t !== "1") {
      index = `-index-${t}`;
    }

    let dgt: number;
    if (parseInt(id) < 100100) dgt = 4;
    else if (parseInt(id) < 101000) dgt = 3;
    else if (parseInt(id) < 110000) dgt = 2;
    else dgt = 1;

    let n = id.substring(dgt, id.length - 1);
    let suffix = "";
    let path = id.substring(id.length - 1);
    if (path !== "0") suffix = `.${path}`;

    return {
      path: `-chapter-${n}${suffix}${index}.html`,
      number: parseFloat(`${n}${suffix}`),
    };
  };

  _chapterImage = (id: string): string => {
    let str = id.slice(1, -1);
    let odd = id[id.length - 1];
    if (odd == "0") {
      return str;
    } else {
      return str + "." + odd;
    }
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.util.webviewFn(`${this.baseUrl}/manga/${id}`).then((response: WebviewResponse) => {
      // some list item tags are incorrectly closed with </i> instead of </li>,
      // so we manually replace them here
      const fixedData = response.text.replace(/\<\/i>/g, "</li>");

      const doc = this.util.docFn(fixedData);
      const title = doc.querySelector('h1').textContent.trim();
      
      const detailLabels = doc.getElementsByClassName("mlabel")!;
      const authors: string[] = Array.from(
        findElementWithText(detailLabels, "Author(s)")!.parentElement!.getElementsByTagName("a")!
      ).map((element: Element) => element.textContent.trim());

      const genreStrings: string[] = Array.from(
        findElementWithText(detailLabels, "Genre(s)")!.parentElement!.getElementsByTagName("a")!
      ).map((element: Element) => element.textContent.trim());

      const typeStr = findElementWithText(detailLabels, "Type")!
        .parentElement!.getElementsByTagName("a")![0]
        .getAttribute("href")!
        .split("=")
        .pop()!;
      const originalLanguage = ORIGINAL_LANGUAGE_MAP[typeStr];

      const statusStr = findElementWithText(detailLabels, "Status")!
        .parentElement!.getElementsByTagName("a")![0]
        .getAttribute("href")!
        .split("=")
        .pop()!;
      const status = SERIES_STATUS_MAP[statusStr];

      const description = findElementWithText(detailLabels, "Description")!
        .parentElement!.getElementsByClassName("Content")![0]
        .textContent.trim();

      const series: Series = {
        id: undefined,
        extensionId: this.extensionId,
        sourceId: id,

        title: title || "",
        altTitles: [],
        description: description,
        authors: authors,
        artists: [],
        tags: genreStrings,
        status: status,
        originalLanguageKey: originalLanguage,
        numberUnread: 0,
        remoteCoverUrl: `https://temp.compsci88.com/cover/${id}.jpg`,
      };
      return series;
    });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.util.webviewFn(`${this.baseUrl}/manga/${id}`).then((response: WebviewResponse) => {
      const contentStr = response.text.split("vm.Chapters = ").pop()!.split(";")[0];
      const content = JSON.parse(contentStr);

      return content.map((entry: any) => {
        return {
          id: undefined,
          seriesId: undefined,
          sourceId: this._decodeChapterId(entry.Chapter).path,
          title: entry.ChapterName || "",
          chapterNumber: this._decodeChapterId(entry.Chapter).number.toString(),
          volumeNumber: "",
          languageKey: LanguageKey.ENGLISH,
          groupName: "",
          time: new Date(entry.Date).getTime(),
          read: false,
        } as Chapter;
      });
    });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.util
      .webviewFn(`${this.baseUrl}/read-online/${seriesSourceId}${chapterSourceId}`)
      .then((response: WebviewResponse) => {
        const host = JSON.parse(
          '"' + response.text.split('vm.CurPathName = "').pop()!.split(";")[0]
        );
        const curChapter = JSON.parse(
          "{" + response.text.split("vm.CurChapter = {").pop()!.split(";")[0]
        );
        const indexName = JSON.parse(response.text.split("vm.IndexName = ").pop()!.split(";")[0]);

        const dir = curChapter.Directory === "" ? "" : `${curChapter.Directory}/`;
        const chNum = this._chapterImage(curChapter.Chapter);

        const numPages = parseInt(curChapter.Page);
        const pageFilenames: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const iStr = i.toLocaleString("en-US", {
            minimumIntegerDigits: 3,
            useGrouping: false,
          });
          pageFilenames.push(`${chNum}-${iStr}.png`);
        }

        return {
          server: host,
          hash: `${indexName}/${dir}`,
          pageFilenames: pageFilenames,
          numPages,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames.map((fname: string) => {
      return `https://${pageRequesterData.server}/manga/${pageRequesterData.hash}${fname}`;
    });
  };

  getImage: GetImageFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = async (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    if (this.fullDirectoryList.length === 0) await this._getDirectoryList();

    const allMatching = this.fullDirectoryList.filter((entry) =>
      entry.seriesName.toLowerCase().includes(text.toLowerCase())
    );

    const startIndex = (page - 1) * PAGE_SIZE;
    const seriesList: Series[] = this._parseDirectoryList(
      allMatching.slice(startIndex, startIndex + PAGE_SIZE)
    );

    return {
      seriesList,
      hasMore: allMatching.length > startIndex + PAGE_SIZE,
    };
  };

  getDirectory: GetDirectoryFunc = async (page: number) => {
    if (this.fullDirectoryList.length === 0) await this._getDirectoryList();

    const startIndex = (page - 1) * PAGE_SIZE;
    const seriesList: Series[] = this._parseDirectoryList(
      this.fullDirectoryList.slice(startIndex, startIndex + PAGE_SIZE)
    );

    return {
      seriesList,
      hasMore: this.fullDirectoryList.length > startIndex + PAGE_SIZE,
    };
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
