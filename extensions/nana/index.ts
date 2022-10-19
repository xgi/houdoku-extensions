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
  FilterSort,
  SortDirection,
  FilterValues,
  FilterSortValue,
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

const BASE_URL = "https://nana.my.id";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const parseDirectoryResponse = (doc: Document): SeriesListResponse => {
  const items = doc.querySelectorAll("#thumbs_container > .id1");
  const seriesList = Array.from(items).map((item) => {
    const link = item.querySelector("div.id3 > a");
    const title = link.getAttribute("title");
    const img = link.querySelector("img");
    const sourceId = link.getAttribute("href")!.split("/").pop();
    console.log(sourceId);

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: sourceId,
      title,
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      tags: [],
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.ENGLISH,
      numberUnread: 0,
      remoteCoverUrl: `${BASE_URL}/${img.getAttribute("src")}`,
    };
    return series;
  });

  const lastPaginator = Array.from(doc.querySelectorAll(".paginate_button")).pop();
  const hasMore = !Array.from(lastPaginator.classList).includes("current");

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
      .fetchFn(`${BASE_URL}/reader/${id}`)
      .then((response) => response.text())
      .then((data: string) => {
        const doc = this.utilFns.docFn(data);
        const thumbSrc = doc.getElementById("img").getAttribute("src");

        const title = data.split('Reader.filename = "/home/')[1].split('.zip"')[0];
        const tagsStr = data.split('Reader.tags = "')[1].split('"')[0];
        const tags = tagsStr.split(", ");
        const creators = tags.length > 0 ? [tags[0]] : [];

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,
          title,
          altTitles: [],
          description: "",
          authors: creators,
          artists: creators,
          tags: tags || [],
          status: SeriesStatus.COMPLETED,
          originalLanguageKey: LanguageKey.MULTI,
          numberUnread: 0,
          remoteCoverUrl: `${BASE_URL}${thumbSrc}`,
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return new Promise((resolve) =>
      resolve([
        {
          id: undefined,
          seriesId: undefined,
          sourceId: "",
          title: "",
          chapterNumber: "1",
          volumeNumber: "",
          languageKey: LanguageKey.ENGLISH,
          groupName: "",
          time: 0,
          read: false,
        },
      ])
    );
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.utilFns
      .fetchFn(`${BASE_URL}/reader/${seriesSourceId}`)
      .then((response) => response.text())
      .then((data: string) => {
        const pages = JSON.parse(data.split("Reader.pages = ")[1].split(".pages")[0]).pages;
        return {
          server: "",
          hash: "",
          numPages: pages.length,
          pageFilenames: pages,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames.map((page) => `${BASE_URL}${page}`);
  };

  getImage: GetImageFunc = (series: Series, url: string) => {
    return new Promise((resolve, _reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number, filterValues: FilterValues) => {
    return this.getSearch("", page, filterValues);
  };

  getSearch: GetSearchFunc = (text: string, page: number, filterValues: FilterValues) => {
    const params = new URLSearchParams({
      p: `${page}`,
      q: text,
    });
    if ("sort" in filterValues) {
      const sortValue = filterValues["sort"] as FilterSortValue;
      params.append("sort", sortValue.direction === SortDirection.DESCENDING ? "desc" : "asc");
    }

    return this.utilFns
      .fetchFn(`${BASE_URL}/?${params}`)
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

  getFilterOptions: GetFilterOptionsFunc = () => {
    return [
      new FilterSort("sort", "Sort", {
        key: "date",
        direction: SortDirection.DESCENDING,
      })
        .withFields([{ key: "date", label: "Date Added" }])
        .withSupportsBothDirections(true),
    ];
  };
}
