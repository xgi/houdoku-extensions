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
  Chapter,
  LanguageKey,
  Series,
  SeriesStatus,
} from "houdoku-extension-lib";
import { GetFilterOptionsFunc, UtilFunctions } from "houdoku-extension-lib/dist/interface";
import { Response } from "node-fetch";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
  Dropped: SeriesStatus.CANCELLED,
};

export class WeebReaderClient {
  extensionId: string;
  baseUrl: string;
  groupName: string;
  translatedLanguageKey: LanguageKey;
  util: UtilFunctions;

  constructor(
    extensionId: string,
    baseUrl: string,
    utilFns: UtilFunctions,
    groupName: string,
    translatedLanguageKey: LanguageKey
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.util = utilFns;
    this.groupName = groupName;
    this.translatedLanguageKey = translatedLanguageKey;
  }

  _parseSeriesList = (data: any): Series[] => {
    return data.map(
      (entry: any) =>
        ({
          id: undefined,
          extensionId: this.extensionId,
          sourceId: entry.id,

          title: entry.name,
          altTitles: [],
          description: "",
          authors: [entry.author.trim()],
          artists: [entry.artist.trim()],
          tags: [],
          status: SERIES_STATUS_MAP[entry.status],
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `${this.baseUrl}/${entry.coverUrl}`,
        } as Series)
    );
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}/api/titles/${id}`)
      .then((response: Response) => response.json())
      .then((data: any) => {
        return {
          id: undefined,
          extensionId: this.extensionId,
          sourceId: data.id,

          title: data.name,
          altTitles: [],
          description: data.synopsis,
          authors: [data.author.trim()],
          artists: [data.artist.trim()],
          tags: [],
          status: SERIES_STATUS_MAP[data.status],
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `${this.baseUrl}/${data.coverUrl}`,
        } as Series;
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}/api/titles/${id}`)
      .then((response: Response) => response.json())
      .then((data: any) => {
        return data.chapters.map(
          (entry: any) =>
            ({
              id: undefined,
              seriesId: undefined,
              sourceId: entry.id,
              title: entry.name || "",
              chapterNumber: entry.number ? entry.number.toString() : "",
              volumeNumber: entry.volume ? entry.volume.toString() : "",
              languageKey: this.translatedLanguageKey,
              groupName: this.groupName,
              time: new Date(entry.releaseDate).getTime(),
              read: false,
            } as Chapter)
        );
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.util
      .fetchFn(`${this.baseUrl}/api/chapters/${chapterSourceId}`)
      .then((response: Response) => response.json())
      .then((data: any) => {
        const pageFilenames = data.pages.map((entry: any) => entry.pageUrl);
        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames: pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames.map((fname) => `${this.baseUrl}/${fname}`);
  };

  getImage: GetImageFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = (text: string, page: number) => {
    return this.util
      .fetchFn(`${this.baseUrl}/api/titles/search?term=${text}`)
      .then((response: Response) => response.json())
      .then((data: any) => {
        const seriesList = this._parseSeriesList(data);
        return {
          seriesList,
          hasMore: false,
        };
      });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.util
      .fetchFn(`${this.baseUrl}/api/titles`)
      .then((response: Response) => response.json())
      .then((data: any) => {
        const seriesList = this._parseSeriesList(data);
        return {
          seriesList,
          hasMore: false,
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

  getFilterOptions: GetFilterOptionsFunc = () => [];
}
