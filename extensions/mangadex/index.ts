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
  DemographicKey,
  GenreKey,
  ThemeKey,
  FormatKey,
  ContentWarningKey,
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

const GENRE_MAP: { [key: string]: GenreKey } = {
  "07251805-a27e-4d59-b488-f0bfbec15168": GenreKey.THRILLER,
  "256c8bd9-4904-4360-bf4f-508a76d67183": GenreKey.SCI_FI,
  "33771934-028e-4cb3-8744-691e866a923e": GenreKey.HISTORICAL,
  "391b0423-d847-456f-aff0-8b0cfc03066b": GenreKey.ACTION,
  "5ca48985-9a9d-4bd8-be29-80dc0303db72": GenreKey.CRIME,
  "3b60b75c-a2d7-4860-ab56-05f391bb889c": GenreKey.PSYCHOLOGICAL,
  "423e2eae-a7a2-4a8b-ac03-a8351462d71d": GenreKey.ROMANCE,
  "4d32cc48-9f00-4cca-9b5a-a839f0764984": GenreKey.COMEDY,
  "50880a9d-5440-4732-9afb-8f457127e836": GenreKey.MECHA,
  "5920b825-4181-4a17-beeb-9918b0ff7a30": GenreKey.SHOUNEN_AI,
  "69964a64-2f90-4d33-beeb-f3ed2875eb4c": GenreKey.SPORTS,
  "7064a261-a137-4d3a-8848-2d385de3a99c": GenreKey.SUPERHERO,
  "81c836c9-914a-4eca-981a-560dad663e73": GenreKey.MAGICAL_GIRLS,
  "87cc87cd-a395-47af-b27a-93258283bbc6": GenreKey.ADVENTURE,
  "a3c67850-4684-404e-9b7f-c69850ee5da6": GenreKey.SHOUJO_AI,
  "acc803a4-c95a-4c22-86fc-eb6b582d82a2": GenreKey.WUXIA,
  "ace04997-f6bd-436e-b261-779182193d3d": GenreKey.ISEKAI,
  "b1e97889-25b4-4258-b28b-cd7f4d28ea9b": GenreKey.PHILOSOPHICAL,
  "b9af3a63-f058-46de-a9a0-e0c13906197a": GenreKey.DRAMA,
  "c8cbe35b-1b2b-4a3f-9c37-db84c4514856": GenreKey.MEDICAL,
  "cdad7e68-1419-41dd-bdce-27753074a640": GenreKey.HORROR,
  "cdc58593-87dd-415e-bbc0-2ec27bf404cc": GenreKey.FANTASY,
  "e5301a23-ebd9-49dd-a0cb-2add944c7fe9": GenreKey.SLICE_OF_LIFE,
  "ee968100-4191-4968-93d3-f82d72be7e46": GenreKey.MYSTERY,
  "f8f62932-27da-4fe4-8ee1-6779a8c5edba": GenreKey.TRAGEDY,
};

const THEME_MAP: { [key: string]: ThemeKey } = {
  "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0": ThemeKey.REINCARNATION,
  "292e862b-2d17-4062-90a2-0356caa4ae27": ThemeKey.TIME_TRAVEL,
  "2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a": ThemeKey.GENDERSWAP,
  "2d1f5d56-a1e5-4d0d-a961-2193588b08ec": ThemeKey.LOLI,
  "31932a7e-5b8e-49a6-9f12-2afa39dc544c": ThemeKey.TRADITIONAL_GAMES,
  "36fd93ea-e8b8-445e-b836-358f02b3d33d": ThemeKey.MONSTERS,
  "39730448-9a5f-48a2-85b0-a70db87b1233": ThemeKey.DEMONS,
  "3bb26d85-09d5-4d2e-880c-c34b974339e9": ThemeKey.GHOSTS,
  "3de8c75d-8ee3-48ff-98ee-e20a65c86451": ThemeKey.ANIMALS,
  "489dd859-9b61-4c37-af75-5b18e88daafc": ThemeKey.NINJA,
  "5bd0e105-4481-44ca-b6e7-7544da56b1a3": ThemeKey.INCEST,
  "5fff9cde-849c-4d78-aab0-0d52b2ee1d25": ThemeKey.SURVIVAL,
  "631ef465-9aba-4afb-b0fc-ea10efe274a8": ThemeKey.ZOMBIES,
  "65761a2a-415e-47f3-bef2-a9dababba7a6": ThemeKey.REVERSE_HAREM,
  "799c202e-7daa-44eb-9cf7-8a3c0441531e": ThemeKey.MARTIAL_ARTS,
  "81183756-1453-4c81-aa9e-f6e1b63be016": ThemeKey.SAMURAI,
  "85daba54-a71c-4554-8a28-9901a8b0afad": ThemeKey.MAFIA,
  "fad12b5e-68ba-460e-b933-9ae8318f5b65": ThemeKey.GYARU,
  "8c86611e-fab7-4986-9dec-d1a2f44acdd5": ThemeKey.VIRTUAL_REALITY,
  "92d6d951-ca5e-429c-ac78-451071cbf064": ThemeKey.OFFICE_WORKERS,
  "9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8": ThemeKey.VIDEO_GAMES,
  "9467335a-1b83-4497-9231-765337a00b96": ThemeKey.POST_APOCALYPTIC,
  "9ab53f92-3eed-4e9b-903a-917c86035ee3": ThemeKey.CROSSDRESSING,
  "a1f53773-c69a-4ce5-8cab-fffcd90b1565": ThemeKey.MAGIC,
  "aafb99c1-7f60-43fa-b75f-fc9502ce29c7": ThemeKey.HAREM,
  "caaa44eb-cd40-4177-b930-79d3ef2afe87": ThemeKey.SCHOOL_LIFE,
  "ac72833b-c4e9-4878-b9db-6c8a4a99444a": ThemeKey.MILITARY,
  "d14322ac-4d6f-4e9b-afd9-629d5f4d8a41": ThemeKey.VILLAINESS,
  "d7d1730f-6eb0-4ba6-9437-602cac38664c": ThemeKey.VAMPIRES,
  "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea": ThemeKey.DELINQUENTS,
  "dd1f77c5-dea9-4e2b-97ae-224af09caf99": ThemeKey.MONSTER_GIRLS,
  "ddefd648-5140-4e5f-ba18-4eca4071d19b": ThemeKey.SHOTA,
  "df33b754-73a3-4c54-80e6-1a74a8058539": ThemeKey.POLICE,
  "e64f6742-c834-471d-8d72-dd51fc02b835": ThemeKey.ALIENS,
  "ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869": ThemeKey.COOKING,
  "eabc5b4c-6aff-42f3-b657-3e90cbd00b75": ThemeKey.SUPERNATURAL,
  "f42fbf9e-188a-447b-9fdc-f19dc1e4d685": ThemeKey.MUSIC,
};

