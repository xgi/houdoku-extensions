import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  Chapter,
  LanguageKey,
  Series,
  SeriesStatus,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SettingType,
  FilterValues,
  FilterCheckbox,
  FilterMultiToggle,
  FilterSelect,
  FilterSeparator,
  FilterSort,
  SortDirection,
  TriState,
  MultiToggleValues,
  FilterSortValue,
  FilterCycle,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { GetFilterOptionsFunc, UtilFunctions } from "houdoku-extension-lib/dist/interface";
import {
  FIELDS_CONTENT_RATINGS,
  FIELDS_CONTENT_WARNINGS,
  FIELDS_DEMOGRAPHICS,
  FIELDS_FORMATS,
  FIELDS_GENRES,
  FIELDS_ORIGINAL_LANGUAGES,
  FIELDS_SORT,
  FIELDS_STATUS,
  FIELDS_THEMES,
  FilterControlIds,
  OPTIONS_TAG_MODE,
} from "./filters";

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
}

const SETTING_TYPES = {
  [SETTING_NAMES.USE_DATA_SAVER]: SettingType.BOOLEAN,
};

const DEFAULT_SETTINGS = {
  [SETTING_NAMES.USE_DATA_SAVER]: false,
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
    const tags: string[] = result.attributes.tags.map((tag: any) => tag.attributes.name.en);
    if (result.attributes.publicationDemographic !== null) {
      tags.push(result.attributes.publicationDemographic);
    }

    const title =
      result.attributes.title.en !== undefined
        ? result.attributes.title.en
        : Object.values(result.attributes.title)[0];

    const coverRelationship = result.relationships.find(
      (relationship: any) =>
        relationship.type === "cover_art" && relationship.attributes !== undefined
    );
    const remoteCoverUrl =
      coverRelationship !== undefined
        ? `https://uploads.mangadex.org/covers/${result.id}/${coverRelationship.attributes.fileName}.512.jpg`
        : "";

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: result.id,

      title,
      altTitles: result.attributes.altTitles.map((altTitleCont: any) => altTitleCont.en),
      description: result.attributes.description.en,
      authors: result.relationships
        .filter(
          (relationship: any) =>
            relationship.type === "author" && relationship.attributes !== undefined
        )
        .map((relationship: any) => relationship.attributes.name),
      artists: result.relationships
        .filter(
          (relationship: any) =>
            relationship.type === "artist" && relationship.attributes !== undefined
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

export class ExtensionClient extends ExtensionClientAbstract {
  constructor(utilFns: UtilFunctions) {
    super(utilFns);
    this.settings = DEFAULT_SETTINGS;
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns
      .fetchFn(
        `https://api.mangadex.org/manga?ids[]=${id}&includes[]=artist&includes[]=author&includes[]=cover_art`
      )
      .then((response: Response) => response.json())
      .then((json: any) => {
        const results: ParsedResults = _parseMangaResults(json);
        return results.seriesList.length > 0 ? results.seriesList[0] : undefined;
      });
  };

  getChapters: GetChaptersFunc = async (id: string) => {
    const chapterList: Chapter[] = [];
    let gotAllChapters: boolean = false;
    let offset = 0;
    while (!gotAllChapters) {
      const response = await this.utilFns.fetchFn(
        `https://api.mangadex.org/manga/${id}/feed?offset=${offset}&limit=500&includes[]=scanlation_group`
      );
      const json = await response.json();
      json.data.forEach((result: any) => {
        const groupRelationship: any | undefined = result.relationships.find(
          (relationship: any) =>
            relationship.type === "scanlation_group" && relationship.attributes !== undefined
        );
        const groupName = groupRelationship !== undefined ? groupRelationship.attributes.name : "";

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
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.utilFns
      .fetchFn(`https://api.mangadex.org/at-home/server/${chapterSourceId}`)
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
    const dataStr = this.settings[SETTING_NAMES.USE_DATA_SAVER] ? "data-saver" : "data";
    return pageRequesterData.pageFilenames.map((filename: string) => {
      return `${pageRequesterData.server}/${dataStr}/${pageRequesterData.hash}/${filename}`;
    });
  };

  getImage: GetImageFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number, filterValues: FilterValues) => {
    return this.getSearch("", page, filterValues);
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    const params = new URLSearchParams({
      title: text,
      offset: `${(page - 1) * PAGE_SIZE}`,
      limit: `${PAGE_SIZE}`,
    });
    ["artist", "author", "cover_art"].forEach((name) => params.append("includes[]", name));

    const _applyTags = (controlId: string) => {
      if (controlId in filterValues) {
        Object.entries(filterValues[controlId] as MultiToggleValues).forEach(([tagId, value]) => {
          if (value === TriState.INCLUDE) params.append("includedTags[]", tagId);
          if (value === TriState.EXCLUDE) params.append("excludedTags[]", tagId);
        });
      }
    };
    _applyTags(FilterControlIds.Formats);
    _applyTags(FilterControlIds.Genres);
    _applyTags(FilterControlIds.Themes);
    _applyTags(FilterControlIds.ContentWarnings);

    if (FilterControlIds.ContentRating in filterValues) {
      Object.entries(filterValues[FilterControlIds.ContentRating] as MultiToggleValues).forEach(
        ([contentRating, value]) => {
          if (value === TriState.INCLUDE) params.append("contentRating[]", contentRating);
        }
      );
    }
    if (FilterControlIds.Status in filterValues) {
      Object.entries(filterValues[FilterControlIds.Status] as MultiToggleValues).forEach(
        ([status, value]) => {
          if (value === TriState.INCLUDE) params.append("status[]", status);
        }
      );
    }
    if (FilterControlIds.Sort in filterValues) {
      const sort = filterValues[FilterControlIds.Sort] as FilterSortValue;
      params.append(
        `order[${sort.key}]`,
        { [SortDirection.ASCENDING]: "asc", [SortDirection.DESCENDING]: "desc" }[sort.direction]
      );
    }
    if (FilterControlIds.Demographic in filterValues) {
      Object.entries(filterValues[FilterControlIds.Demographic] as MultiToggleValues).forEach(
        ([demo, value]) => {
          if (value === TriState.INCLUDE) params.append("publicationDemographic[]", demo);
        }
      );
    }
    if (FilterControlIds.OriginalLanguage in filterValues) {
      Object.entries(filterValues[FilterControlIds.OriginalLanguage] as MultiToggleValues).forEach(
        ([lang, value]) => {
          if (value === TriState.INCLUDE) {
            params.append("originalLanguage[]", lang);
            if (lang === "zh") params.append("originalLanguage[]", "zh-hk");
          }
        }
      );
    }
    if (FilterControlIds.HasAvailableChapters in filterValues) {
      if (filterValues[FilterControlIds.HasAvailableChapters] === true) {
        params.append("hasAvailableChapters", "true");
      }
    }

    return this.utilFns
      .fetchFn("https://api.mangadex.org/manga?" + params)
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
      if (key in this.settings && typeof (this.settings[key] === newSettings[key])) {
        this.settings[key] = newSettings[key];
      }
    });
  };

  getFilterOptions: GetFilterOptionsFunc = () => {
    return [
      new FilterCheckbox(FilterControlIds.HasAvailableChapters, "Has available chapters", false),
      new FilterSort(FilterControlIds.Sort, "Sort", {
        key: "relevance",
        direction: SortDirection.DESCENDING,
      })
        .withFields(FIELDS_SORT)
        .withSupportsBothDirections(true),

      new FilterSeparator("separator1", "", ""),

      new FilterMultiToggle(FilterControlIds.Formats, "Format", {})
        .withFields(FIELDS_FORMATS)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.Themes, "Theme", {})
        .withFields(FIELDS_THEMES)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.Genres, "Genre", {})
        .withFields(FIELDS_GENRES)
        .withIsTriState(true),
      new FilterMultiToggle(FilterControlIds.ContentWarnings, "Content Warning", {})
        .withFields(FIELDS_CONTENT_WARNINGS)
        .withIsTriState(true),

      new FilterSeparator("separator2", "", ""),

      new FilterMultiToggle(FilterControlIds.OriginalLanguage, "Original Language", {})
        .withFields(FIELDS_ORIGINAL_LANGUAGES)
        .withIsTriState(false),
      new FilterMultiToggle(FilterControlIds.Demographic, "Demographic", {})
        .withFields(FIELDS_DEMOGRAPHICS)
        .withIsTriState(false),
      new FilterMultiToggle(FilterControlIds.ContentRating, "Content Rating", {
        safe: TriState.INCLUDE,
        suggestive: TriState.INCLUDE,
        erotica: TriState.INCLUDE,
      })
        .withFields(FIELDS_CONTENT_RATINGS)
        .withIsTriState(false),
      new FilterMultiToggle(FilterControlIds.Status, "Status", {})
        .withFields(FIELDS_STATUS)
        .withIsTriState(false),

      new FilterSeparator("separator3", "", ""),

      new FilterCycle(FilterControlIds.IncludedTagsMode, "Included Tags Mode", "AND").withOptions(
        OPTIONS_TAG_MODE
      ),
      new FilterCycle(FilterControlIds.ExcludedTagsMode, "Excluded Tags Mode", "OR").withOptions(
        OPTIONS_TAG_MODE
      ),
    ];
  };
}
