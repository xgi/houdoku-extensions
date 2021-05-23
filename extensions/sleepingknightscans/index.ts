import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
  GetDirectoryFunc,
} from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { MadaraClient } from "../../generic/madara";

export const METADATA: ExtensionMetadata = metadata;

const madaraClient = new MadaraClient(METADATA.id, METADATA.url);

export const getSeries: GetSeriesFunc = madaraClient.getSeries;
export const getChapters: GetChaptersFunc = madaraClient.getChapters;
export const getPageRequesterData: GetPageRequesterDataFunc =
  madaraClient.getPageRequesterData;
export const getPageUrls: GetPageUrlsFunc = madaraClient.getPageUrls;
export const getPageData: GetPageDataFunc = madaraClient.getPageData;
export const getSearch: GetSearchFunc = madaraClient.getSearch;
export const getDirectory: GetDirectoryFunc = madaraClient.getDirectory;
