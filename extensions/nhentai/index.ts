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

const BASE_URL = "https://nhentai.net";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  english: LanguageKey.ENGLISH,
  japanese: LanguageKey.JAPANESE,
  chinese: LanguageKey.CHINESE_SIMP,
};

const parseDirectoryResponse = (doc: DOMParser.Dom): SeriesListResponse => {
  const items = doc.getElementsByClassName("gallery")!;
  const hasMore = doc.getElementsByClassName("next")!.length > 0;

  const seriesList = items.map((item: DOMParser.Node) => {
    const link = item.getElementsByTagName("a")![0];
    const img = link.getElementsByTagName("img")![1];
    const sourceId = link.getAttribute("href")!.split("/")[2];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,
      sourceType: SeriesSourceType.STANDARD,
      title: item.textContent.trim(),
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tags: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.MULTI,
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

const parseTags = (row: DOMParser.Node) => {
  return row
    .getElementsByTagName("a")
    ?.map((link) => link.getElementsByClassName("name")![0].textContent);
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
    return this.webviewFn(`${BASE_URL}/g/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const titleElements = doc.getElementsByClassName("title")!;
        const title = titleElements[0]
          .getElementsByClassName("pretty")![0]
          .textContent.trim();
        const altTitles =
          titleElements.length > 1
            ? [
                titleElements[1]
                  .getElementsByClassName("pretty")![0]
                  .textContent.trim(),
              ]
            : [];

        const img = doc
          .getElementById("cover")!
          .getElementsByTagName("img")![1];

        const rows = doc.getElementsByClassName("tag-container")!;
        const parodies = parseTags(rows[0]);
        const characters = parseTags(rows[1]);
        const tags = parseTags(rows[2]);
        const artists = parseTags(rows[3]);
        // const groups = parseTags(rows[4]);
        const languages = parseTags(rows[5]);
        // const categories = parseTags(rows[6]);
        // const pages = parseTags(rows[7]);

        const description = `Parodies: ${parodies}; Characters: ${characters}`;
        let languageKey = LanguageKey.MULTI;
        if (languages) {
          languages.forEach((language) => {
            if (language in ORIGINAL_LANGUAGE_MAP) {
              languageKey = ORIGINAL_LANGUAGE_MAP[language];
            }
          });
        }

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title: title,
          altTitles: altTitles,
          description: description,
          authors: artists || [],
          artists: artists || [],
          tags: tags || [],
          status: SeriesStatus.COMPLETED,
          originalLanguageKey: languageKey,
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("src")!,
        };
        return series;
      }
    );
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${BASE_URL}/g/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const timeStr = doc
          .getElementsByTagName("time")![0]
          .getAttribute("datetime")!;
        const img = doc
          .getElementById("cover")!
          .getElementsByTagName("img")![1];
        const chapterId = img
          .getAttribute("src")!
          .split("galleries/")[1]
          .split("/")[0];

        const rows = doc.getElementsByClassName("tag-container")!;
        const groups = parseTags(rows[4]);
        const languages = parseTags(rows[5]);
        const pages = parseTags(rows[7]);

        let languageKey = LanguageKey.MULTI;
        if (languages) {
          languages.forEach((language) => {
            if (language in ORIGINAL_LANGUAGE_MAP) {
              languageKey = ORIGINAL_LANGUAGE_MAP[language];
            }
          });
        }

        return [
          {
            id: undefined,
            seriesId: undefined,
            // hack: embedding the page count in the sourceId so we don't have to get it
            // again in the page requester
            sourceId: `${chapterId}:${pages ? pages[0] : ""}`,
            title: "",
            chapterNumber: "1",
            volumeNumber: "",
            languageKey: languageKey,
            groupName: groups && groups.length > 0 ? groups[0] : "",
            time: new Date(timeStr).getTime(),
            read: false,
          },
        ];
      }
    );
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return new Promise((resolve, _reject) => {
      const galleryId = chapterSourceId.split(":")[0];
      const numPages = parseInt(chapterSourceId.split(":")[1]);

      resolve({
        server: "",
        hash: galleryId,
        numPages: numPages,
        pageFilenames: [],
      });
    });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    const pageUrls: string[] = [];
    const hosts = ["i2", "i3", "i5", "i7"];

    for (let i = 1; i <= pageRequesterData.numPages; i++) {
      const host = hosts[i % hosts.length];
      pageUrls.push(
        `https://${host}.nhentai.net/galleries/${pageRequesterData.hash}/${i}.jpg`
      );
    }
    return pageUrls;
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, _reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.webviewFn(`${BASE_URL}/?page=${page}`).then(
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
    return this.webviewFn(`${BASE_URL}/search/?page=${page}&q=${text}`).then(
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
