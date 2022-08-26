import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
  ExtensionClientAbstract,
  GetSettingsFunc,
  FetchFunc,
  WebviewFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SettingType,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  ongoing: SeriesStatus.ONGOING,
  completed: SeriesStatus.COMPLETED,
  hiatus: SeriesStatus.ONGOING,
  cancelled: SeriesStatus.CANCELLED,
};

const LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  ar: LanguageKey.ARABIC,
  bg: LanguageKey.BULGARIAN,
  ca: LanguageKey.CATALAN,
  zh: LanguageKey.CHINESE_SIMP,
  "zh-ro": LanguageKey.CHINESE_TRAD,
  cs: LanguageKey.CZECH,
  da: LanguageKey.DANISH,
  nl: LanguageKey.DUTCH,
  en: LanguageKey.ENGLISH,
  fi: LanguageKey.FINNISH,
  fr: LanguageKey.FRENCH,
  de: LanguageKey.GERMAN,
  el: LanguageKey.GREEK,
  he: LanguageKey.HEBREW,
  hi: LanguageKey.HINDI,
  hu: LanguageKey.HUNGARIAN,
  id: LanguageKey.INDONESIAN,
  it: LanguageKey.ITALIAN,
  ja: LanguageKey.JAPANESE,
  "ja-ro": LanguageKey.JAPANESE,
  ko: LanguageKey.KOREAN,
  "ko-ro": LanguageKey.KOREAN,
  lt: LanguageKey.LITHUANIAN,
  ms: LanguageKey.MALAY,
  pl: LanguageKey.POLISH,
  pt: LanguageKey.PORTUGUESE_PT,
  "pt-br": LanguageKey.PORTUGUESE_BR,
  ro: LanguageKey.ROMANIAN,
  ru: LanguageKey.RUSSIAN,
  es: LanguageKey.SPANISH_ES,
  "es-la": LanguageKey.SPANISH_LATAM,
  sv: LanguageKey.SWEDISH,
  th: LanguageKey.THAI,
  tr: LanguageKey.TURKISH,
  uk: LanguageKey.UKRAINIAN,
  vi: LanguageKey.VIETNAMESE,
};

enum SETTING_NAMES {
  USE_DATA_SAVER = "Use data saver",
  INCLUDE_SAFE = "Include safe content",
  INCLUDE_ECCHI = "Include ecchi (suggestive) content",
  INCLUDE_SMUT = "Include smut (erotica) content",
  INCLUDE_PORNOGRAPHIC = "Include pornographic content",
}

const SETTING_TYPES = {
  [SETTING_NAMES.USE_DATA_SAVER]: SettingType.BOOLEAN,
  [SETTING_NAMES.INCLUDE_SAFE]: SettingType.BOOLEAN,
  [SETTING_NAMES.INCLUDE_ECCHI]: SettingType.BOOLEAN,
  [SETTING_NAMES.INCLUDE_SMUT]: SettingType.BOOLEAN,
  [SETTING_NAMES.INCLUDE_PORNOGRAPHIC]: SettingType.BOOLEAN,
};

const DEFAULT_SETTINGS = {
  [SETTING_NAMES.USE_DATA_SAVER]: false,
  [SETTING_NAMES.INCLUDE_SAFE]: true,
  [SETTING_NAMES.INCLUDE_ECCHI]: true,
  [SETTING_NAMES.INCLUDE_SMUT]: false,
  [SETTING_NAMES.INCLUDE_PORNOGRAPHIC]: false,
};

const PAGE_SIZE = 48;

type ParsedResults = {
  seriesList: Series[];
  hasMore: boolean;
};

const _parseMangaResults = (json: any): ParsedResults => {
  if (!("data" in json) || json.data === undefined || json.data.length === 0) {
    return { seriesList: [], hasMore: false };
  }

  const seriesList = json.data.map((result: any) => {
    const tags: string[] = result.attributes.tags.map(
      (tag: any) => tag.attributes.name.en
    );
    if (result.attributes.publicationDemographic !== null) {
      tags.push(result.attributes.publicationDemographic);
    }

    const title =
      result.attributes.title.en !== undefined
        ? result.attributes.title.en
        : Object.values(result.attributes.title)[0];

    const coverRelationship = result.relationships.find(
      (relationship: any) =>
        relationship.type === "cover_art" &&
        relationship.attributes !== undefined
    );
    const remoteCoverUrl =
      coverRelationship !== undefined
        ? `https://uploads.mangadex.org/covers/${result.id}/${coverRelationship.attributes.fileName}.512.jpg`
        : "";

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: result.id,
      sourceType: SeriesSourceType.STANDARD,
      title,
      altTitles: result.attributes.altTitles.map(
        (altTitleCont: any) => altTitleCont.en
      ),
      description: result.attributes.description.en,
      authors: result.relationships
        .filter(
          (relationship: any) =>
            relationship.type === "author" &&
            relationship.attributes !== undefined
        )
        .map((relationship: any) => relationship.attributes.name),
      artists: result.relationships
        .filter(
          (relationship: any) =>
            relationship.type === "artist" &&
            relationship.attributes !== undefined
        )
        .map((relationship: any) => relationship.attributes.name),
      tags: tags,
      status: SERIES_STATUS_MAP[result.attributes.status],
      originalLanguageKey: LANGUAGE_MAP[result.attributes.originalLanguage],
      numberUnread: 0,
      remoteCoverUrl,
    };
    return series;
  });

  const hasMore = json.total > json.offset + seriesList.length;
  return {
    seriesList,
    hasMore,
  };
};

