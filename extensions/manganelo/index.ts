/* eslint-disable no-continue */
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
  ContentWarningKey,
  FormatKey,
  GenreKey,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
  ThemeKey,
} from "houdoku-extension-lib";
import { Response, RequestInfo, RequestInit } from "node-fetch";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";

export const METADATA: ExtensionMetadata = metadata;

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

const GENRE_MAP: { [key: number]: GenreKey } = {
  2: GenreKey.ACTION,
  3: GenreKey.ADVENTURE,
  6: GenreKey.COMEDY,
  10: GenreKey.DRAMA,
  12: GenreKey.FANTASY,
  15: GenreKey.HISTORICAL,
  16: GenreKey.HORROR,
  22: GenreKey.MEDICAL,
  24: GenreKey.MYSTERY,
  26: GenreKey.PSYCHOLOGICAL,
  27: GenreKey.ROMANCE,
  29: GenreKey.SCI_FI,
  31: GenreKey.SHOUJO_AI,
  32: GenreKey.SHOUJO_AI,
  33: GenreKey.SHOUNEN_AI,
  34: GenreKey.SHOUNEN_AI,
  35: GenreKey.SLICE_OF_LIFE,
  37: GenreKey.SPORTS,
  39: GenreKey.TRAGEDY,
  41: GenreKey.YAOI,
  42: GenreKey.YURI,
  45: GenreKey.ISEKAI,
};

const THEME_MAP: { [key: number]: ThemeKey } = {
  7: ThemeKey.COOKING,
  14: ThemeKey.HAREM,
  19: ThemeKey.MARTIAL_ARTS,
  28: ThemeKey.SCHOOL_LIFE,
  38: ThemeKey.SUPERNATURAL,
  13: ThemeKey.GENDERSWAP,
};

const FORMAT_MAP: { [key: number]: FormatKey } = {
  9: FormatKey.DOUJINSHI,
  25: FormatKey.ONESHOT,
  40: FormatKey.WEB_COMIC,
};

const CONTENT_WARNING_MAP: { [key: number]: ContentWarningKey } = {
  11: ContentWarningKey.ECCHI,
  36: ContentWarningKey.SMUT,
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
  return fetchFn(`https://manganelo.com/manga/${id}`)
    .then((response: Response) => response.text())
    .then((data: string) => {
      const doc = domParser.parseFromString(data);

      const sourceId = doc
        .getElementsByTagName("link")[0]
        .getAttribute("href")
        ?.split("/manga/")
        .pop();

      const description = doc.getElementById(
        "panel-story-info-description"
      )?.textContent;
      const infoPanel = doc.getElementsByClassName("panel-story-info")[0];
      const remoteCoverUrl = infoPanel
        .getElementsByClassName("img-loading")[0]
        .getAttribute("src");
      const title = infoPanel.getElementsByTagName("h1")[0].textContent;

      const table = infoPanel.getElementsByClassName("variations-tableInfo")[0];
      const tableRows = table.getElementsByTagName("tr");

      const altTitles = tableRows[0]
        .getElementsByTagName("h2")[0]
        .textContent?.split(" ; ");
      const authorLinks = tableRows[1].getElementsByTagName("a");
      const statusText =
        tableRows[2].getElementsByClassName("table-value")[0].textContent;
      const tagLinks = tableRows[3].getElementsByTagName("a");

      const authors: string[] = [];
      Object.values(authorLinks).forEach((tagLink: DOMParser.Node) => {
        if (tagLink.textContent) authors.push(tagLink.textContent);
      });
      const status = statusText
        ? SERIES_STATUS_MAP[statusText]
        : SeriesStatus.ONGOING;

      const genres: GenreKey[] = [];
      const themes: ThemeKey[] = [];
      const formats: FormatKey[] = [];
      const contentWarnings: ContentWarningKey[] = [];
      let languageKey = LanguageKey.JAPANESE;

      Object.values(tagLinks).forEach((node: DOMParser.Node) => {
        const tagNumStr = node.getAttribute("href")?.split("-").pop();
        if (tagNumStr !== undefined) {
          const tag = parseInt(tagNumStr, 10);

          if (tag in GENRE_MAP) {
            genres.push(GENRE_MAP[tag]);
          }
          if (tag in THEME_MAP) {
            themes.push(THEME_MAP[tag]);
          }
          if (tag in FORMAT_MAP) {
            formats.push(FORMAT_MAP[tag]);
          }
          if (tag in CONTENT_WARNING_MAP) {
            contentWarnings.push(CONTENT_WARNING_MAP[tag]);
          }

          if (tag === 44) languageKey = LanguageKey.CHINESE_SIMP;
          if (tag === 43) languageKey = LanguageKey.KOREAN;
        }
      });

      const series: Series = {
        id: undefined,
        extensionId: METADATA.id,
        sourceId: sourceId || "",
        sourceType: SeriesSourceType.STANDARD,
        title: title || "",
        altTitles: altTitles || [],
        description: description || "",
        authors,
        artists: [],
        genres,
        themes,
        formats,
        contentWarnings,
        status,
        originalLanguageKey: languageKey,
        numberUnread: 0,
        remoteCoverUrl: remoteCoverUrl || "",
        userTags: [],
      };
      return series;
    });
};

