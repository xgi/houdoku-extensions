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
  GetFilterOptionsFunc,
  FilterValues,
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  publishing: SeriesStatus.ONGOING,
  finished: SeriesStatus.COMPLETED,
  "on hiatus": SeriesStatus.ONGOING,
  discontinued: SeriesStatus.CANCELLED,
  "not yet published": SeriesStatus.ONGOING,
};

const parseSeriesGrid = (root: Element): Series[] => {
  return Array.from(root.getElementsByClassName("relative block")!).map((node: Element) => {
    const parent = node.parentElement!;
    const img = parent.getElementsByTagName("img")![0];
    const link = parent.getElementsByTagName("a")![1];
    const sourceId = link.getAttribute("href")!;

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
      originalLanguageKey: LanguageKey.MULTI,
      numberUnread: 0,
      remoteCoverUrl: img.getAttribute("data-src")!,
    };
    return series;
  });
};

export class ExtensionClient extends ExtensionClientAbstract {
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${METADATA.url}${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        const container = doc.getElementsByClassName("container")![1];

        const img = container.getElementsByTagName("img")![0];
        const parent = img.parentElement!.parentElement!;
        const detailsContainer = parent.getElementsByClassName("flex")![0];

        const title = detailsContainer.getElementsByTagName("h1")![0].textContent.trim();
        const description = detailsContainer.getElementsByTagName("p")![0].textContent.trim();

        const cells = detailsContainer
          .getElementsByClassName("grid")![0]
          .getElementsByTagName("div")!;
        const typeStr = cells[0].getElementsByTagName("div")![0].textContent.trim();
        const statusStr = cells[2].getElementsByTagName("div")![0].textContent.trim();

        let languageKey = LanguageKey.JAPANESE;
        switch (typeStr) {
          case "manhwa":
            languageKey = LanguageKey.KOREAN;
            break;
          case "manhua":
            languageKey = LanguageKey.CHINESE_SIMP;
            break;
        }

        const genresContainer = detailsContainer.children[detailsContainer.children.length - 2];
        const tags = [...genresContainer.getElementsByTagName("a")!].map(
          (link) => link.textContent
        );

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,

          title: title,
          altTitles: [],
          description: description,
          authors: [],
          artists: [],
          tags: tags,
          status: SERIES_STATUS_MAP[statusStr],
          originalLanguageKey: languageKey,
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("data-src")!,
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${METADATA.url}${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);

        const container = doc.getElementById("chapters")!;

        return [...container.getElementsByTagName("a")!].map((link) => {
          const sourceId = link.getAttribute("href")!;
          const title = link.textContent.trim();
          const chapterNum = title.split("Chapter ")[1];

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
      .fetchFn(`${METADATA.url}${chapterSourceId}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);

        const imageUrls = Array.from(doc.getElementsByTagName("img")!).map(
          (img) => img.getAttribute("data-src")!
        );

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
      .fetchFn(`${METADATA.url}/mangas/new`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        const grid = doc.getElementsByClassName("grid")![0];
        return {
          seriesList: parseSeriesGrid(grid),
          hasMore: false,
        };
      });
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    return this.utilFns
      .fetchFn(`${METADATA.url}/search?page=${page}&q=${text}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        const grid = doc.getElementsByClassName("grid")![2];

        const innerLinks = doc.getElementsByClassName("container")![1].getElementsByTagName("a")!;
        const hasMore = innerLinks[innerLinks.length - 1].textContent === "Next";

        return {
          seriesList: parseSeriesGrid(grid),
          hasMore,
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
