import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
  GetDirectoryFunc,
  ExtensionClientAbstract,
  Series,
  PageRequesterData,
  SeriesSourceType,
  SetSettingsFunc,
  GetSettingsFunc,
  GetSettingTypesFunc,
} from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { NepClient } from "../../generic/nep";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  nepClient: NepClient;

  constructor(utilFns: UtilFunctions) {
    super(utilFns);
    this.nepClient = new NepClient(METADATA.id, METADATA.url, utilFns);
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) =>
    this.nepClient.getSeries(sourceType, id);

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) =>
    this.nepClient.getChapters(sourceType, id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => this.nepClient.getPageRequesterData(sourceType, seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.nepClient.getPageUrls(pageRequesterData);

  getPageData: GetPageDataFunc = (series: Series, url: string) =>
    this.nepClient.getPageData(series, url);

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) =>
    this.nepClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) => this.nepClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () => this.nepClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.nepClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.nepClient.setSettings(newSettings);
}
