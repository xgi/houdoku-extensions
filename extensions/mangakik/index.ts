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
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { MadaraClient } from "../../generic/madara";

export const METADATA: ExtensionMetadata = metadata;

export class ExtensionClient extends ExtensionClientAbstract {
  madaraClient: MadaraClient;

  constructor(
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    super(fetchFn, webviewFn, domParser);
    this.madaraClient = new MadaraClient(
      METADATA.id,
      METADATA.url,
      fetchFn,
      webviewFn,
      domParser
    );
  }

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) =>
    this.madaraClient.getSeries(sourceType, id);

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) =>
    this.madaraClient.getChapters(sourceType, id);

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) =>
    this.madaraClient.getPageRequesterData(
      sourceType,
      seriesSourceId,
      chapterSourceId
    );

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) =>
    this.madaraClient.getPageUrls(pageRequesterData);

  getPageData: GetPageDataFunc = (series: Series, url: string) =>
    this.madaraClient.getPageData(series, url);

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string }
  ) => this.madaraClient.getSearch(text, params);

  getDirectory: GetDirectoryFunc = () => this.madaraClient.getDirectory();

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) =>
    this.madaraClient.setSettings(newSettings);
  getSettings: GetSettingsFunc = () => this.madaraClient.getSettings();
}
