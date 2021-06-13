import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  PageRequesterData,
  GetDirectoryFunc,
  DemographicKey,
  FetchFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
} from "houdoku-extension-lib";
import {
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import DOMParser from "dom-parser";

const _parseResults = (doc: DOMParser.Dom, extensionId: string): Series[] => {
  const seriesContainers = doc.getElementsByClassName("group");
  return seriesContainers.map((node: DOMParser.Node) => {
    const linkElement = node.getElementsByClassName("title")[0].firstChild;
    const title = linkElement.textContent.trim();
    const link = linkElement.getAttribute("href");
    const sourceId = link
      .substr(0, link.length - 1)
      .split("/")
      .pop();

    const imgs = node.getElementsByTagName("img");
    const remoteCoverUrl = imgs.length > 0 ? imgs[0].getAttribute("src") : "";

    const series: Series = {
      id: undefined,
      extensionId: extensionId,
      sourceId: sourceId,
      sourceType: SeriesSourceType.STANDARD,
      title: title,
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      genres: [],
      themes: [],
      formats: [],
      contentWarnings: [],
      demographic: DemographicKey.UNCERTAIN,
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: remoteCoverUrl,
      userTags: [],
    };
    return series;
  });
};

export class FoolSlideClient {
  fetchFn: FetchFunc;
  domParser: DOMParser;
  extensionId: string;
  baseUrl: string;

  constructor(
    extensionId: string,
    baseUrl: string,
    fetchFn: FetchFunc,
    domParser: DOMParser
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
    this.domParser = domParser;
  }

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${this.baseUrl}/series/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        const articleContainer = doc.getElementById("content");
        const infoContainer =
          articleContainer.getElementsByClassName("large comic")[0];

        const title = infoContainer
          .getElementsByClassName("title")[0]
          .textContent.trim();

        const thumbnails = articleContainer.getElementsByClassName("thumbnail");
        const remoteCoverUrl =
          thumbnails.length > 0
            ? thumbnails[0].getElementsByTagName("img")[0].getAttribute("src")
            : "";

        return {
          id: undefined,
          extensionId: this.extensionId,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title: title,
          altTitles: [],
          description: "",
          authors: [],
          artists: [],
          genres: [],
          themes: [],
          formats: [],
          contentWarnings: [],
          demographic: DemographicKey.UNCERTAIN,
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: remoteCoverUrl,
          userTags: [],
        };
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${this.baseUrl}/series/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        const rows = doc.getElementsByClassName("element");

        return rows.map((row: DOMParser.Node) => {
          const linkElement = row.getElementsByTagName("a")[0];
          const title = linkElement.getAttribute("title");

          const link = linkElement.getAttribute("href");
          const sourceId = link.split(`/read/${id}/`).pop();
          const linkParts = link.split("/");

          let volumeNumber: string;
          let chapterNumber: string;

          if (linkParts.length === 9) {
            volumeNumber = linkParts[linkParts.length - 3];
            chapterNumber = linkParts[linkParts.length - 2];
          } else {
            volumeNumber = linkParts[linkParts.length - 4];
            chapterNumber = `${linkParts[linkParts.length - 3]}.${
              linkParts[linkParts.length - 2]
            }`;
          }

          const metaContainer = row.getElementsByClassName("meta_r")[0];
          const groupName = metaContainer
            .getElementsByTagName("a")[0]
            .getAttribute("title");
          const dateStr = metaContainer.textContent.split(", ").pop().trim();
          const time = new Date(dateStr).getTime();

          const chapter: Chapter = {
            id: undefined,
            seriesId: undefined,
            sourceId: sourceId,
            title: title,
            chapterNumber: chapterNumber,
            volumeNumber: volumeNumber,
            languageKey: LanguageKey.ENGLISH,
            groupName: groupName,
            time: time,
            read: false,
          };
          return chapter;
        });
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(
      `${this.baseUrl}/read/${seriesSourceId}/${chapterSourceId}`
    )
      .then((response: Response) => response.text())
      .then((data: string) => {
        const contentStr = data.split("var pages = ").pop().split(";")[0];
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

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string }
  ) => {
    return this.fetchFn(`${this.baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `search=${text}`,
    })
      .then((response: Response) => response.text())
      .then((data: string) => {
        return _parseResults(
          this.domParser.parseFromString(data),
          this.extensionId
        );
      });
  };

  getDirectory: GetDirectoryFunc = () => {
    return this.fetchFn(`${this.baseUrl}/directory`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        return _parseResults(
          this.domParser.parseFromString(data),
          this.extensionId
        );
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
