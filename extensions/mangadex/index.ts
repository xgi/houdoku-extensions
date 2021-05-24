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
} from "houdoku-extension-lib";
import {
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response, RequestInfo, RequestInit } from "node-fetch";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";

export const METADATA: ExtensionMetadata = metadata;

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
  zh: LanguageKey.CHINESE_TRAD,
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
  ko: LanguageKey.KOREAN,
  lt: LanguageKey.LITHUANIAN,
  ms: LanguageKey.MALAY,
  pl: LanguageKey.POLISH,
  pt: LanguageKey.PORTUGUESE_PT,
  ro: LanguageKey.ROMANIAN,
  ru: LanguageKey.RUSSIAN,
  es: LanguageKey.SPANISH_ES,
  sv: LanguageKey.SWEDISH,
  th: LanguageKey.THAI,
  tr: LanguageKey.TURKISH,
  uk: LanguageKey.UKRAINIAN,
  vi: LanguageKey.VIETNAMESE,
};

const _parseMangaResults = (
  json: any,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
) => {
  const seriesList: Series[] = [];
  const resultList: any[] = [];
  let authorIds: string[] = [];
  let artistIds: string[] = [];
  let coverIds: string[] = [];
  let authorMap: { [key: string]: string } = {};
  let artistMap: { [key: string]: string } = {};
  // let coverMap: { [key: string]: string } = {};

  return new Promise<any>((resolve) => resolve(json))
    .then((json: any) => {
      json.results.forEach((result: any) => {
        resultList.push(result);

        result.relationships.forEach((relationship: any) => {
          if (relationship.type === "author") authorIds.push(relationship.id);
          if (relationship.type === "artist") artistIds.push(relationship.id);
          if (relationship.type === "cover_art") coverIds.push(relationship.id);
        });
      });

      const authorIdsStr = authorIds
        .map((id: string) => `ids[]=${id}`)
        .join("&");
      return fetchFn(
        `https://api.mangadex.org/author?limit=${
          authorIdsStr.length > 100 ? 100 : authorIdsStr.length
        }&${authorIdsStr}`
      );
    })
    .then((response: Response) => response.json())
    .then((json: any) => {
      // retrieved data for authors
      json.results.forEach((result: any) => {
        authorMap[result.data.id] = result.data.attributes.name;
      });

      const artistIdsStr = artistIds
        .map((id: string) => `ids[]=${id}`)
        .join("&");
      return fetchFn(
        `https://api.mangadex.org/author?limit=${
          artistIdsStr.length > 100 ? 100 : artistIdsStr.length
        }&${artistIdsStr}`
      );
    })
    .then((response: Response) => response.json())
    .then((json: any) => {
      // retrieved data for artists
      json.results.forEach((result: any) => {
        artistMap[result.data.id] = result.data.attributes.name;
      });

      const coverIdsStr = coverIds.map((id: string) => `ids[]=${id}`).join("&");
      return fetchFn(
        `https://api.mangadex.org/cover?limit=${
          coverIdsStr.length > 100 ? 100 : coverIdsStr.length
        }&${coverIdsStr}`
      );
    })
    .then((response: Response) => response.json())
    .then((json: any) => {
      // retrieved data for covers
      // TODO: support covers

      resultList.map((result: any) => {
        const series: Series = {
          id: undefined,
          extensionId: METADATA.id,
          sourceId: result.data.id,
          sourceType: SeriesSourceType.STANDARD,
          title: result.data.attributes.title.en,
          altTitles: result.data.attributes.altTitles.map(
            (altTitleCont: any) => altTitleCont.en
          ),
          description: result.data.attributes.description.en,
          authors: result.relationships
            .filter((relationship: any) => relationship.type === "author")
            .map((relationship: any) => authorMap[relationship.id]),
          artists: result.relationships
            .filter((relationship: any) => relationship.type === "artist")
            .map((relationship: any) => artistMap[relationship.id]),
          genres: [],
          themes: [],
          formats: [],
          contentWarnings: [],
          status: SERIES_STATUS_MAP[result.data.attributes.status],
          originalLanguageKey:
            LANGUAGE_MAP[result.data.attributes.originalLanguage],
          numberUnread: 0,
          remoteCoverUrl: "https://i.imgur.com/6TrIues.jpeg",
          userTags: [],
        };
        seriesList.push(series);
      });

      return seriesList;
    });
};

