import {
  FetchSeriesFunc,
  FetchChaptersFunc,
  ParseSeriesFunc,
  ParseChaptersFunc,
  ParsePageRequesterDataFunc,
  FetchPageRequesterDataFunc,
  GetPageUrlsFunc,
  FetchSearchFunc,
  ParseSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
} from "houdoku-extension-lib";
import metadata from "./metadata.json";
import { MadaraClient } from "../../generic/madara";
import {
  FetchDirectoryFunc,
  ParseDirectoryFunc,
} from "houdoku-extension-lib/dist/interface";

export const METADATA: ExtensionMetadata = metadata;

const madaraClient = new MadaraClient(METADATA.id, METADATA.url);

export const fetchSeries: FetchSeriesFunc = madaraClient.fetchSeries;
export const parseSeries: ParseSeriesFunc = madaraClient.parseSeries;
export const fetchChapters: FetchChaptersFunc = madaraClient.fetchChapters;
export const parseChapters: ParseChaptersFunc = madaraClient.parseChapters;
export const fetchPageRequesterData: FetchPageRequesterDataFunc =
  madaraClient.fetchPageRequesterData;
export const parsePageRequesterData: ParsePageRequesterDataFunc =
  madaraClient.parsePageRequesterData;
export const getPageUrls: GetPageUrlsFunc = madaraClient.getPageUrls;
export const getPageData: GetPageDataFunc = madaraClient.getPageData;
export const fetchSearch: FetchSearchFunc = madaraClient.fetchSearch;
export const parseSearch: ParseSearchFunc = madaraClient.parseSearch;
export const fetchDirectory: FetchDirectoryFunc = madaraClient.fetchDirectory;
export const parseDirectory: ParseDirectoryFunc = madaraClient.parseDirectory;
