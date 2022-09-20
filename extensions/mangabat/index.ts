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
} from "houdoku-extension-lib";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";
import { MangaBoxClient } from "../../generic/mangabox";
import { parseMetadata } from "../../util/configuring";
import metadata from "./metadata.json";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  mangaboxClient: MangaBoxClient;

  constructor(utilsFn: UtilFunctions) {
    super(utilsFn);
    this.mangaboxClient = new MangaBoxClient(METADATA.id, METADATA.url, utilsFn);
    this.mangaboxClient.directoryPathFn = (page: number) => `manga-list-all/${page}?type=topview`;
    this.mangaboxClient.searchPath = "search/manga";
  }

  getMetadata: () => ExtensionMetadata = () => METADATA;

  getSeries: GetSeriesFunc = (id: string) => this.mangaboxClient.getSeries(id);

  getChapters: GetChaptersFunc = (id: string) => this.mangaboxClient.getChapters(id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => this.mangaboxClient.getPageRequesterData(seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.mangaboxClient.getPageUrls(pageRequesterData);

  getImage: GetImageFunc = (series: Series, url: string) =>
    this.mangaboxClient.getImage(series, url);

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) =>
    this.mangaboxClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) => this.mangaboxClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () => this.mangaboxClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.mangaboxClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.mangaboxClient.setSettings(newSettings);
}
