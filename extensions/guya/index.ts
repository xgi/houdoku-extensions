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
import { Response } from "node-fetch";
import metadata from "./metadata.json";

export const METADATA: ExtensionMetadata = metadata;

export const fetchSeries: FetchSeriesFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (url: string) => Promise<Response>
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
    remoteCoverUrl: json.cover,
    userTags: [],
  };
  return series;
};

export const fetchChapters: FetchChaptersFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (url: string) => Promise<Response>
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
    const chapterData = json.chapters.chapterNum;
    Object.keys(json.chapters.chapterNum.groups).forEach((groupNum: string) => {
      chapters.push({
        id: undefined,
        seriesId: undefined,
        sourceId: `${json.slug}/chapters/${chapterData.folder}/${groupNum}`,
        title: chapterData.title,
        chapterNumber: chapterNum,
        volumeNumber: chapterData.volume,
        languageKey: LanguageKey.ENGLISH,
        groupName: groups.groupNum,
        time: chapterData.release_date.groupNum,
        read: false,
      });
    });
  });

  return chapters;
};

export const fetchPageRequesterData: FetchPageRequesterDataFunc = (
  sourceType: SeriesSourceType,
  seriesSourceId: string,
  chapterSourceId: string,
  fetchFn: (url: string) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return fetchFn(`https://mangadex.org/api/v2/chapter/${chapterSourceId}`);
};

export const parsePageRequesterData: ParsePageRequesterDataFunc = (
  json: any,
  domParser: DOMParser
): PageRequesterData => {
  const pageFilenames: string[] = [];
  json.data.pages.forEach((filename: string) => pageFilenames.push(filename));

  return {
    server: json.data.server,
    hash: json.data.hash,
    numPages: pageFilenames.length,
    pageFilenames,
  };
};

export const getPageUrls: GetPageUrlsFunc = (
  pageRequesterData: PageRequesterData
) => {
  const pageUrls: string[] = [];
  for (let i = 0; i < pageRequesterData.numPages; i += 1) {
    pageUrls.push(
      `${pageRequesterData.server}${pageRequesterData.hash}/${pageRequesterData.pageFilenames[i]}`
    );
  }
  return pageUrls;
};

export const getPageData: GetPageDataFunc = (series: Series, url: string) => {
  return new Promise((resolve, reject) => {
    resolve(url);
  });
};

export const fetchSearch: FetchSearchFunc = (
  text: string,
  params: { [key: string]: string },
  fetchFn: (url: string) => Promise<Response>
) => {
  if ("id" in params) {
    if (!Number.isNaN(parseInt(params.id, 10))) {
      return fetchFn(`https://mangadex.org/api/v2/manga/${params.id}`);
    }
  }

  if ("https" in params) {
    const matchUrl: RegExpMatchArray | null = params.https.match(
      new RegExp(/\/\/mangadex\.org\/title\/\d*/g)
    );
    if (matchUrl !== null) {
      const id: string = matchUrl[0].replace("//mangadex.org/title/", "");
      return fetchFn(`https://mangadex.org/api/v2/manga/${id}`);
    }
  }

  return new Promise((resolve, reject) => {
    reject("Did not receive an expected ID parameter or series page URL");
  });
};

export const parseSearch: ParseSearchFunc = (
  json: any,
  domParser: DOMParser
) => {
  if (!("error" in json) && json.code === 200) {
    return [parseSeries(SeriesSourceType.STANDARD, json, domParser)];
  }
  return [];
};
