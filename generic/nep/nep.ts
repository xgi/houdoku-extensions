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
  FilterValues,
  FilterMultiToggle,
  MultiToggleValues,
  TriState,
  FilterTriStateCheckbox,
  FilterSortValue,
  FilterSort,
  SortDirection,
} from "houdoku-extension-lib";
import { GetFilterOptionsFunc, UtilFunctions } from "houdoku-extension-lib/dist/interface";

import { findElementWithText } from "../../util/parsing";
import { DirectoryEntry } from "./types";
import {
  FIELDS_GENRES,
  FIELDS_SORT,
  FIELDS_STATUS,
  FIELDS_TYPES,
  FilterControlIds,
  SortType,
} from "./filters";
import { applySort, applyTriStateFilter } from "./util";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Cancelled: SeriesStatus.CANCELLED,
  Complete: SeriesStatus.COMPLETED,
  Discontinued: SeriesStatus.CANCELLED,
  Hiatus: SeriesStatus.ONGOING,
  Ongoing: SeriesStatus.ONGOING,
};

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  Manga: LanguageKey.JAPANESE,
  Manhua: LanguageKey.CHINESE_SIMP,
  Manhwa: LanguageKey.KOREAN,
  Doujinshi: LanguageKey.JAPANESE,
  OEL: LanguageKey.ENGLISH,
  "One-shot": LanguageKey.JAPANESE,
};

const PAGE_SIZE = 24;

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
    return this.util.webviewFn(`${this.baseUrl}/search`).then((response: WebviewResponse) => {
      let contentStr = response.text
        .split("vm.Directory = ")
        .pop()!
        .split("vm.GetIntValue=")[0]
        .trim();
      contentStr = contentStr.substring(0, contentStr.length - 1);
      const content = JSON.parse(contentStr);

      this.fullDirectoryList = content.map((entry: any) => {
        const parsed: DirectoryEntry = {
          indexName: entry.i,
          seriesName: entry.s,
          official: entry.o === "yes",
          scanStatus: entry.ss,
          publishStatus: entry.ps,
          type: entry.t,
          year: parseInt(entry.y),
          popularity: parseInt(entry.v),
          lastScanReleased: new Date(entry.ls).getTime(),
          genres: entry.g,
        };
        return parsed;
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
      const title = doc.querySelector("h1").textContent.trim();

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

  getDirectory: GetDirectoryFunc = async (page: number, filterValues: FilterValues) => {
    return this.getSearch("", page, filterValues);
  };

  getSearch: GetSearchFunc = async (text: string, page: number, filterValues: FilterValues) => {
    if (this.fullDirectoryList.length === 0) await this._getDirectoryList();

    let results = this.fullDirectoryList.filter((entry) =>
      entry.seriesName.toLowerCase().includes(text.toLowerCase())
    );

    if (FilterControlIds.Genres in filterValues) {
      results = applyTriStateFilter(
        results,
        "genres",
        filterValues[FilterControlIds.Genres] as MultiToggleValues
      );
    }
    if (FilterControlIds.ScanStatus in filterValues) {
      results = applyTriStateFilter(
        results,
        "scanStatus",
        filterValues[FilterControlIds.ScanStatus] as MultiToggleValues
      );
    }
    if (FilterControlIds.Type in filterValues) {
      results = applyTriStateFilter(
        results,
        "type",
        filterValues[FilterControlIds.Type] as MultiToggleValues
      );
    }
    if (FilterControlIds.Official in filterValues) {
      const officialValue = filterValues[FilterControlIds.Official] as TriState;
      if (officialValue === TriState.INCLUDE) results = results.filter((entry) => entry.official);
      else if (officialValue === TriState.EXCLUDE)
        results = results.filter((entry) => !entry.official);
    }
    if (FilterControlIds.Sort in filterValues) {
      results = applySort(results, filterValues[FilterControlIds.Sort] as FilterSortValue);
    } else {
      results = applySort(results, {
        key: SortType.POPULARITY,
        direction: SortDirection.DESCENDING,
      });
    }

    const startIndex = (page - 1) * PAGE_SIZE;
    return {
      seriesList: this._parseDirectoryList(results.slice(startIndex, startIndex + PAGE_SIZE)),
      hasMore: results.length > startIndex + PAGE_SIZE,
    };
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};

  getFilterOptions: GetFilterOptionsFunc = () => {
    return [
      new FilterSort(FilterControlIds.Sort, "Sort", {
        key: SortType.POPULARITY,
        direction: SortDirection.DESCENDING,
      })
        .withFields(FIELDS_SORT)
        .withSupportsBothDirections(true),
      new FilterTriStateCheckbox(
        FilterControlIds.Official,
        "Official translation",
        TriState.IGNORE
      ),

      new FilterMultiToggle(FilterControlIds.Genres, "Genre", {})
        .withFields(FIELDS_GENRES)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.ScanStatus, "Scan Status", {})
        .withFields(FIELDS_STATUS)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.PublishStatus, "Publish Status", {})
        .withFields(FIELDS_STATUS)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.Type, "Type", {})
        .withFields(FIELDS_TYPES)
        .withIsTriState(true),
    ];
  };
}
