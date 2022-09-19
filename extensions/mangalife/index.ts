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
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { NepClient } from "../../generic/nep";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  nepClient: NepClient;

  constructor(utilsFn: UtilFunctions) {
    super(utilsFn);
    this.nepClient = new NepClient(METADATA.id, METADATA.url, utilsFn);
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => this.nepClient.getSeries(id);

  getChapters: GetChaptersFunc = (id: string) => this.nepClient.getChapters(id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => this.nepClient.getPageRequesterData(seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.nepClient.getPageUrls(pageRequesterData);

  getImage: GetImageFunc = (series: Series, url: string) =>
    this.nepClient.getImage(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => this.nepClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) =>
    this.nepClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () => this.nepClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.nepClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.nepClient.setSettings(newSettings);
}
