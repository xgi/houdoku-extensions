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

const BASE_URL = "https://mangakatana.com";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {};

const parseDirectoryResponse = (doc: DOMParser.Dom): SeriesListResponse => {
  const container = doc.getElementById("book_list")!;
  const items = container.getElementsByClassName("item")!;
  const hasMore =
    container.getElementsByClassName("next page-numbers")!.length > 0;

  const seriesList = items.map((row: DOMParser.Node) => {
    const img = row.getElementsByTagName("img")![0];
    const link = row
      .getElementsByClassName("title")![0]
      .getElementsByTagName("a")![0];
    const sourceId = link.getAttribute("href")!.split("/")[4];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,
      sourceType: SeriesSourceType.STANDARD,
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
    return this.fetchFn(`${BASE_URL}/manga/${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);

        const infoContainer = doc.getElementById("single_book")!;
        const title = infoContainer
          .getElementsByTagName("h1")![0]
          .textContent.trim();
        const description = infoContainer
          .getElementsByClassName("summary")![0]
          .getElementsByTagName("p")![0]
          .textContent.trim();
        const img = infoContainer.getElementsByTagName("img")![0];
        const rows = infoContainer.getElementsByClassName("d-row-small")!;

        const altNamesRow = rows.find((row: DOMParser.Node) =>
          row.textContent.includes("Alt name(s):")
        );
        const altNames = altNamesRow
          ?.getElementsByClassName("value")![0]
          .textContent!.trim()
          .split(" ; ")!;

        const statusStr =
          infoContainer?.getElementsByClassName("value status")![0]
            .textContent!;

        const authors = infoContainer
          .getElementsByClassName("value authors")![0]
          .getElementsByTagName("a")!
          .map((link) => link.textContent);

        const tags = infoContainer
          .getElementsByClassName("genres")![0]
          .getElementsByTagName("a")!
          .map((genreLink) => genreLink.textContent);

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
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
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${BASE_URL}/manga/${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);

        return doc
          .getElementsByClassName("chapters")![0]
          .getElementsByTagName("tr")!
          .map((row) => {
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
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(
      `${BASE_URL}/manga/${seriesSourceId}/${chapterSourceId}`
    )
      .then((response) => response.text())
      .then((data: string) => {
        const imageArrStr = data.split("var ytaw=[")[1].split(",]")[0];
        const imageUrls = imageArrStr
          .split(",")
          .map((imageUrl) => imageUrl.replace(/\'/g, ""));

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

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.fetchFn(
      `${BASE_URL}/manga/page/${page}?filter=1&include_mode=and&chapters=1&order=latest`
    )
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        return parseDirectoryResponse(doc);
      });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.fetchFn(`${BASE_URL}/page/${page}/?s=${text}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
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
}