const FORMAT_MAP: { [key: string]: FormatKey } = {
  "0234a31e-a729-4e28-9d6a-3f87c4966b9e": FormatKey.ONESHOT,
  "0a39b5a1-b235-4886-a747-1d05d216532d": FormatKey.AWARD_WINNING,
  "320831a8-4026-470b-94f6-8353740e6f04": FormatKey.OFFICIAL_COLORED,
  "3e2b8dae-350e-4ab8-a8ce-016e844b9f0d": FormatKey.LONG_STRIP,
  "51d83883-4103-437c-b4b1-731cb73d786c": FormatKey.ANTHOLOGY,
  "7b2ce280-79ef-4c09-9b58-12b7c23a9b78": FormatKey.FAN_COLORED,
  "891cf039-b895-47f0-9229-bef4c96eccd4": FormatKey.USER_CREATED,
  "b11fda93-8f1d-4bef-b2ed-8803d3733170": FormatKey.YONKOMA,
  "b13b2a48-c720-44a9-9c77-39c9979373fb": FormatKey.DOUJINSHI,
  "e197df38-d0e7-43b5-9b09-2842d0c326dd": FormatKey.WEB_COMIC,
  "f4122d1c-3b44-44d0-9936-ff7502c39ad3": FormatKey.ADAPTATION,
  "f5ba408b-0e7a-484d-8d49-4e9125ac96de": FormatKey.FULL_COLOR,
};

const CONTENT_WARNING_MAP: { [key: string]: ContentWarningKey } = {
  "97893a4c-12af-4dac-b6be-0dffb353568e": ContentWarningKey.SEXUAL_VIOLENCE,
  "b29d6a3d-1569-4e7a-8caf-7557bc92cd5d": ContentWarningKey.GORE,
};

const DEMOGRAPHIC_MAP: { [key: string]: DemographicKey } = {
  shounen: DemographicKey.SHOUNEN,
  shoujo: DemographicKey.SHOUJO,
  josei: DemographicKey.JOSEI,
  seinen: DemographicKey.SEINEN,
  none: DemographicKey.UNCERTAIN,
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

const PAGE_SIZE = 24;

type ParsedResults = {
  seriesList: Series[];
  hasMore: boolean;
};

const _parseMangaResults = (json: any): ParsedResults => {
  if (!("data" in json) || json.data === undefined || json.data.length === 0) {
    return { seriesList: [], hasMore: false };
  }

  const seriesList = json.data.map((result: any) => {
    const genres: GenreKey[] = [];
    const themes: ThemeKey[] = [];
    const formats: FormatKey[] = [];
    const contentWarnings: ContentWarningKey[] = [];

    result.attributes.tags.forEach((tag: any) => {
      const tagId: string = tag.id;
      if (tagId in GENRE_MAP) {
        genres.push(GENRE_MAP[tagId]);
      }
      if (tagId in THEME_MAP) {
        themes.push(THEME_MAP[tagId]);
      }
      if (tagId in FORMAT_MAP) {
        formats.push(FORMAT_MAP[tagId]);
      }
      if (tagId in CONTENT_WARNING_MAP) {
        contentWarnings.push(CONTENT_WARNING_MAP[tagId]);
      }
    });

    switch (result.attributes.contentRating) {
      case "suggestive":
        contentWarnings.push(ContentWarningKey.ECCHI);
        break;
      case "erotica":
        contentWarnings.push(ContentWarningKey.SMUT);
        break;
      case "pornographic":
        contentWarnings.push(ContentWarningKey.PORNOGRAPHIC);
        break;
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
      genres: genres,
      themes: themes,
      formats: formats,
      contentWarnings: contentWarnings,
      demographic:
        result.attributes.publicationDemographic === null
          ? DemographicKey.UNCERTAIN
          : DEMOGRAPHIC_MAP[result.attributes.publicationDemographic],
      status: SERIES_STATUS_MAP[result.attributes.status],
      originalLanguageKey: LANGUAGE_MAP[result.attributes.originalLanguage],
      numberUnread: 0,
      remoteCoverUrl,
      userTags: [],
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