export const getChapters: GetChaptersFunc = (
  sourceType: SeriesSourceType,
  id: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  webviewFunc: (url: string) => Promise<string>,
  domParser: DOMParser
) => {
  return fetchFn(`https://manganelo.com/manga/${id}`)
    .then((response: Response) => response.text())
    .then((data: string) => {
      const chapters: Chapter[] = [];
      const doc = domParser.parseFromString(data);

      const chapterContainer = doc.getElementsByClassName(
        "row-content-chapter"
      )[0];
      const chapterRows = chapterContainer.getElementsByTagName("li");

      Object.values(chapterRows).forEach((chapterRow: DOMParser.Node) => {
        const timeStr = chapterRow
          .getElementsByClassName("chapter-time")[0]
          .getAttribute("title");
        const time =
          timeStr === null ? new Date().getTime() : new Date(timeStr).getTime();

        const chapterLink = chapterRow.getElementsByTagName("a")[0];
        const sourceId = chapterLink.getAttribute("href")?.split("/").pop();
        const title = chapterLink.textContent;
        if (title === null) return;

        const matchChapterNum: RegExpMatchArray | null = title.match(
          new RegExp(/Chapter (\d)+/g)
        );
        const matchVolumeNum: RegExpMatchArray | null = title.match(
          new RegExp(/Vol\.(\d)+/g)
        );

        if (matchChapterNum === null) return;
        const chapterNumber = matchChapterNum[0].split(" ").pop();
        const volumeNumber =
          matchVolumeNum === null ? "" : matchVolumeNum[0].split(".").pop();

        chapters.push({
          id: undefined,
          seriesId: undefined,
          sourceId: sourceId || "",
          title: title || "",
          chapterNumber: chapterNumber || "",
          volumeNumber: volumeNumber || "",
          languageKey: LanguageKey.ENGLISH,
          groupName: "",
          time,
          read: false,
        });
      });
      return chapters;
    });
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
  return webviewFunc(
    `https://manganelo.com/chapter/${seriesSourceId}/${chapterSourceId}`
  ).then((data: string) => {
    const doc = domParser.parseFromString(data);

    const readerContainer = doc.getElementsByClassName(
      "container-chapter-reader"
    )[0];
    const imageElements = readerContainer.getElementsByTagName("img");

    const pageFilenames: string[] = [];
    Object.values(imageElements).forEach((imageElement: DOMParser.Node) => {
      const src = imageElement.getAttribute("src");
      if (src !== null) pageFilenames.push(src);
    });

    return {
      server: "json.data.server",
      hash: "",
      numPages: pageFilenames.length,
      pageFilenames,
    };
  });
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
  return fetchFn(`https://manganelo.com/search/story/${text}`)
    .then((response: Response) => response.text())
    .then((data: string) => {
      const doc = domParser.parseFromString(data);

      const searchContainers = doc.getElementsByClassName("search-story-item");

      const seriesList: Series[] = [];
      for (let i = 0; i < searchContainers.length; i += 1) {
        const item = searchContainers[i];
        if (item === null) break;

        const imgs = item.getElementsByClassName("img-loading");
        const coverUrl = imgs.length > 0 ? imgs[0]?.getAttribute("src") : "";

        const linkElements = item.getElementsByClassName("item-img");
        const link = linkElements[0];
        if (link === null) continue;

        const title = link.getAttribute("title");
        const sourceId = link.getAttribute("href")?.split("/").pop();
        if (title === null || sourceId === undefined) continue;

        const authorElements = item.getElementsByClassName("item-author");
        const author =
          authorElements.length > 0
            ? authorElements[0]?.getAttribute("title")
            : "";

        seriesList.push({
          id: undefined,
          extensionId: METADATA.id,
          sourceId,
          sourceType: SeriesSourceType.STANDARD,
          title,
          altTitles: [],
          description: "",
          authors: author ? [author] : [],
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
  return fetchFn(`https://manganelo.com/genre-all?type=topview`)
    .then((response: Response) => response.text())
    .then((data: string) => {
      const doc = domParser.parseFromString(data);

      const containers = doc.getElementsByClassName("content-genres-item");

      const seriesList: Series[] = [];
      for (let i = 0; i < containers.length; i += 1) {
        const item = containers[i];
        if (item === null) break;

        const coverUrl = item
          .getElementsByClassName("img-loading")[0]
          ?.getAttribute("src");

        const linkElements = item.getElementsByClassName("genres-item-img");
        const link = linkElements[0];
        if (link === null) continue;

        const title = link.getAttribute("title");
        const sourceId = link.getAttribute("href")?.split("/").pop();
        if (title === null || sourceId === undefined) continue;

        const authorElements =
          item.getElementsByClassName("genres-item-author");
        const author =
          authorElements.length > 0
            ? authorElements[0]?.getAttribute("title")
            : "";

        seriesList.push({
          id: undefined,
          extensionId: METADATA.id,
          sourceId,
          sourceType: SeriesSourceType.STANDARD,
          title,
          altTitles: [],
          description: "",
          authors: author ? [author] : [],
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
    });
};
