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
import { FoolSlideClient } from "../../generic/foolslide";
import { parseMetadata } from "../../util/configuring";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  foolslideClient: FoolSlideClient;

  constructor(utilsFn: UtilFunctions) {
    super(utilsFn);
    this.foolslideClient = new FoolSlideClient(
      METADATA.id,
      "https://read-nifteam.info/slide",
      utilsFn,
      METADATA.translatedLanguage
    );
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => this.foolslideClient.getSeries(id);

  getChapters: GetChaptersFunc = (id: string) =>
    this.foolslideClient.getChapters(id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) =>
    this.foolslideClient.getPageRequesterData(seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.foolslideClient.getPageUrls(pageRequesterData);

  getImage: GetImageFunc = (series: Series, url: string) =>
    this.foolslideClient.getImage(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => this.foolslideClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) =>
    this.foolslideClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () =>
    this.foolslideClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.foolslideClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.foolslideClient.setSettings(newSettings);
}
