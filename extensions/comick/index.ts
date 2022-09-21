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
} from "houdoku-extension-lib";
import { LanguageKey, Series, SeriesStatus } from "houdoku-extension-lib";
import { Response } from "node-fetch";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { findLanguageKey } from "../../util/parsing";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const API_URL = "https://api.comick.fun";

const SEARCH_LIMIT = 8;

const STATUS_MAP = {
  1: SeriesStatus.ONGOING,
  2: SeriesStatus.COMPLETED,
};

export class ExtensionClient extends ExtensionClientAbstract {
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${API_URL}/comic/${id.split(":")[0]}?tachiyomi=true`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const tags = [json.demographic, ...json.genres.map((genre) => genre.name)];

        const series: Series = {
          id: undefined,
          extensionId: METADATA.id,
          sourceId: `${json.comic.slug}:${json.comic.id}`,
          title: json.comic.title,
          altTitles: json.comic.md_titles.map((x: { title: string }) => x.title),
          description: json.comic.desc,
          authors: json.authors.map((author) => author.name),
          artists: json.artists.map((artist) => artist.name),
          tags,
          status: STATUS_MAP[json.comic.status],
          originalLanguageKey: findLanguageKey(json.comic.iso639_1) || LanguageKey.MULTI,
          numberUnread: 0,
          remoteCoverUrl: json.comic.cover_url,
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    return this.utilFns
      .fetchFn(`${API_URL}/comic/${id.split(":")[1]}/chapter?limit=99999`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        return json.chapters.map((chapterObj) => {
          return {
            id: undefined,
            seriesId: undefined,
            sourceId: chapterObj.hid,
            title: "",
            chapterNumber: chapterObj.chap || "",
            volumeNumber: chapterObj.vol || "",
            languageKey: chapterObj.lang
              ? findLanguageKey(chapterObj.lang.substring(0, 2))
              : LanguageKey.MULTI,
            groupName:
              chapterObj.group_name && chapterObj.group_name.length > 0
                ? chapterObj.group_name[0]
                : "",
            time: new Date(chapterObj.updated_at).getTime(),
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
      .fetchFn(`${API_URL}/chapter/${chapterSourceId}?tachiyomi=true`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const pageFilenames = json.chapter.images.map((image) => image.url);
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

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.getSearch("", {}, page);
  };

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) => {
    return this.utilFns
      .fetchFn(`${API_URL}/search?q=${text}&limit=${SEARCH_LIMIT}&page=${page}&tachiyomi=true`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const seriesList: Series[] = json.map((seriesObj: any) => {
          const series = {
            id: undefined,
            extensionId: METADATA.id,
            sourceId: `${seriesObj.slug}:-1`,
            title: seriesObj.title,
            altTitles: [],
            description: seriesObj.desc,
            authors: [],
            artists: [],
            tags: [],
            status: SeriesStatus.ONGOING,
            originalLanguageKey: LanguageKey.MULTI,
            numberUnread: 0,
            remoteCoverUrl: seriesObj.cover_url,
          };
          return series;
        });

        return {
          seriesList,
          hasMore: seriesList.length === SEARCH_LIMIT,
        };
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};
}