export const getSeries: GetSeriesFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  return fetchFn(`https://api.mangadex.org/manga?ids[]=${id}`)
    .then((response: Response) => response.json())
    .then((json: any) => _parseMangaResults(json, fetchFn))
    .then((results: any[]) => results[0]);
};

export const getChapters: GetChaptersFunc = async (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  const chapterIdList: string[] = [];
  let gotAllChapterIds: boolean = false;
  let offset = 0;
  while (!gotAllChapterIds) {
    const response = await fetchFn(
      `https://api.mangadex.org/manga/${id}/feed?limit=500&offset=${offset}`
    );
    const json = await response.json();
    json.results.forEach((result: any) => chapterIdList.push(result.data.id));

    if (json.total > offset + 500) {
      offset += 500;
    } else {
      gotAllChapterIds = true;
    }
  }

  const chapterList: Chapter[] = [];
  let gotAllChapters: boolean = false;
  offset = 0;
  while (!gotAllChapters) {
    const curChapterIds: string[] = chapterIdList.slice(offset, offset + 100);
    const chapterIdsStr = curChapterIds
      .map((id: string) => `ids[]=${id}`)
      .join("&");

    const response = await fetchFn(
      `https://api.mangadex.org/chapter?limit=100&${chapterIdsStr}`
    );
    const json = await response.json();
    json.results.forEach((result: any) => {
      chapterList.push({
        id: undefined,
        seriesId: undefined,
        sourceId: result.data.id,
        title: result.data.attributes.title,
        chapterNumber: result.data.attributes.chapter,
        volumeNumber: result.data.attributes.volume || "",
        languageKey: LANGUAGE_MAP[result.data.attributes.translatedLanguage],
        groupName: "", // TODO
        time: new Date(result.data.attributes.updatedAt).getTime(),
        read: false,
      });
    });

    if (json.total > offset + 100) {
      offset += 100;
    } else {
      gotAllChapters = true;
    }
  }

  return chapterList;
};

export const getPageRequesterData: GetPageRequesterDataFunc = (
  sourceType: SeriesSourceType,
  seriesSourceId: string,
  chapterSourceId: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  let baseUrl: string;

  return fetchFn(`https://api.mangadex.org/at-home/server/${chapterSourceId}`)
    .then((response: Response) => response.json())
    .then((json: any) => {
      baseUrl = json.baseUrl;

      return fetchFn(`https://api.mangadex.org/chapter/${chapterSourceId}`);
    })
    .then((response: Response) => response.json())
    .then((json: any) => {
      const pageFilenames = json.data.attributes.data;
      return {
        server: baseUrl,
        hash: json.data.attributes.hash,
        numPages: pageFilenames.length,
        pageFilenames,
      };
    });
};

export const getPageUrls: GetPageUrlsFunc = (
  pageRequesterData: PageRequesterData
) => {
  return pageRequesterData.pageFilenames.map((filename: string) => {
    return `${pageRequesterData.server}/data/${pageRequesterData.hash}/${filename}`;
  });
};

export const getPageData: GetPageDataFunc = (series: Series, url: string) => {
  return new Promise((resolve, reject) => {
    resolve(url);
  });
};

export const getDirectory: GetDirectoryFunc = (
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  return fetchFn(`https://api.mangadex.org/manga?title=${"solo"}`)
    .then((response: Response) => response.json())
    .then((json: any) => _parseMangaResults(json, fetchFn))
    .then((results: any[]) => results);
};

export const getSearch: GetSearchFunc = (
  text: string,
  params: { [key: string]: string },
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  return getDirectory(fetchFn, webviewFunc, domParser);
};
