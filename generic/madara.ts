import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
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
  ThemeKey,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response, RequestInfo, RequestInit } from "node-fetch";
import DOMParser from "dom-parser";

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

const _getSearch = (
  baseUrl: string,
  extensionId: string,
  text: string,
  fetchFn: (
    url: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>,
  domParser: DOMParser
) => {
  return fetchFn(`${baseUrl}/?s=${text}&post_type=wp-manga`)
    .then((response: Response) => response.text())
    .then((data: string) => {
      const doc = domParser.parseFromString(data);

      const searchContainers = doc.getElementsByClassName(
        "c-tabs-item__content"
      );
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
        const href = link.getAttribute("href").split(`${baseUrl}`).pop();
        const sourceId = href.substr(0, href.length - 1);
        if (title === null || sourceId === undefined) continue;

        const image = item.getElementsByClassName("img-responsive")[0];

        const coverUrl = (
          image.attributes.find((attrib: any) => attrib.name === "data-src") !==
          undefined
            ? image.getAttribute("data-src")
            : image.getAttribute("srcset")
        ).split(" ")[0];

        seriesList.push({
          id: undefined,
          extensionId: extensionId,
          sourceId: `x:${sourceId}`,
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
    });
};

export class MadaraClient {
  extensionId: string;
  baseUrl: string;

  constructor(extensionId: string, baseUrl: string) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
  }

  getSeries: GetSeriesFunc = (
    sourceType: SeriesSourceType,
    id: string,
    fetchFn: (
      url: RequestInfo,
      init?: RequestInit | undefined
    ) => Promise<Response>,
    webviewFunc: (url: string) => Promise<string>,
    domParser: DOMParser
  ) => {
    return webviewFunc(`${this.baseUrl}/${id.split(":").pop()}`).then(
      (data: string) => {
        const doc = domParser.parseFromString(data);

        try {
          const titleContainer = doc.getElementsByClassName("post-title")[0];
          const title = titleContainer
            .getElementsByTagName("h1")[0]
            .textContent.trim();

          const detailsContainer = doc.getElementsByClassName("tab-summary")[0];
          const link = detailsContainer.getElementsByTagName("a")[0];

          const href = link.getAttribute("href").split(`${this.baseUrl}`).pop();
          const pageId = href.substr(0, href.length - 1);
          const dataId = doc
            .getElementsByClassName("wp-manga-action-button")[0]
            .getAttribute("data-post");
          const sourceId = `${dataId}:${pageId}`;

          const image = link.getElementsByTagName("img")[0];
          const remoteCoverUrl = (
            image.attributes.find(
              (attrib: any) => attrib.name === "data-src"
            ) !== undefined
              ? image.getAttribute("data-src")
              : image.getAttribute("srcset")
          ).split(" ")[0];

          const description = doc
            .getElementsByClassName("description-summary")[0]
            .textContent.trim();

          const author = detailsContainer
            ?.getElementsByClassName("author-content")[0]
            ?.textContent.trim();
          const artist = detailsContainer
            ?.getElementsByClassName("artist-content")[0]
            ?.textContent.trim();

          const statusContainer =
            detailsContainer.getElementsByClassName("post-status")[0];
          const statusText = statusContainer
            .getElementsByClassName("summary-content")
            .pop()
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
            extensionId: this.extensionId,
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
            status: statusText
              ? SERIES_STATUS_MAP[statusText]
              : SeriesStatus.ONGOING,
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
      }
    );
  };

  getChapters: GetChaptersFunc = (
    sourceType: SeriesSourceType,
    id: string,
    fetchFn: (
      url: RequestInfo,
      init?: RequestInit | undefined
    ) => Promise<Response>,
    webviewFunc: (url: string) => Promise<string>,
    domParser: DOMParser
  ) => {
    return fetchFn(`${this.baseUrl}/wp-admin/admin-ajax.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: ["action=manga_get_chapters", `manga=${id.split(":")[0]}`].join(
        "&"
      ),
    })
      .then((response: Response) => response.text())
      .then((data: string) => {
        const chapters: Chapter[] = [];

        const doc = domParser.parseFromString(data);

        try {
          const chapterContainers =
            doc.getElementsByClassName("wp-manga-chapter");

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

            const matchChapterNum: RegExpMatchArray | null = title.match(
              new RegExp(/(^|\s)(\d)+/g)
            );

            if (matchChapterNum === null) return;
            const chapterNumber = matchChapterNum[0].trim();

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
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
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
      `${this.baseUrl}/${seriesSourceId.split(":").pop()}/${chapterSourceId}`
    ).then((data: string) => {
      const doc = domParser.parseFromString(data);
      const imgContainers = doc.getElementsByClassName("wp-manga-chapter-img");

      const pageFilenames = imgContainers.map((node: DOMParser.Node) => {
        return node.attributes.find(
          (attrib: any) => attrib.name === "data-src"
        ) !== undefined
          ? node.getAttribute("data-src")
          : node.getAttribute("src");
      });

      return {
        server: "",
        hash: "",
        numPages: pageFilenames.length,
        pageFilenames: pageFilenames,
      };
    });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames;
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    fetchFn: (
      url: RequestInfo,
      init?: RequestInit | undefined
    ) => Promise<Response>,
    webviewFunc: (url: string) => Promise<string>,
    domParser: DOMParser
  ) => _getSearch(this.baseUrl, this.extensionId, text, fetchFn, domParser);

  getDirectory: GetDirectoryFunc = (
    fetchFn: (
      url: RequestInfo,
      init?: RequestInit | undefined
    ) => Promise<Response>,
    webviewFunc: (url: string) => Promise<string>,
    domParser: DOMParser
  ) => _getSearch(this.baseUrl, this.extensionId, "", fetchFn, domParser);
}
