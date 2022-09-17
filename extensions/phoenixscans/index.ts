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
import { PizzaReaderClient } from "../../generic/pizzareader";
import { parseMetadata } from "../../util/configuring";
import { UtilFunctions } from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  pizzaReaderClient: PizzaReaderClient;

  constructor(utilsFn: UtilFunctions) {
    super(utilsFn);
    this.pizzaReaderClient = new PizzaReaderClient(
      METADATA.id,
      "https://www.phoenixscans.com",
      utilsFn
    );
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) =>
    this.pizzaReaderClient.getSeries(sourceType, id);

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) =>
    this.pizzaReaderClient.getChapters(sourceType, id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => this.pizzaReaderClient.getPageRequesterData(sourceType, seriesSourceId, chapterSourceId);

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.pizzaReaderClient.getPageUrls(pageRequesterData);

  getPageData: GetPageDataFunc = (series: Series, url: string) =>
    this.pizzaReaderClient.getPageData(series, url);

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) =>
    this.pizzaReaderClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) => this.pizzaReaderClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () => this.pizzaReaderClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.pizzaReaderClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.pizzaReaderClient.setSettings(newSettings);
}
