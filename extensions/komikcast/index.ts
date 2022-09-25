import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SeriesListResponse,
  WebviewResponse,
  GetFilterOptionsFunc,
  FilterValues,
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

const BASE_URL = "https://komikcast.me";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  Manga: LanguageKey.JAPANESE,
  Manhua: LanguageKey.CHINESE_SIMP,
  Manhwa: LanguageKey.KOREAN,
};

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

const parseDirectoryResponse = (doc: Document): SeriesListResponse => {
  const items = doc.getElementsByClassName("list-update_item")!;
  const hasMore = doc.getElementsByClassName("next page-numbers")!.length > 0;

  const seriesList = Array.from(items).map((row: Element) => {
    const header = row.getElementsByTagName("h3")![0];
    const link = row.getElementsByTagName("a")![0];
    const img = link.getElementsByTagName("img")![0];

    const sourceId = link.getAttribute("href")!.split("/")[4];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,

      title: header.textContent.trim(),
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tags: [],
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
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns.webviewFn(`${BASE_URL}/komik/${id}`).then((response: WebviewResponse) => {
      const doc = this.utilFns.docFn(response.text);

      const infoContainer = doc.getElementsByClassName("komik_info-content")![0];

      const title = infoContainer
        .getElementsByClassName("komik_info-content-body-title")![0]
        .textContent.trim()
        .split(" Bahasa Indonesia")[0];
      const altTitles = infoContainer
        .getElementsByClassName("komik_info-content-native")![0]
        .textContent.trim()
        .split(",")!;
      const description = doc
        .getElementsByClassName("komik_info-description-sinopsis")![0]
        .textContent.trim();

      const img = infoContainer.getElementsByTagName("img")![0];
      const rows = infoContainer.getElementsByClassName("komik_info-content-info")!;

      const authorsRow = Array.from(rows).find((row: Element) =>
        row.textContent.includes("Author:")
      );
      const authors = authorsRow?.textContent.split("Author: ")[1].split(",")!;

      const statusRow = Array.from(rows).find((row: Element) =>
        row.textContent.includes("Status:")
      );
      const statusStr = statusRow?.textContent.split("Status: ")[1]!;

      const tags = Array.from(infoContainer.getElementsByClassName("genre-item")!).map(
        (element) => element.textContent
      );

      const typeStr = infoContainer
        .getElementsByClassName("komik_info-content-info-type")![0]
        .getElementsByTagName("a")![0].textContent;

      const series: Series = {
        extensionId: METADATA.id,
        sourceId: id,

        title: title,
        altTitles: altTitles,
        description: description,
        authors: authors,
        artists: [],
        tags: tags,
        status: SERIES_STATUS_MAP[statusStr],
        originalLanguageKey: ORIGINAL_LANGUAGE_MAP[typeStr],
        numberUnread: 0,
        remoteCoverUrl: img.getAttribute("src")!,
      };
      return series;
    });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.utilFns.webviewFn(`${BASE_URL}/komik/${id}`).then((response: WebviewResponse) => {
      const doc = this.utilFns.docFn(response.text);

      return Array.from(doc.getElementsByClassName("komik_info-chapters-item")!).map((row) => {
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
    });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.utilFns
      .webviewFn(`${BASE_URL}/chapter/${chapterSourceId}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);

        const images = doc
          .getElementsByClassName("main-reading-area")![0]
          .getElementsByTagName("img")!;
        const pageFilenames = Array.from(images).map((image) => image.getAttribute("src")!);

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
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

  getDirectory: GetDirectoryFunc = (page: number, filterValues: FilterValues) => {
    return this.utilFns
      .webviewFn(`${BASE_URL}/daftar-komik/page/${page}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        return parseDirectoryResponse(doc);
      });
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    return this.utilFns
      .webviewFn(`${BASE_URL}/page/${page}/?s=${text}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        return parseDirectoryResponse(doc);
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
