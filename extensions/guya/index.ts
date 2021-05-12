import {
  FetchSeriesFunc,
  FetchChaptersFunc,
  ParseSeriesFunc,
  ParseChaptersFunc,
  ParsePageRequesterDataFunc,
  FetchPageRequesterDataFunc,
  GetPageUrlsFunc,
  FetchSearchFunc,
  ParseSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
  PageRequesterData,
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
import {
  FetchDirectoryFunc,
  ParseDirectoryFunc,
} from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = metadata;

export const fetchSeries: FetchSeriesFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
) => {
  return fetchFn(`https://guya.moe/api/series/${id}`);
};

export const parseSeries: ParseSeriesFunc = (
  sourceType: SeriesSourceType,
  json: any,
  domParser: DOMParser
): Series => {
  const series: Series = {
    id: undefined,
    extensionId: METADATA.id,
    sourceId: json.slug,
    sourceType: SeriesSourceType.STANDARD,
    title: json.title,
    altTitles: [],
    description: json.description,
    authors: [json.author],
    artists: [json.artist],
    genres: [],
    themes: [],
    formats: [],
    contentWarnings: [],
    status: SeriesStatus.ONGOING,
    originalLanguageKey: LanguageKey.JAPANESE,
    numberUnread: 0,
    remoteCoverUrl: `https://guya.moe/${json.cover}`,
    userTags: [],
  };
  return series;
};

export const fetchChapters: FetchChaptersFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
) => {
  return fetchFn(`https://guya.moe/api/series/${id}`);
};

export const parseChapters: ParseChaptersFunc = (
  sourceType: SeriesSourceType,
  json: any,
  domParser: DOMParser
): Chapter[] => {
  const chapters: Chapter[] = [];
  const { groups } = json;

  Object.keys(json.chapters).forEach((chapterNum: string) => {
    const chapterData = json.chapters[chapterNum];
    Object.keys(json.chapters[chapterNum].groups).forEach(
      (groupNum: string) => {
        chapters.push({
          id: undefined,
          seriesId: undefined,
          sourceId: `${chapterNum}:${json.slug}/chapters/${chapterData.folder}/${groupNum}`,
          title: chapterData.title,
          chapterNumber: chapterNum,
          volumeNumber: chapterData.volume,
          languageKey: LanguageKey.ENGLISH,
          groupName: groups[groupNum],
          time: chapterData.release_date[groupNum],
          read: false,
        });
      }
    );
  });

  return chapters;
};

export const fetchPageRequesterData: FetchPageRequesterDataFunc = (
  sourceType: SeriesSourceType,
  seriesSourceId: string,
  chapterSourceId: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return fetchFn(`https://guya.moe/api/series/${seriesSourceId}`);
};

export const parsePageRequesterData: ParsePageRequesterDataFunc = (
  json: any,
  chapterSourceId: string,
  domParser: DOMParser
): PageRequesterData => {
  const chapterNum = chapterSourceId.split(":")[0];
  let groupNum = chapterSourceId.split("/").pop();
  groupNum = groupNum ? groupNum : "";

  const pageBasenames: string[] = json.chapters[chapterNum].groups[groupNum];
  const pageFilenames = pageBasenames.map((basename: string) => {
    return `https://guya.moe/media/manga/${chapterSourceId
      .split(":")
      .pop()}/${basename}`;
  });

  return {
    server: "",
    hash: "",
    numPages: pageFilenames.length,
    pageFilenames,
  };
};

export const getPageUrls: GetPageUrlsFunc = (
  pageRequesterData: PageRequesterData
) => {
  return pageRequesterData.pageFilenames;
};

export const getPageData: GetPageDataFunc = (series: Series, url: string) => {
  return new Promise((resolve, reject) => {
    resolve(url);
  });
};

export const fetchDirectory: FetchDirectoryFunc = (
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return fetchFn(`https://guya.moe/api/get_all_series`);
};

export const parseDirectory: ParseDirectoryFunc = (
  json: any,
  domParser: DOMParser
) => {
  const seriesList: Series[] = [];

  Object.keys(json).forEach((title: string) => {
    const seriesData = json[title];
    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: seriesData.slug,
      sourceType: SeriesSourceType.STANDARD,
      title: title,
      altTitles: [],
      description: seriesData.description,
      authors: [seriesData.author],
      artists: [seriesData.artist],
      genres: [],
      themes: [],
      formats: [],
      contentWarnings: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: `https://guya.moe/${seriesData.cover}`,
      userTags: [],
    };
    seriesList.push(series);
  });

  return seriesList;
};

export const fetchSearch: FetchSearchFunc = (
  text: string,
  params: { [key: string]: string },
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return fetchDirectory(fetchFn, webviewFunc);
};

export const parseSearch: ParseSearchFunc = (
  json: any,
  domParser: DOMParser
) => {
  return parseDirectory(json, domParser);
};
