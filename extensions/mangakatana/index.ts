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
  GetFilterOptionsFunc,
  FilterValues,
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

const BASE_URL = "https://mangakatana.com";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {};

const parseSeriesPage = (doc: Document): Series => {
  const id = doc.querySelectorAll(`[property=og:url]`)![0].getAttribute("content").split("/").pop();
  const infoContainer = doc.getElementById("single_book")!;
  const title = infoContainer.getElementsByTagName("h1")![0].textContent.trim();
  const description = infoContainer
    .getElementsByClassName("summary")![0]
    .getElementsByTagName("p")![0]
    .textContent.trim();
  const img = infoContainer.getElementsByTagName("img")![0];
  const rows = infoContainer.getElementsByClassName("d-row-small")!;

  const altNamesRow = [...rows].find((row: Element) => row.textContent.includes("Alt name(s):"));
  const altNames = altNamesRow
    ?.getElementsByClassName("value")![0]
    .textContent!.trim()
    .split(" ; ")!;

  const statusStr = infoContainer?.getElementsByClassName("value status")![0].textContent!;

  const authors = Array.from(
    infoContainer.getElementsByClassName("value authors")![0].getElementsByTagName("a")!
  ).map((link) => link.textContent);

  const tags = Array.from(
    infoContainer.getElementsByClassName("genres")![0].getElementsByTagName("a")!
  ).map((genreLink) => genreLink.textContent);

  const series: Series = {
    extensionId: METADATA.id,
    sourceId: id,

    title: title,
    altTitles: altNames,
    description: description,
    authors: authors,
    artists: [],
    tags: tags,
    status: SERIES_STATUS_MAP[statusStr],
    originalLanguageKey: LanguageKey.JAPANESE,
    numberUnread: 0,
    remoteCoverUrl: img.getAttribute("src")!,
  };
  return series;
};

const parseDirectoryResponse = (doc: Document): SeriesListResponse => {
  const container = doc.getElementById("book_list")!;

  if (container === null) {
    return {
      seriesList: [parseSeriesPage(doc)],
      hasMore: false,
    };
  }

  const items = container.getElementsByClassName("item")!;
  const hasMore = container.getElementsByClassName("next page-numbers")!.length > 0;

  const seriesList = [...items].map((row: Element) => {
    const img = row.getElementsByTagName("img")![0];
    const link = row.getElementsByClassName("title")![0].getElementsByTagName("a")![0];
    const sourceId = link.getAttribute("href")!.split("/")[4];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,

      title: link.textContent.trim(),
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
    return this.utilFns
      .fetchFn(`${BASE_URL}/manga/${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        return parseSeriesPage(doc);
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${BASE_URL}/manga/${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);

        return Array.from(
          doc.getElementsByClassName("chapters")![0].getElementsByTagName("tr")!
        ).map((row) => {
          const link = row.getElementsByTagName("a")![0];
          const sourceId = link.getAttribute("href")!.split("/")[5];
          const title = link.textContent.trim();
          const chapterNum = sourceId.split("c")[1];

          return {
            id: undefined,
            seriesId: undefined,
            sourceId: sourceId,
            title: title,
            chapterNumber: chapterNum,
            volumeNumber: "",
            languageKey: LanguageKey.ENGLISH,
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
      .fetchFn(`${BASE_URL}/manga/${seriesSourceId}/${chapterSourceId}`)
      .then((response) => response.text())
      .then((data: string) => {
        const imageArrStr = data.split("var ytaw=[")[1].split(",]")[0];
        const imageUrls = imageArrStr.split(",").map((imageUrl) => imageUrl.replace(/\'/g, ""));

        return {
          server: "",
          hash: "",
          numPages: imageUrls.length,
          pageFilenames: imageUrls,
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
      .fetchFn(`${BASE_URL}/manga/page/${page}?filter=1&include_mode=and&chapters=1&order=latest`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        return parseDirectoryResponse(doc);
      });
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    return this.utilFns
      .fetchFn(`${BASE_URL}/page/${page}/?search=${text}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
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
