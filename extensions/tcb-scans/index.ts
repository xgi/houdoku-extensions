import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  ExtensionMetadata,
  GetDirectoryFunc,
  ExtensionClientAbstract,
  Series,
  PageRequesterData,
  SetSettingsFunc,
  GetSettingsFunc,
  GetSettingTypesFunc,
  FilterValues, SeriesStatus, LanguageKey, SeriesListResponse, WebviewResponse
} from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import {
  GetFilterOptionsFunc
} from "houdoku-extension-lib/dist/interface";


const BASE_URL = "https://onepiecechapters.com";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);


const parseDirectoryResponse = (doc: Document): SeriesListResponse => {
  const items = doc.getElementsByClassName("bg-card border border-border rounded p-3 mb-3")!;

  const seriesList = Array.from(items).map((row: Element) => {

    const titleLink = row.getElementsByClassName("mb-3 text-white text-lg font-bold")![0];

    const header = titleLink
      .textContent
      .trim();
    const link = titleLink.getAttribute("href").replace("/mangas/", "");
    const img = row.getElementsByClassName(" w-24 h-24 object-cover rounded-lg")![0]
      .getAttribute("src");



    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: link,

      title: header,
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tags: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: img
    };
    return series;
  });
  return {
    seriesList,
    hasMore: false
  };
};

export class ExtensionClient extends ExtensionClientAbstract {
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns.webviewFn(`${BASE_URL}/mangas/${id}`).then((response: WebviewResponse) => {
      const doc = this.utilFns.docFn(response.text);

      const infoContainer = doc.getElementsByClassName("order-1 md:order-2 bg-card border border-border rounded py-3")![0];

      const title = infoContainer
        .getElementsByClassName("my-3 font-bold text-3xl")![0]
        .textContent.trim();

      const description = doc
        .getElementsByClassName("leading-6 my-3")![0]
        .textContent.trim();
      const img = infoContainer.getElementsByTagName("img")![0];
      const series: Series = {
        extensionId: METADATA.id,
        sourceId: id,
        title: title,
        altTitles: [],
        description: description,
        authors: [],
        artists: [],
        tags: [],
        status: null,
        originalLanguageKey: null,
        numberUnread: 0,
        remoteCoverUrl: img.getAttribute("src")!
      };
      return series;
    });
  };
  getChapters: GetChaptersFunc = (id: string) => {

    return this.utilFns.webviewFn(`${BASE_URL}/mangas/${id}`).then((response: WebviewResponse) => {
      const doc = this.utilFns.docFn(response.text);

      return Array.from(doc.getElementsByClassName("block border border-border bg-card mb-3 p-3 rounded")!).map((row) => {
        const title = row.getElementsByClassName("text-gray-500")![0]
          .textContent
          .trim();
        const chapterNumFull = row.getElementsByClassName("text-lg font-bold")![0]
          .textContent.trim().split(" ");
        const chapterNum = chapterNumFull![chapterNumFull.length - 1];

        const sourceId = row.getAttribute("href").replace("/chapters/", "");

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
          read: false
        };
      });
    });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {

    return this.utilFns
      .webviewFn(`${BASE_URL}/chapters/${chapterSourceId}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        const images = doc
          .getElementsByClassName("flex flex-col items-center justify-center")![0]
          .getElementsByTagName("img")!;
        const pageFilenames = Array.from(images).map((image) => image.getAttribute("src")!);

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames
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
      .webviewFn(`${BASE_URL}/projects`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        return parseDirectoryResponse(doc);
      });
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    return this.utilFns
      .webviewFn(`${BASE_URL}/projects`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        Array.from(doc.getElementsByClassName("bg-card border border-border rounded p-3 mb-3")!).map((row) => {

          const element = row.getElementsByClassName("mb-3 text-white text-lg font-bold")![0];

          if (!element.textContent.toLowerCase().includes(text.toLowerCase())) {
            row.remove();
          }


        });



        return parseDirectoryResponse(doc);
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {
  };

  getFilterOptions: GetFilterOptionsFunc = () => [];

}

