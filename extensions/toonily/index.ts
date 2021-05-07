/* eslint-disable no-continue */
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
  ContentWarningKey,
  FormatKey,
  GenreKey,
  LanguageKey,
  Series,
  SeriesSourceType,
  ThemeKey,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";

export const METADATA: ExtensionMetadata = metadata;

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  OnGoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
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

const CONTENT_WARNING_MAP: { [key: string]: ContentWarningKey } = {
  adult: ContentWarningKey.SMUT,
};

export const fetchSeries: FetchSeriesFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (url: string) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return webviewFunc(`https://toonily.com/${id}`);
};

export const parseSeries: ParseSeriesFunc = (
  sourceType: SeriesSourceType,
  data: any,
  domParser: DOMParser
): Series | undefined => {
  const doc = domParser.parseFromString(data);

  try {
    const titleContainer = doc.getElementsByClassName("post-title")[0];
    const title = titleContainer.getElementsByTagName("h1")[0].textContent;

    const detailsContainer = doc.getElementsByClassName("tab-summary")[0];
    const link = detailsContainer.getElementsByTagName("a")[0];

    const href = link.getAttribute("href").split("https://toonily.com").pop();
    const sourceId = href.substr(0, href.length - 1);

    const img = link.getElementsByTagName("img")[0];
    const remoteCoverUrl = img.getAttribute("data-src");

    const description = doc
      .getElementsByClassName("description-summary")[0]
      .textContent.trim();

    const author = detailsContainer
      ?.getElementsByClassName("author-content")[0]
      ?.textContent.trim();
    const artist = detailsContainer
      ?.getElementsByClassName("artist-content")[0]
      ?.textContent.trim();

    const statusContainer = detailsContainer.getElementsByClassName(
      "post-status"
    )[0];
    const statusText = statusContainer
      .getElementsByClassName("summary-content").pop()
      .textContent.trim();

    const genres: GenreKey[] = [];
    const themes: ThemeKey[] = [];
    const formats: FormatKey[] = [];
    const contentWarnings: ContentWarningKey[] = [];

    const tagLinks = detailsContainer
      .getElementsByClassName("genres-content")[0]
      .getElementsByTagName("a");

    Object.values(tagLinks).forEach((tagLink: DOMParser.Node) => {
      const tagStr = tagLink.textContent
        .trim()
        .replace(" ", "")
        .replace("-", "")
        .toLowerCase();
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
      sourceId: sourceId || "",
      sourceType: SeriesSourceType.STANDARD,
      title: title || "",
      altTitles: [],
      description: description || "",
      authors: author ? [author] : [],
      artists: artist ? [artist] : [],
      genres,
      themes,
      formats,
      contentWarnings,
      status: statusText ? SERIES_STATUS_MAP[statusText] : SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.KOREAN,
      numberUnread: 0,
      remoteCoverUrl: remoteCoverUrl || "",
      userTags: [],
    };
    return series;
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export const fetchChapters: FetchChaptersFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (url: string) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return webviewFunc(`https://toonily.com/${id}`);
};

export const parseChapters: ParseChaptersFunc = (
  sourceType: SeriesSourceType,
  data: any,
  domParser: DOMParser
): Chapter[] => {
  const chapters: Chapter[] = [];

  const doc = domParser.parseFromString(data);

  try {
    const chapterContainers = doc.getElementsByClassName("wp-manga-chapter");

    chapterContainers.forEach((node: DOMParser.Node) => {
      const dateStr = node
        .getElementsByClassName("chapter-release-date")[0]
        .textContent.trim();
      const date = new Date(dateStr);
      const link = node.getElementsByTagName("a")[0];
      const title = link.textContent.trim();

      let href = link.getAttribute("href");
      href =
        href?.charAt(href.length - 1) === "/"
          ? href.substr(0, href.length - 1)
          : href;
      const sourceId = href?.split("/").pop();

      const chapterNumber = title.split(" ").pop();

      const chapter: Chapter = {
        id: undefined,
        seriesId: undefined,
        sourceId: sourceId || "",
        title: title || "",
        chapterNumber: chapterNumber || "",
        volumeNumber: "",
        languageKey: LanguageKey.ENGLISH,
        groupName: "",
        time: date.getTime(),
        read: false,
      };
      chapters.push(chapter);
    });

    return chapters;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchPageRequesterData: FetchPageRequesterDataFunc = (
  sourceType: SeriesSourceType,
  seriesSourceId: string,
  chapterSourceId: string,
  fetchFn: (url: string) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return webviewFunc(
    `https://toonily.com/${seriesSourceId}/${chapterSourceId}`
  );
};

export const parsePageRequesterData: ParsePageRequesterDataFunc = (
  data: any,
  chapterSourceId: string,
  domParser: DOMParser
): PageRequesterData => {
  const doc = domParser.parseFromString(data);
  const imgContainers = doc.getElementsByClassName("wp-manga-chapter-img");

  const pageFilenames = imgContainers.map((node: DOMParser.Node) => {
    return node.getAttribute("data-src");
  });

  return {
    server: "",
    hash: "",
    numPages: pageFilenames.length,
    pageFilenames: pageFilenames,
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

export const fetchSearch: FetchSearchFunc = (
  text: string,
  params: { [key: string]: string },
  fetchFn: (url: string) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>
) => {
  return webviewFunc(`https://toonily.com/?s=${text}&post_type=wp-manga`);
};

export const parseSearch: ParseSearchFunc = (
  data: any,
  domParser: DOMParser
) => {
  const doc = domParser.parseFromString(data);

  const searchContainers = doc.getElementsByClassName("c-tabs-item__content");
  if (!searchContainers) return [];

  const seriesList: Series[] = [];
  for (let i = 0; i < searchContainers.length; i += 1) {
    const item = searchContainers[i];
    if (!item) continue;

    const linkElements = item.getElementsByTagName("a");
    if (!linkElements) continue;

    const link = linkElements[0];
    if (!link) continue;

    const title = link.getAttribute("title");
    const href = link.getAttribute("href").split("https://toonily.com").pop();
    const sourceId = href.substr(0, href.length - 1);
    if (title === null || sourceId === undefined) continue;

    const images = item.getElementsByClassName("img-responsive");
    const coverUrl =
      images && images?.length > 0 ? images[0].getAttribute("data-src") : "";

    seriesList.push({
      id: undefined,
      extensionId: METADATA.id,
      sourceId,
      sourceType: SeriesSourceType.STANDARD,
      title,
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      genres: [],
      themes: [],
      contentWarnings: [],
      formats: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: coverUrl || "",
      userTags: [],
    });
  }
  return seriesList;
};
