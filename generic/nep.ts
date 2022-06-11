import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  PageRequesterData,
  GetDirectoryFunc,
  SeriesTagKey,
  FetchFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  WebviewFunc,
  WebviewResponse,
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import { findNodeWithText } from "../util/parsing";

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

const TAG_MAP: { [key: string]: SeriesTagKey } = {
  Action: SeriesTagKey.ACTION,
  Adventure: SeriesTagKey.ADVENTURE,
  Comedy: SeriesTagKey.COMEDY,
  Drama: SeriesTagKey.DRAMA,
  Fantasy: SeriesTagKey.FANTASY,
  Historical: SeriesTagKey.HISTORICAL,
  Horror: SeriesTagKey.HORROR,
  Isekai: SeriesTagKey.ISEKAI,
  Mecha: SeriesTagKey.MECHA,
  Mystery: SeriesTagKey.MYSTERY,
  Psychological: SeriesTagKey.PSYCHOLOGICAL,
  Romance: SeriesTagKey.ROMANCE,
  "Sci-fi": SeriesTagKey.SCI_FI,
  "Shoujo Ai": SeriesTagKey.SHOUJO_AI,
  "Shounen Ai": SeriesTagKey.SHOUNEN_AI,
  "Slice of Life": SeriesTagKey.SLICE_OF_LIFE,
  Sports: SeriesTagKey.SPORTS,
  Tragedy: SeriesTagKey.TRAGEDY,
  Yaoi: SeriesTagKey.YAOI,
  Yuri: SeriesTagKey.YURI,
  "Gender Bender": SeriesTagKey.GENDERSWAP,
  Harem: SeriesTagKey.HAREM,
  Lolicon: SeriesTagKey.LOLI,
  "Martial Arts": SeriesTagKey.MARTIAL_ARTS,
  "School Life": SeriesTagKey.SCHOOL_LIFE,
  Shotacon: SeriesTagKey.SHOTA,
  Supernatural: SeriesTagKey.SUPERNATURAL,
  Doujinshi: SeriesTagKey.DOUJINSHI,
  Adult: SeriesTagKey.PORNOGRAPHIC,
  Ecchi: SeriesTagKey.ECCHI,
  Smut: SeriesTagKey.SMUT,
  Shounen: SeriesTagKey.SHOUNEN,
  Seinen: SeriesTagKey.SEINEN,
  Shoujo: SeriesTagKey.SHOUJO,
  Josei: SeriesTagKey.JOSEI,
};

type DirectoryEntry = {
  indexName: string;
  seriesName: string;
};

const PAGE_SIZE = 24;

export class NepClient {
  fetchFn: FetchFunc;
  webviewFn: WebviewFunc;
  domParser: DOMParser;
  extensionId: string;
  baseUrl: string;

  fullDirectoryList: DirectoryEntry[];

  constructor(
    extensionId: string,
    baseUrl: string,
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
    this.webviewFn = webviewFn;
    this.domParser = domParser;

    this.fullDirectoryList = [];
  }

  _getDirectoryList = () => {
    return this.webviewFn(`${this.baseUrl}/directory`).then(
      (response: WebviewResponse) => {
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
      }
    );
  };

  _parseDirectoryList = (directoryList: DirectoryEntry[]): Series[] => {
    return directoryList.map((entry) => {
      return {
        id: undefined,
        extensionId: this.extensionId,
        sourceId: entry.indexName,
        sourceType: SeriesSourceType.STANDARD,
        title: entry.seriesName,
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tagKeys: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: LanguageKey.JAPANESE,
        numberUnread: 0,
        remoteCoverUrl: `https://cover.nep.li/cover/${entry.indexName}.jpg`,
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

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${this.baseUrl}/manga/${id}`).then(
      (response: WebviewResponse) => {
        // some list item tags are incorrectly closed with </i> instead of </li>,
        // so we manually replace them here
        const fixedData = response.text.replace(/\<\/i>/g, "</li>");

        const doc = this.domParser.parseFromString(fixedData);

        const detailContainer = doc.getElementsByClassName(
          "list-group list-group-flush"
        )![0];
        const detailLabels = detailContainer.getElementsByClassName("mlabel")!;

        const title = detailContainer
          .getElementsByTagName("h1")![0]
          .textContent.trim();

        const authors: string[] = findNodeWithText(detailLabels, "Author(s)")!
          .parentNode!.getElementsByTagName("a")!
          .map((node: DOMParser.Node) => node.textContent.trim());

        const genreStrings: string[] = findNodeWithText(
          detailLabels,
          "Genre(s)"
        )!
          .parentNode!.getElementsByTagName("a")!
          .map((node: DOMParser.Node) => node.textContent.trim());

        const typeStr = findNodeWithText(detailLabels, "Type")!
          .parentNode!.getElementsByTagName("a")![0]
          .getAttribute("href")!
          .split("=")
          .pop()!;
        const originalLanguage = ORIGINAL_LANGUAGE_MAP[typeStr];

        const statusStr = findNodeWithText(detailLabels, "Status")!
          .parentNode!.getElementsByTagName("a")![0]
          .getAttribute("href")!
          .split("=")
          .pop()!;
        const status = SERIES_STATUS_MAP[statusStr];

        const description = findNodeWithText(detailLabels, "Description")!
          .parentNode!.getElementsByClassName("Content")![0]
          .textContent.trim();

        const tagKeys: SeriesTagKey[] = [];

        genreStrings.forEach((genreStr: string) => {
          if (genreStr in TAG_MAP) {
            tagKeys.push(TAG_MAP[genreStr]);
          }
        });

        const series: Series = {
          id: undefined,
          extensionId: this.extensionId,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title: title || "",
          altTitles: [],
          description: description,
          authors: authors,
          artists: [],
          tagKeys: tagKeys,
          status: status,
          originalLanguageKey: originalLanguage,
          numberUnread: 0,
          remoteCoverUrl: `https://cover.nep.li/cover/${id}.jpg`,
        };
        return series;
      }
    );
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${this.baseUrl}/manga/${id}`).then(
      (response: WebviewResponse) => {
        const contentStr = response.text
          .split("vm.Chapters = ")
          .pop()!
          .split(";")[0];
        const content = JSON.parse(contentStr);

        return content.map((entry: any) => {
          return {
            id: undefined,
            seriesId: undefined,
            sourceId: this._decodeChapterId(entry.Chapter).path,
            title: entry.ChapterName || "",
            chapterNumber: this._decodeChapterId(
              entry.Chapter
            ).number.toString(),
            volumeNumber: "",
            languageKey: LanguageKey.ENGLISH,
            groupName: "",
            time: new Date(entry.Date).getTime(),
            read: false,
          } as Chapter;
        });
      }
    );
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.webviewFn(
      `${this.baseUrl}/read-online/${seriesSourceId}${chapterSourceId}`
    ).then((response: WebviewResponse) => {
      const host = JSON.parse(
        '"' + response.text.split('vm.CurPathName = "').pop()!.split(";")[0]
      );
      const curChapter = JSON.parse(
        "{" + response.text.split("vm.CurChapter = {").pop()!.split(";")[0]
      );
      const indexName = JSON.parse(
        response.text.split("vm.IndexName = ").pop()!.split(";")[0]
      );

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

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
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
