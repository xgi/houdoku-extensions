import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  PageRequesterData,
  GetDirectoryFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SeriesListResponse,
  Chapter,
  LanguageKey,
  Series,
  SeriesStatus,
  FilterValues,
} from "houdoku-extension-lib";
import { GetFilterOptionsFunc, UtilFunctions } from "houdoku-extension-lib/dist/interface";

export class MadaraClient {
  extensionId: string;
  baseUrl: string;
  translatedLanguageKey: LanguageKey;
  util: UtilFunctions;

  imageRequestReferer: string = "";
  searchHeaders: { [key: string]: string } = {};

  constructor(
    extensionId: string,
    baseUrl: string,
    utilFns: UtilFunctions,
    translatedLanguageKey: LanguageKey = LanguageKey.ENGLISH,
    imageRequestReferer: string = "",
    searchHeaders: { [key: string]: string } = {}
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.translatedLanguageKey = translatedLanguageKey;
    this.util = utilFns;
    this.imageRequestReferer = imageRequestReferer;
    this.searchHeaders = searchHeaders;
  }

  _parseSearch = (doc: Document): SeriesListResponse => {
    const searchContainers = doc.querySelectorAll(".c-tabs-item__content, .page-item-detail");
    if (!searchContainers) return { seriesList: [], hasMore: false };

    const seriesList: Series[] = [];
    for (let i = 0; i < searchContainers.length; i += 1) {
      const item = searchContainers[i];
      if (!item) continue;

      const linkElements = item.getElementsByTagName("a");
      if (!linkElements) continue;

      const link = linkElements[0];
      if (!link) continue;

      const title = link.getAttribute("title");
      const href = link.getAttribute("href")!.split(`${this.baseUrl}`).pop()!;
      const sourceId = href.substr(0, href.length - 1);
      if (title === null || sourceId === undefined) continue;

      const image = item.getElementsByTagName("img")![0];

      const coverUrl = (
        Array.from(image.attributes).find((attrib: any) => attrib.name === "data-src") !== undefined
          ? image.getAttribute("data-src")!
          : image.getAttribute("srcset")!
      ).split(" ")[0];

      seriesList.push({
        id: undefined,
        extensionId: this.extensionId,
        sourceId: sourceId,
        title,
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tags: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: LanguageKey.JAPANESE,
        numberUnread: 0,
        remoteCoverUrl: coverUrl || "",
      });
    }

    const prevLink = doc.getElementsByClassName("nav-previous")!;
    return { seriesList, hasMore: prevLink.length > 0 };
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}${id}`)
      .then((response) => response.text())
      .then((text) => {
        const doc = this.util.docFn(text);

        try {
          const titleContainer = doc.getElementsByClassName("post-title")![0];
          const title = titleContainer
            .getElementsByTagName("h1")![0]
            .childNodes[0].nodeValue.trim();

          const detailsContainer = doc.getElementsByClassName("tab-summary")![0];
          const link = detailsContainer.getElementsByTagName("a")![0];

          const href = link.getAttribute("href")!.split(this.baseUrl)[1];
          const sourceId = href.substr(0, href.length - 1);

          const image = link.getElementsByTagName("img")![0];
          const remoteCoverUrl = (
            Array.from(image.attributes).find((attrib: any) => attrib.name === "data-src") !==
            undefined
              ? image.getAttribute("data-src")!
              : image.getAttribute("srcset")!
          ).split(" ")[0];

          const series: Series = {
            id: undefined,
            extensionId: this.extensionId,
            sourceId: sourceId,
            title: title || "",
            altTitles: [],
            description: "",
            authors: [],
            artists: [],
            tags: [],
            status: SeriesStatus.ONGOING,
            originalLanguageKey: LanguageKey.JAPANESE,
            numberUnread: 0,
            remoteCoverUrl: remoteCoverUrl || "",
          };
          return series;
        } catch (err) {
          console.error(err);
          return undefined;
        }
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}${id}/ajax/chapters`, { method: "POST" })
      .then((response) => response.text())
      .then((text) => {
        const chapters: Chapter[] = [];
        const doc = this.util.docFn(text);

        try {
          const chapterContainers = doc.getElementsByClassName("wp-manga-chapter")!;

          Array.from(chapterContainers).forEach((element: Element) => {
            const dateStr = element
              .getElementsByClassName("chapter-release-date")![0]
              .textContent.trim();
            const date = new Date(dateStr);
            const link = element.getElementsByTagName("a")![0];
            const title = link.textContent.trim();

            let href = link.getAttribute("href");
            href = href?.charAt(href.length - 1) === "/" ? href.substr(0, href.length - 1) : href;
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
              languageKey: this.translatedLanguageKey,
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
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.util
      .fetchFn(`${this.baseUrl}/${seriesSourceId}/${chapterSourceId}`)
      .then((response) => response.text())
      .then((text) => {
        const doc = this.util.docFn(text);
        const imgContainers = doc.getElementsByClassName("wp-manga-chapter-img")!;

        const pageFilenames = Array.from(imgContainers).map((element: Element) => {
          const url =
            Array.from(element.attributes).find((attrib: any) => attrib.name === "data-src") !==
            undefined
              ? element.getAttribute("data-src")!
              : element.getAttribute("src")!;
          return url.trim();
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

  getImage: GetImageFunc = (series: Series, url: string) => {
    return this.util
      .fetchFn(url, {
        headers: { Referer: this.imageRequestReferer },
      })
      .then((response) => response.arrayBuffer());
  };

  getSearch: GetSearchFunc = (text: string, page: number, _filterValues: FilterValues) => {
    return this.util
      .fetchFn(`${this.baseUrl}/page/${page}/?s=${text}&post_type=wp-manga`, {
        headers: this.searchHeaders,
      })
      .then((response) => response.text())
      .then((text) => this._parseSearch(this.util.docFn(text)));
  };

  getDirectory: GetDirectoryFunc = (page: number, filterValues: FilterValues) => {
    return this.getSearch("", page, filterValues);
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};

  getFilterOptions: GetFilterOptionsFunc = () => [];
}
