import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  PageRequesterData,
  GetDirectoryFunc,
  DemographicKey,
  FetchFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  GenreKey,
  ThemeKey,
  FormatKey,
  ContentWarningKey,
} from "houdoku-extension-lib";
import {
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import DOMParser from "dom-parser";
import { findNodeWithText } from "../util/parsing";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Complete: SeriesStatus.COMPLETED,
  Cancelled: SeriesStatus.CANCELLED,
};

const GENRE_MAP: { [key: string]: GenreKey } = {
  Action: GenreKey.ACTION,
  Adventure: GenreKey.ADVENTURE,
  Comedy: GenreKey.COMEDY,
  Drama: GenreKey.DRAMA,
  Fantasy: GenreKey.FANTASY,
  Historical: GenreKey.HISTORICAL,
  Horror: GenreKey.HORROR,
  Isekai: GenreKey.ISEKAI,
  Mecha: GenreKey.MECHA,
  Mystery: GenreKey.MYSTERY,
  Psychological: GenreKey.PSYCHOLOGICAL,
  Romance: GenreKey.ROMANCE,
  "Sci-fi": GenreKey.SCI_FI,
  "Shoujo Ai": GenreKey.SHOUJO_AI,
  "Shounen Ai": GenreKey.SHOUNEN_AI,
  "Slice of Life": GenreKey.SLICE_OF_LIFE,
  Sports: GenreKey.SPORTS,
  Tragedy: GenreKey.TRAGEDY,
  Yaoi: GenreKey.YAOI,
  Yuri: GenreKey.YURI,
};

const THEME_MAP: { [key: string]: ThemeKey } = {
  "Gender Bender": ThemeKey.GENDERSWAP,
  Harem: ThemeKey.HAREM,
  Lolicon: ThemeKey.LOLI,
  "Martial Arts": ThemeKey.MARTIAL_ARTS,
  "School Life": ThemeKey.SCHOOL_LIFE,
  Shotacon: ThemeKey.SHOTA,
  Supernatural: ThemeKey.SUPERNATURAL,
};

const FORMAT_MAP: { [key: string]: FormatKey } = {
  Doujinshi: FormatKey.DOUJINSHI,
};

const CONTENT_WARNING_MAP: { [key: string]: ContentWarningKey } = {
  Adult: ContentWarningKey.PORNOGRAPHIC,
  Ecchi: ContentWarningKey.ECCHI,
  Smut: ContentWarningKey.SMUT,
};

const DEMOGRAPHIC_MAP: { [key: string]: DemographicKey } = {
  Shounen: DemographicKey.SHOUNEN,
  Seinen: DemographicKey.SEINEN,
  Shoujo: DemographicKey.SHOUJO,
  Josei: DemographicKey.JOSEI,
};

export class NepClient {
  fetchFn: FetchFunc;
  domParser: DOMParser;
  extensionId: string;
  baseUrl: string;

  fullDirectoryList: { indexName: string; seriesName: string }[];

  constructor(
    extensionId: string,
    baseUrl: string,
    fetchFn: FetchFunc,
    domParser: DOMParser
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
    this.domParser = domParser;

    this.fullDirectoryList = [];
  }

