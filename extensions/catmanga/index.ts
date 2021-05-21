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
  ContentWarningKey,
  FormatKey,
  ThemeKey,
  GenreKey,
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

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  ongoing: SeriesStatus.ONGOING,
  completed: SeriesStatus.COMPLETED,
};

const GENRE_MAP: { [key: string]: GenreKey } = {
  action: GenreKey.ACTION,
  adventure: GenreKey.ADVENTURE,
  comedy: GenreKey.COMEDY,
  crime: GenreKey.CRIME,
  drama: GenreKey.DRAMA,
  fantasy: GenreKey.FANTASY,
  historical: GenreKey.HISTORICAL,
  horror: GenreKey.HORROR,
  isekai: GenreKey.ISEKAI,
  mystery: GenreKey.MYSTERY,
  psychological: GenreKey.PSYCHOLOGICAL,
  romance: GenreKey.ROMANCE,
  scifi: GenreKey.SCI_FI,
  sliceoflife: GenreKey.SLICE_OF_LIFE,
  sports: GenreKey.SPORTS,
  thriller: GenreKey.THRILLER,
  tragedy: GenreKey.TRAGEDY,
  yaoi: GenreKey.YAOI,
  yuri: GenreKey.YURI,
};

const THEME_MAP: { [key: string]: ThemeKey } = {
  harem: ThemeKey.HAREM,
  incest: ThemeKey.INCEST,
  office: ThemeKey.OFFICE_WORKERS,
  schoollife: ThemeKey.SCHOOL_LIFE,
  supernatural: ThemeKey.SUPERNATURAL,
};

const FORMAT_MAP: { [key: string]: FormatKey } = {};

const CONTENT_WARNING_MAP: { [key: string]: ContentWarningKey } = {};

const mapSeriesData = (seriesData: any): Series => {
  const genres: GenreKey[] = [];
  const themes: ThemeKey[] = [];
  const formats: FormatKey[] = [];
  const contentWarnings: ContentWarningKey[] = [];

  seriesData.genres.forEach((genre: string) => {
    const tagStr = genre.trim().replace(" ", "").replace("-", "").toLowerCase();
    if (tagStr !== undefined) {
      if (tagStr in GENRE_MAP) {
        genres.push(GENRE_MAP[tagStr]);
      }
      if (tagStr in THEME_MAP) {
        themes.push(THEME_MAP[tagStr]);
      }
      if (tagStr in FORMAT_MAP) {
        formats.push(FORMAT_MAP[tagStr]);
      }
      if (tagStr in CONTENT_WARNING_MAP) {
        contentWarnings.push(CONTENT_WARNING_MAP[tagStr]);
      }
    }
  });

  const series: Series = {
    id: undefined,
    extensionId: METADATA.id,
    sourceId: seriesData.series_id,
    sourceType: SeriesSourceType.STANDARD,
    title: seriesData.title,
    altTitles: seriesData.altTitles,
    description: seriesData.description,
    authors: [seriesData.authors],
    artists: [],
    genres: genres,
    themes: themes,
    formats: formats,
    contentWarnings: contentWarnings,
    status: SERIES_STATUS_MAP[seriesData.status],
    originalLanguageKey: LanguageKey.JAPANESE,
    numberUnread: 0,
    remoteCoverUrl: seriesData.cover_art.source,
    userTags: [],
  };
  return series;
};

export const fetchSeries: FetchSeriesFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
) => {
  return fetchFn(`https://catmanga.org/series/${id}`);
};

export const parseSeries: ParseSeriesFunc = (
  sourceType: SeriesSourceType,
  data: any,
  domParser: DOMParser
): Series => {
  const doc = domParser.parseFromString(data);
  const nextDataText = doc.getElementById("__NEXT_DATA__").textContent;
  const nextData = JSON.parse(nextDataText);

  const seriesData = nextData.props.pageProps.series;
  return mapSeriesData(seriesData);
};

export const fetchChapters: FetchChaptersFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>
) => {
  return fetchFn(`https://catmanga.org/series/${id}`);
};

export const parseChapters: ParseChaptersFunc = (
  sourceType: SeriesSourceType,
  data: any,
  domParser: DOMParser
): Chapter[] => {
  const doc = domParser.parseFromString(data);
  const nextDataText = doc.getElementById("__NEXT_DATA__").textContent;
  const nextData = JSON.parse(nextDataText);

  return nextData.props.pageProps.series.chapters.map((chapterData: any) => {
    const chapter: Chapter = {
      id: undefined,
      seriesId: undefined,
      sourceId: `${chapterData.number}`,
      title: chapterData.title,
      chapterNumber: `${chapterData.number}`,
      volumeNumber: "",
      languageKey: LanguageKey.ENGLISH,
      groupName: chapterData.groups[0],
      time: 0,
      read: false,
    };
    return chapter;
  });
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
  return fetchFn(
    `https://catmanga.org/series/${seriesSourceId}/${chapterSourceId}`
  );
};

export const parsePageRequesterData: ParsePageRequesterDataFunc = (
  data: any,
  chapterSourceId: string,
  domParser: DOMParser
): PageRequesterData => {
  const doc = domParser.parseFromString(data);
  const nextDataText = doc.getElementById("__NEXT_DATA__").textContent;
  const nextData = JSON.parse(nextDataText);

  const pages = nextData.props.pageProps.pages;

  return {
    server: "",
    hash: "",
    numPages: pages.length,
    pageFilenames: pages,
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
  return fetchFn(`https://catmanga.org`);
};

export const parseDirectory: ParseDirectoryFunc = (
  data: any,
  domParser: DOMParser
) => {
  const doc = domParser.parseFromString(data);
  const nextDataText = doc.getElementById("__NEXT_DATA__").textContent;
  const nextData = JSON.parse(nextDataText);

  return nextData.props.pageProps.latests.map((entry: any) => {
    const seriesData = entry[0];
    return mapSeriesData(seriesData);
  });
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
  return fetchFn(`https://catmanga.org`);
};

export const parseSearch: ParseSearchFunc = (
  data: any,
  text: string,
  params: { [key: string]: string },
  domParser: DOMParser
) => {
  const doc = domParser.parseFromString(data);
  const nextDataText = doc.getElementById("__NEXT_DATA__").textContent;
  const nextData = JSON.parse(nextDataText);

  const seriesList: Series[] = nextData.props.pageProps.series.map(
    (seriesData: any) => {
      return mapSeriesData(seriesData);
    }
  );

  return seriesList.filter((series: Series) => {
    return series.title.toLowerCase().includes(text.toLowerCase());
  });
};
