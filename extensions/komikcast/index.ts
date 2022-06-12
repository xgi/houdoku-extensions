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
  SeriesTagKey,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SeriesListResponse,
  FetchFunc,
  WebviewFunc,
  WebviewResponse,
} from "houdoku-extension-lib";
import {
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

const BASE_URL = "https://komikcast.me";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const TAG_KEY_MAP: { [key: string]: SeriesTagKey } = {};

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  Manga: LanguageKey.JAPANESE,
  Manhua: LanguageKey.CHINESE_SIMP,
  Manhwa: LanguageKey.KOREAN,
};

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

const parseDirectoryResponse = (doc: DOMParser.Dom): SeriesListResponse => {
  const items = doc.getElementsByClassName("list-update_item")!;
  const hasMore = doc.getElementsByClassName("next page-numbers")!.length > 0;

  const seriesList = items.map((row: DOMParser.Node) => {
    const header = row.getElementsByTagName("h3")![0];
    const link = row.getElementsByTagName("a")![0];
    const img = link.getElementsByTagName("img")![0];

    const sourceId = link.getAttribute("href")!.split("/")[4];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,
      sourceType: SeriesSourceType.STANDARD,
      title: header.textContent.trim(),
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tagKeys: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: img.getAttribute("src")!,
    };
    return series;
  });

  return {
    seriesList,
    hasMore,
  };
};

export class ExtensionClient extends ExtensionClientAbstract {
  constructor(
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    super(fetchFn, webviewFn, domParser);
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${BASE_URL}/komik/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const infoContainer =
          doc.getElementsByClassName("komik_info-content")![0];

        const title = infoContainer
          .getElementsByClassName("komik_info-content-body-title")![0]
          .textContent.trim();
        const altTitles = infoContainer
          .getElementsByClassName("komik_info-content-native")![0]
          .textContent.trim()
          .split(",")!;
        const description = doc
          .getElementsByClassName("komik_info-description-sinopsis")![0]
          .textContent.trim();

        const img = infoContainer.getElementsByTagName("img")![0];
        const rows = infoContainer.getElementsByClassName(
          "komik_info-content-info"
        )!;

        const authorsRow = rows.find((row: DOMParser.Node) =>
          row.textContent.includes("Author:")
        );
        const authors = authorsRow?.textContent
          .split("Author: ")[1]
          .split(",")!;

        const statusRow = rows.find((row: DOMParser.Node) =>
          row.textContent.includes("Status:")
        );
        const statusStr = statusRow?.textContent.split("Status: ")[1]!;

        const tagKeys: SeriesTagKey[] = [];
        infoContainer.getElementsByClassName("genre-item")!.forEach((node) => {
          const sourceTag = node.textContent;
          if (Object.keys(TAG_KEY_MAP).includes(sourceTag)) {
            tagKeys.push(TAG_KEY_MAP[sourceTag]);
          }
        });

        const typeStr = infoContainer
          .getElementsByClassName("komik_info-content-info-type")![0]
          .getElementsByTagName("a")![0].textContent;

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title: title,
          altTitles: altTitles,
          description: description,
          authors: authors,
          artists: [],
          tagKeys: tagKeys,
          status: SERIES_STATUS_MAP[statusStr],
          originalLanguageKey: ORIGINAL_LANGUAGE_MAP[typeStr],
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("src")!,
        };
        return series;
      }
    );
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${BASE_URL}/komik/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        return doc
          .getElementsByClassName("komik_info-chapters-item")!
          .map((row) => {
            const link = row.getElementsByTagName("a")![0];
            const title = link.textContent.trim();
            const chapterNum = title.split("Chapter ")[1];
            const sourceId = link.getAttribute("href")!.split("/")[4];

            return {
              id: undefined,
              seriesId: undefined,
              sourceId: sourceId,
              title: title,
              chapterNumber: chapterNum,
              volumeNumber: "",
              languageKey: LanguageKey.INDONESIAN,
              groupName: "",
              time: 0,
              read: false,
            };
          });
      }
    );
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.webviewFn(`${BASE_URL}/chapter/${chapterSourceId}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const images = doc
          .getElementsByClassName("main-reading-area")![0]
          .getElementsByTagName("img")!;
        const pageFilenames = images.map((image) => image.getAttribute("src")!);

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
        };
      }
    );
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames;
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.webviewFn(`${BASE_URL}/daftar-komik/page/${page}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);
        return parseDirectoryResponse(doc);
      }
    );
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.webviewFn(`${BASE_URL}/page/${page}/?s=${text}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);
        return parseDirectoryResponse(doc);
      }
    );
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