  _getDirectoryList = () => {
    return this.fetchFn(`${this.baseUrl}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const contentStr = data
          .split("vm.HotUpdateJSON = ")
          .pop()
          .split(";")[0];
        const content = JSON.parse(contentStr);

        this.fullDirectoryList = content.map((entry: any) => {
          return {
            indexName: entry.IndexName,
            seriesName: entry.SeriesName,
          };
        });
      });
  };

  _decodeChapterId = (id: string): { path: string; number: string } => {
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
      number: n,
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
    return this.fetchFn(`${this.baseUrl}/manga/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        // some list item tags are incorrectly closed with </i> instead of </li>,
        // so we manually replace them here
        const fixedData = data.replace(/\<\/i>/g, "</li>");

        const doc = this.domParser.parseFromString(fixedData);

        const detailContainer = doc.getElementsByClassName(
          "list-group list-group-flush"
        )[0];
        const detailLabels = detailContainer.getElementsByClassName("mlabel");

        const title = detailContainer
          .getElementsByTagName("h1")[0]
          .textContent.trim();

        const authors: string[] = findNodeWithText(detailLabels, "Author(s)")
          .parentNode.getElementsByTagName("a")
          .map((node: DOMParser.Node) => node.textContent.trim());

        const genreStrings: string[] = findNodeWithText(
          detailLabels,
          "Genre(s)"
        )
          .parentNode.getElementsByTagName("a")
          .map((node: DOMParser.Node) => node.textContent.trim());

        const statusStr = findNodeWithText(detailLabels, "Status")
          .parentNode.getElementsByTagName("a")[0]
          .getAttribute("href")
          .split("=")
          .pop();
        const status = SERIES_STATUS_MAP[statusStr];

        const description = findNodeWithText(detailLabels, "Description")
          .parentNode.getElementsByClassName("Content")[0]
          .textContent.trim();

        const genres: GenreKey[] = [];
        const themes: ThemeKey[] = [];
        const formats: FormatKey[] = [];
        const contentWarnings: ContentWarningKey[] = [];
        const demographics: DemographicKey[] = [DemographicKey.UNCERTAIN];

        genreStrings.forEach((genreStr: string) => {
          if (genreStr in GENRE_MAP) {
            genres.push(GENRE_MAP[genreStr]);
          }
          if (genreStr in THEME_MAP) {
            themes.push(THEME_MAP[genreStr]);
          }
          if (genreStr in FORMAT_MAP) {
            formats.push(FORMAT_MAP[genreStr]);
          }
          if (genreStr in CONTENT_WARNING_MAP) {
            contentWarnings.push(CONTENT_WARNING_MAP[genreStr]);
          }
          if (genreStr in DEMOGRAPHIC_MAP) {
            demographics.push(DEMOGRAPHIC_MAP[genreStr]);
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
          genres,
          themes,
          formats,
          contentWarnings,
          demographic: demographics.pop(),
          status: status,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `https://cover.nep.li/cover/${id}.jpg`,
          userTags: [],
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${this.baseUrl}/manga/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const contentStr = data.split("vm.Chapters = ").pop().split(";")[0];
        const content = JSON.parse(contentStr);

        return content.map((entry: any) => {
          return {
            id: undefined,
            seriesId: undefined,
            sourceId: this._decodeChapterId(entry.Chapter).path,
            title: entry.ChapterName || "",
            chapterNumber: this._decodeChapterId(entry.Chapter).number,
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
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(
      `${this.baseUrl}/read-online/${seriesSourceId}${chapterSourceId}`
    )
      .then((response: Response) => response.text())
      .then((data: string) => {
        const host = JSON.parse(
          '"' + data.split('vm.CurPathName = "').pop().split(";")[0]
        );
        const curChapter = JSON.parse(
          "{" + data.split("vm.CurChapter = {").pop().split(";")[0]
        );
        const indexName = JSON.parse(
          data.split("vm.IndexName = ").pop().split(";")[0]
        );

        const dir =
          curChapter.Directory === "" ? "" : `${curChapter.Directory}/`;
        const chNum = this._chapterImage(curChapter.Chapter);

        const numPages = parseInt(curChapter.Page);
        const pageFilenames = [];
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
    console.log(pageRequesterData);
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
    params: { [key: string]: string }
  ) => {
    if (this.fullDirectoryList.length === 0) await this._getDirectoryList();

    return this.fullDirectoryList
      .filter((entry: { indexName: string; seriesName: string }) =>
        entry.seriesName.toLowerCase().includes(text.toLowerCase())
      )
      .slice(0, 12)
      .map((entry: { indexName: string; seriesName: string }) => {
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
          genres: [],
          themes: [],
          contentWarnings: [],
          formats: [],
          demographic: DemographicKey.UNCERTAIN,
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `https://cover.nep.li/cover/${entry.indexName}.jpg`,
          userTags: [],
        };
      });
  };

  getDirectory: GetDirectoryFunc = async () => {
    if (this.fullDirectoryList.length === 0) await this._getDirectoryList();

    return this.fullDirectoryList
      .slice(0, 12)
      .map((entry: { indexName: string; seriesName: string }) => {
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
          genres: [],
          themes: [],
          contentWarnings: [],
          formats: [],
          demographic: DemographicKey.UNCERTAIN,
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `https://cover.nep.li/cover/${entry.indexName}.jpg`,
          userTags: [],
        };
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
