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
  WebviewResponse,
  SeriesListResponse,
  LanguageKey,
  Series,
  SeriesStatus,
} from "houdoku-extension-lib";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

export class MangaBoxClient {
  extensionId: string;
  baseUrl: string;
  util: UtilFunctions;

  public directoryPathFn = (page: number) =>
    `manga_list?type=topview&category=all&state=all&page=${page}`;
  public searchPath = "search/story";

  constructor(extensionId: string, baseUrl: string, utilFns: UtilFunctions) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.util = utilFns;
  }

  _parseSearch = (doc: Document): SeriesListResponse => {
    let seriesContainers = doc.querySelectorAll(
      "div.list-truyen-item-wrap, div.search-story-item, div.list-story-item, div.story_item, div.content-genres-item"
    );
    const seriesList: Series[] = [...seriesContainers].map((seriesContainer) => {
      const sourceId = seriesContainer.querySelector("a").getAttribute("href");
      const img = seriesContainer.querySelector("img");
      const title = img.getAttribute("alt");
      const remoteCoverUrl = img.getAttribute("src");

      return {
        extensionId: this.extensionId,
        sourceId,

        title,
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tags: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: LanguageKey.JAPANESE,
        numberUnread: 0,
        remoteCoverUrl,
      };
    });

    const currentPageNum =
      parseInt(doc.querySelector("a.page_select, a.page-blue:not([href])")?.textContent) || 0;
    const lastPageNum =
      parseInt(doc.querySelector("a.page_last, a.page-last")?.textContent.match(/\((.*)\)/)[1]) ||
      0;
    return { seriesList, hasMore: currentPageNum < lastPageNum };
  };

  getSeries: GetSeriesFunc = (id: string) =>
    this.util
      .fetchFn(id)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.util.docFn(data);

        const container = doc.querySelector("div.manga-info-top, div.panel-story-info");
        const remoteCoverUrl = container.querySelector("img").getAttribute("src");
        const title = container.querySelector("h1, h2").textContent.trim();
        const description = doc.querySelector(
          "div#noidungm, div#panel-story-info-description"
        ).textContent;

        let tags: string[] = [];
        let authors: string[] = [];
        let status = SeriesStatus.ONGOING;
        if (doc.querySelectorAll("div.manga-info-top").length > 0) {
          tags = Array.from(
            Array.from(container.querySelectorAll("li"))
              .find((element) => element.innerHTML.includes("Genres"))
              .querySelectorAll("a")
          ).map((element) => element.textContent);
          authors = Array.from(
            Array.from(container.querySelectorAll("li"))
              .find((element) => element.innerHTML.includes("Author"))
              .querySelectorAll("a")
          ).map((element) => element.textContent);
          status =
            SERIES_STATUS_MAP[
              Array.from(container.querySelectorAll("li"))
                .find((element) => element.textContent.includes("Status"))
                .textContent.split(" : ")[1]
            ];
        } else {
          tags = Array.from(
            Array.from(container.querySelectorAll("td"))
              .find((element) => element.textContent.includes("Genres"))
              .parentElement.lastElementChild.querySelectorAll("a")
          ).map((element) => element.textContent);
          authors = Array.from(
            Array.from(container.querySelectorAll("td"))
              .find((element) => element.textContent.includes("Author"))
              .parentElement.lastElementChild.querySelectorAll("a")
          ).map((element) => element.textContent);
          status =
            SERIES_STATUS_MAP[
              Array.from(container.querySelectorAll("td")).find((element) =>
                element.textContent.includes("Status")
              ).parentElement.lastElementChild.textContent
            ];
        }

        const series: Series = {
          id: undefined,
          extensionId: this.extensionId,
          sourceId: id,

          title: title || "",
          altTitles: [],
          description,
          authors,
          artists: [],
          tags,
          status,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl,
        };
        return series;
      });

  getChapters: GetChaptersFunc = (id: string) =>
    this.util
      .fetchFn(id)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.util.docFn(data);

        const chapterElements = doc.querySelectorAll(
          "div.chapter-list div.row, ul.row-content-chapter li"
        );
        return [...chapterElements].map((element) => {
          const link = element.querySelector("a");
          const chapterNum = link.getAttribute("href").match(/(\/|-)chap(ter)?(-|_)([\d|\.]+)/)[4];
          const matchVolume = link.textContent.match(/Vol\.(\d*)/);
          const volumeNum = matchVolume ? matchVolume[1] : "";

          return {
            id: undefined,
            seriesId: undefined,
            sourceId: link.getAttribute("href"),
            title: link.textContent,
            chapterNumber: chapterNum,
            volumeNumber: volumeNum || "",
            languageKey: LanguageKey.ENGLISH,
            groupName: "",
            time: 0,
            read: false,
          };
        });
      });

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) =>
    this.util
      .fetchFn(chapterSourceId)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.util.docFn(data);
        const imgs = doc.querySelectorAll("div.container-chapter-reader img");

        const pageUrls = [...imgs].map((img) => img.getAttribute("src"));
        return {
          server: "",
          hash: "",
          numPages: pageUrls.length,
          pageFilenames: pageUrls,
        };
      });

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    pageRequesterData.pageFilenames;

  getImage: GetImageFunc = (series: Series, url: string) => {
    return this.util
      .fetchFn(url, {
        headers: { Referer: this.baseUrl },
      })
      .then((response) => response.arrayBuffer());
  };

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) => {
    const query = text.replace(
      /!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|]|~|-|$|_/,
      "_"
    );
    return this.util
      .webviewFn(`${this.baseUrl}/${this.searchPath}/${query}?page=${page}`)
      .then((response: WebviewResponse) => this._parseSearch(this.util.docFn(response.text)));
  };

  getDirectory: GetDirectoryFunc = (page: number) =>
    this.util
      .webviewFn(`${this.baseUrl}/${this.directoryPathFn(page)}`)
      .then((response: WebviewResponse) => this._parseSearch(this.util.docFn(response.text)));

  getSettingTypes: GetSettingTypesFunc = () => ({});

  getSettings: GetSettingsFunc = () => ({});

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
