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
  FetchFunc,
  WebviewFunc,
  Series,
  PageRequesterData,
  SeriesSourceType,
  SetSettingsFunc,
  GetSettingsFunc,
  GetSettingTypesFunc,
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import { NepClient } from "../../generic/nep";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  nepClient: NepClient;

  constructor(
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    super(fetchFn, webviewFn, domParser);
    this.nepClient = new NepClient(
      METADATA.id,
      METADATA.url,
      fetchFn,
      domParser
    );
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
  ) =>
    this.nepClient.getPageRequesterData(
      sourceType,
      seriesSourceId,
      chapterSourceId
    );

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.nepClient.getPageUrls(pageRequesterData);

  getPageData: GetPageDataFunc = (series: Series, url: string) =>
    this.nepClient.getPageData(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string }
  ) => this.nepClient.getSearch(text, params);

  getDirectory: GetDirectoryFunc = () => this.nepClient.getDirectory();

  getSettingTypes: GetSettingTypesFunc = () => this.nepClient.getSettingTypes();

  getSettings: GetSettingsFunc = () => this.nepClient.getSettings();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.nepClient.setSettings(newSettings);
}
