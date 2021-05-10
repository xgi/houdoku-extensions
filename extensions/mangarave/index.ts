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
