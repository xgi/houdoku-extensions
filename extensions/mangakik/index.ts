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
import { MadaraClient } from "../../generic/madara";
import { parseMetadata } from "../../util/configuring";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  madaraClient: MadaraClient;

  constructor(utilsFn: UtilFunctions) {
    super(utilsFn);
    this.madaraClient = new MadaraClient(METADATA.id, METADATA.url, utilsFn);
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => this.madaraClient.getSeries(id);

  getChapters: GetChaptersFunc = (id: string) =>
    this.madaraClient.getChapters(id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) => this.madaraClient.getPageRequesterData(seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.madaraClient.getPageUrls(pageRequesterData);

  getImage: GetImageFunc = (series: Series, url: string) =>
    this.madaraClient.getImage(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => this.madaraClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) =>
    this.madaraClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () =>
    this.madaraClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.madaraClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.madaraClient.setSettings(newSettings);
}
