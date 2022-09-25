import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  PageRequesterData,
  GetDirectoryFunc,
  FetchFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
} from "houdoku-extension-lib";
import { Chapter, LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import { GetFilterOptionsFunc, UtilFunctions } from "houdoku-extension-lib/dist/interface";
import { Response } from "node-fetch";

type ParsedResults = {
  seriesList: Series[];
  hasMore: boolean;
};

const _parseResults = (doc: Document, extensionId: string): ParsedResults => {
  const seriesContainers = doc.getElementsByClassName("group")!;
  const seriesList = Array.from(seriesContainers).map((element: Element) => {
    const linkElement = element.getElementsByClassName("title")![0].firstElementChild!;
    const title = linkElement.textContent.trim();
    const link = linkElement.getAttribute("href")!;
    const sourceId = link
      .substr(0, link.length - 1)
      .split("/")
      .pop()!;

    const imgs = element.getElementsByTagName("img")!;
    const remoteCoverUrl = imgs.length > 0 ? imgs[0].getAttribute("src")! : "";

    const series: Series = {
      id: undefined,
      extensionId: extensionId,
      sourceId: sourceId,

      title: title,
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tags: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: remoteCoverUrl,
    };
    return series;
  });

  const nextContainer = doc.getElementsByClassName("next")!;
  return {
    seriesList,
    hasMore: nextContainer.length > 0,
  };
};

export class FoolSlideClient {
  extensionId: string;
  baseUrl: string;
  translatedLanguageKey: LanguageKey;
  util: UtilFunctions;

  constructor(
    extensionId: string,
    baseUrl: string,
    utilFns: UtilFunctions,
    translatedLanguageKey: LanguageKey
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.translatedLanguageKey = translatedLanguageKey;
    this.util = utilFns;
  }

  getSeries: GetSeriesFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}/series/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.util.docFn(data);
        const articleContainer = doc.getElementById("content")!;
        const infoContainer = articleContainer.getElementsByClassName("large comic")![0];

        const title = infoContainer.getElementsByClassName("title")![0].textContent.trim();

        const thumbnails = articleContainer.getElementsByClassName("thumbnail")!;
        const remoteCoverUrl =
          thumbnails.length > 0
            ? thumbnails[0].getElementsByTagName("img")![0].getAttribute("src")!
            : "";

        return {
          id: undefined,
          extensionId: this.extensionId,
          sourceId: id,

          title: title,
          altTitles: [],
          description: "",
          authors: [],
          artists: [],
          tags: [],
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: remoteCoverUrl,
        };
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.util
      .fetchFn(`${this.baseUrl}/series/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.util.docFn(data);
        const rows = doc.getElementsByClassName("element")!;

        return Array.from(rows).map((row: Element) => {
          const linkElement = row.getElementsByClassName("title")![0].firstElementChild!;
          const title = linkElement.textContent.trim();

          const link = linkElement.getAttribute("href")!;
          const sourceId = link.split(`/read/${id}/`).pop()!;

          const linkNumbers = link
            .split("/")
            .filter((part: string) => part && !Number.isNaN(+part));
          const volumeNumber: string = linkNumbers[0];
          const chapterNumber: string = linkNumbers[1];

          const metaContainer = row.getElementsByClassName("meta_r")![0];
          const groupName = metaContainer.getElementsByTagName("a")![0].getAttribute("title")!;
          const dateStr = metaContainer.textContent.split(", ").pop()!.trim();
          const time = new Date(dateStr).getTime();

          const chapter: Chapter = {
            id: undefined,
            seriesId: undefined,
            sourceId: sourceId,
            title,
            chapterNumber,
            volumeNumber,
            languageKey: this.translatedLanguageKey,
            groupName: groupName,
            time: time,
            read: false,
          };
          return chapter;
        });
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.util
      .fetchFn(`${this.baseUrl}/read/${seriesSourceId}/${chapterSourceId}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const contentStr = data.split("var pages = ").pop()!.split(";")[0];
        const content = JSON.parse(contentStr);

        const pageFilenames = content.map((pageData: any) => {
          return pageData.url;
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
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = (text: string, page: number) => {
    return this.util
      .fetchFn(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: `search=${text}`,
      })
      .then((response: Response) => response.text())
      .then((data: string) => {
        const parsedResults = _parseResults(this.util.docFn(data), this.extensionId);

        return {
          seriesList: parsedResults.seriesList,
          hasMore: parsedResults.hasMore,
        };
      });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.util
      .fetchFn(`${this.baseUrl}/directory/${page}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const parsedResults = _parseResults(this.util.docFn(data), this.extensionId);

        return {
          seriesList: parsedResults.seriesList,
          hasMore: parsedResults.hasMore,
        };
      });
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
