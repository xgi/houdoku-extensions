import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  GetImageFunc,
  SeriesListResponse,
  SettingType,
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import { Response } from "node-fetch";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { KomgaBook, KomgaPage, KomgaSeries, KomgaSeriesListResponse } from "./types";
import { findLanguageKey } from "../../util/parsing";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export enum SETTING_NAMES {
  ADDRESS = "Address (with port)",
  USERNAME = "Username",
  PASSWORD = "Password",
}

const SETTING_TYPES = {
  [SETTING_NAMES.ADDRESS]: SettingType.STRING,
  [SETTING_NAMES.USERNAME]: SettingType.STRING,
  [SETTING_NAMES.PASSWORD]: SettingType.STRING,
};

const DEFAULT_SETTINGS = {
  [SETTING_NAMES.ADDRESS]: "",
  [SETTING_NAMES.USERNAME]: "",
  [SETTING_NAMES.PASSWORD]: "",
};

const STATUS_MAP: { [key: string]: SeriesStatus } = {
  HIATUS: SeriesStatus.ONGOING,
  ONGOING: SeriesStatus.ONGOING,
  ENDED: SeriesStatus.COMPLETED,
  ABANDONED: SeriesStatus.CANCELLED,
};

export class ExtensionClient extends ExtensionClientAbstract {
  _getHeaders = () => ({
    Authorization: `Basic ${Buffer.from(
      `${this.settings[SETTING_NAMES.USERNAME]}:${this.settings[SETTING_NAMES.PASSWORD]}`
    ).toString("base64")}`,
  });

  _parseSeriesListResponse = (seriesListResponse: KomgaSeriesListResponse): SeriesListResponse => {
    const seriesList: Series[] = seriesListResponse.content.map((seriesObj: KomgaSeries) => ({
      id: undefined,
      extensionId: METADATA.id,
      sourceId: seriesObj.id,
      title: seriesObj.metadata.title,
      altTitles: [],
      description: seriesObj.metadata.summary,
      authors: [],
      artists: [],
      tags: [...seriesObj.metadata.genres, ...seriesObj.metadata.tags],
      status: STATUS_MAP[seriesObj.metadata.status],
      originalLanguageKey: findLanguageKey(seriesObj.metadata.language) || LanguageKey.MULTI,
      numberUnread: 0,
      remoteCoverUrl: `${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series/${
        seriesObj.id
      }/thumbnail`,
    }));

    return {
      seriesList,
      hasMore: !seriesListResponse.last,
    };
  };

  constructor(utilFns: UtilFunctions) {
    super(utilFns);
    this.settings = DEFAULT_SETTINGS;
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series/${id}`, {
        headers: this._getHeaders(),
      })
      .then((response: Response) => response.json())
      .then((json: KomgaSeries) => {
        return {
          id: undefined,
          extensionId: METADATA.id,
          sourceId: json.id,
          title: json.metadata.title,
          altTitles: [],
          description: json.metadata.summary,
          authors: Array.from(new Set(json.booksMetadata.authors.map((author) => author.name))),
          artists: [],
          tags: [...json.metadata.genres, ...json.metadata.tags],
          status: STATUS_MAP[json.metadata.status],
          originalLanguageKey: findLanguageKey(json.metadata.language) || LanguageKey.MULTI,
          numberUnread: 0,
          remoteCoverUrl: `${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series/${
            json.id
          }/thumbnail`,
        };
      });
  };

  getChapters: GetChaptersFunc = async (id: string) => {
    const languageKey = await this.utilFns
      .fetchFn(`${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series/${id}`, {
        headers: this._getHeaders(),
      })
      .then((response: Response) => response.json())
      .then((json: KomgaSeries) => findLanguageKey(json.metadata.language) || LanguageKey.MULTI);

    return this.utilFns
      .fetchFn(`${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series/${id}/books`, {
        headers: this._getHeaders(),
      })
      .then((response: Response) => response.json())
      .then((json: any) => {
        return json.content.map((book: KomgaBook) => ({
          id: undefined,
          seriesId: undefined,
          sourceId: book.id,
          title: book.metadata.title,
          chapterNumber: book.metadata.number,
          volumeNumber: "",
          languageKey: languageKey,
          groupName: "",
          time: new Date(book.fileLastModified).getTime(),
          read: false,
        }));
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.utilFns
      .fetchFn(`${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/books/${chapterSourceId}/pages`, {
        headers: this._getHeaders(),
      })
      .then((response: Response) => response.json())
      .then((json: KomgaPage[]) => {
        const pageFilenames = json.map(
          (page) =>
            `${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/books/${chapterSourceId}/pages/${
              page.number
            }`
        );

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames;
  };

  getImage: GetImageFunc = (series: Series, url: string) => {
    return this.utilFns
      .fetchFn(url, { headers: this._getHeaders() })
      .then((response) => response.arrayBuffer());
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.utilFns
      .fetchFn(
        `${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series?page=${
          page - 1
        }&deleted=false&sort=metadata.titleSort,asc`,
        { headers: this._getHeaders() }
      )
      .then((response: Response) => response.json())
      .then((json: KomgaSeriesListResponse) => this._parseSeriesListResponse(json));
  };

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) => {
    return this.utilFns
      .fetchFn(
        `${this.settings[SETTING_NAMES.ADDRESS]}/api/v1/series?search=${text}&page=${
          page - 1
        }&deleted=false`,
        {
          headers: this._getHeaders(),
        }
      )
      .then((response: Response) => response.json())
      .then((json: KomgaSeriesListResponse) => this._parseSeriesListResponse(json));
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return SETTING_TYPES;
  };

  getSettings: GetSettingsFunc = () => {
    return this.settings;
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {
    Object.keys(newSettings).forEach((key: string) => {
      if (key in this.settings && typeof (this.settings[key] === newSettings[key])) {
        this.settings[key] = newSettings[key];
      }
    });
  };
}
