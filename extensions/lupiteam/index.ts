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
      "https://lupiteam.net",
      utilsFn
    );
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) =>
    this.pizzaReaderClient.getSeries(id);

  getChapters: GetChaptersFunc = (id: string) =>
    this.pizzaReaderClient.getChapters(id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    seriesSourceId: string,
    chapterSourceId: string
  ) =>
    this.pizzaReaderClient.getPageRequesterData(
      seriesSourceId,
      chapterSourceId
    );

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.pizzaReaderClient.getPageUrls(pageRequesterData);

  getImage: GetImageFunc = (series: Series, url: string) =>
    this.pizzaReaderClient.getImage(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => this.pizzaReaderClient.getSearch(text, params, page);

  getDirectory: GetDirectoryFunc = (page: number) =>
    this.pizzaReaderClient.getDirectory(page);

  getSettingTypes: GetSettingTypesFunc = () =>
    this.pizzaReaderClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.pizzaReaderClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.pizzaReaderClient.setSettings(newSettings);
}