const _getContentRatingsStr = (settings: { [key: string]: any }) => {
  const contentRatings: string[] = [];
  if (settings[SETTING_NAMES.INCLUDE_SAFE]) contentRatings.push("safe");
  if (settings[SETTING_NAMES.INCLUDE_ECCHI]) contentRatings.push("suggestive");
  if (settings[SETTING_NAMES.INCLUDE_SMUT]) contentRatings.push("erotica");
  if (settings[SETTING_NAMES.INCLUDE_PORNOGRAPHIC])
    contentRatings.push("pornographic");

  return contentRatings
    .map((rating: string) => `contentRating[]=${rating}`)
    .join("&");
};

export class ExtensionClient extends ExtensionClientAbstract {
  constructor(
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    super(fetchFn, webviewFn, domParser);
    this.settings = DEFAULT_SETTINGS;
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(
      `https://api.mangadex.org/manga?ids[]=${id}&includes[]=artist&includes[]=author&includes[]=cover_art`
    )
      .then((response: Response) => response.json())
      .then((json: any) => {
        const results: ParsedResults = _parseMangaResults(json);
        return results.seriesList.length > 0
          ? results.seriesList[0]
          : undefined;
      });
  };

  getChapters: GetChaptersFunc = async (
    sourceType: SeriesSourceType,
    id: string
  ) => {
    const chapterList: Chapter[] = [];
    let gotAllChapters: boolean = false;
    let offset = 0;
    while (!gotAllChapters) {
      const response = await this.fetchFn(
        `https://api.mangadex.org/manga/${id}/feed?offset=${offset}&limit=500&includes[]=scanlation_group`
      );
      const json = await response.json();
      json.data.forEach((result: any) => {
        const groupRelationship: any | undefined = result.relationships.find(
          (relationship: any) =>
            relationship.type === "scanlation_group" &&
            relationship.attributes !== undefined
        );
        const groupName =
          groupRelationship !== undefined
            ? groupRelationship.attributes.name
            : "";

        chapterList.push({
          id: undefined,
          seriesId: undefined,
          sourceId: result.id,
          title: result.attributes.title || "",
          chapterNumber: result.attributes.chapter || "0",
          volumeNumber: result.attributes.volume || "",
          languageKey: LANGUAGE_MAP[result.attributes.translatedLanguage],
          groupName,
          time: new Date(result.attributes.updatedAt).getTime(),
          read: false,
        });
      });

      if (json.total > offset + 500) {
        offset += 500;
      } else {
        gotAllChapters = true;
      }
    }

    return chapterList;
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(
      `https://api.mangadex.org/at-home/server/${chapterSourceId}`
    )
      .then((response: Response) => response.json())
      .then((json: any) => {
        const pageFilenames = this.settings[SETTING_NAMES.USE_DATA_SAVER]
          ? json.chapter.dataSaver
          : json.chapter.data;
        return {
          server: json.baseUrl,
          hash: json.chapter.hash,
          numPages: pageFilenames.length,
          pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    const dataStr = this.settings[SETTING_NAMES.USE_DATA_SAVER]
      ? "data-saver"
      : "data";
    return pageRequesterData.pageFilenames.map((filename: string) => {
      return `${pageRequesterData.server}/${dataStr}/${pageRequesterData.hash}/${filename}`;
    });
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.fetchFn(
      `https://api.mangadex.org/manga?${_getContentRatingsStr(
        this.settings
      )}&offset=${
        (page - 1) * PAGE_SIZE
      }&limit=${PAGE_SIZE}&includes[]=artist&includes[]=author&includes[]=cover_art`
    )
      .then((response: Response) => response.json())
      .then((json: any) => {
        const results: ParsedResults = _parseMangaResults(json);
        return {
          seriesList: results.seriesList,
          hasMore: results.hasMore,
        };
      });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.fetchFn(
      `https://api.mangadex.org/manga?title=${text}&${_getContentRatingsStr(
        this.settings
      )}&offset=${
        (page - 1) * PAGE_SIZE
      }&limit=${PAGE_SIZE}&includes[]=artist&includes[]=author&includes[]=cover_art`
    )
      .then((response: Response) => response.json())
      .then((json: any) => {
        const results: ParsedResults = _parseMangaResults(json);
        return {
          seriesList: results.seriesList,
          hasMore: results.hasMore,
        };
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return SETTING_TYPES;
  };

  getSettings: GetSettingsFunc = () => {
    return this.settings;
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {
    Object.keys(newSettings).forEach((key: string) => {
      if (
        key in this.settings &&
        typeof (this.settings[key] === newSettings[key])
      ) {
        this.settings[key] = newSettings[key];
      }
    });
  };
}
