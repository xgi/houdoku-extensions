import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  DemographicKey,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
} from "houdoku-extension-lib";
import {
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

export class ExtensionClient extends ExtensionClientAbstract {
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`https://guya.moe/api/series/${id}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const series: Series = {
          id: undefined,
          extensionId: METADATA.id,
          sourceId: json.slug,
          sourceType: SeriesSourceType.STANDARD,
          title: json.title,
          altTitles: [],
          description: json.description,
          authors: [json.author],
          artists: [json.artist],
          genres: [],
          themes: [],
          formats: [],
          contentWarnings: [],
          demographic: DemographicKey.UNCERTAIN,
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `https://guya.moe/${json.cover}`,
          userTags: [],
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`https://guya.moe/api/series/${id}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const chapters: Chapter[] = [];
        const { groups } = json;

        Object.keys(json.chapters).forEach((chapterNum: string) => {
          const chapterData = json.chapters[chapterNum];
          Object.keys(json.chapters[chapterNum].groups).forEach(
            (groupNum: string) => {
              chapters.push({
                id: undefined,
                seriesId: undefined,
                sourceId: `${chapterNum}:${json.slug}/chapters/${chapterData.folder}/${groupNum}`,
                title: chapterData.title,
                chapterNumber: chapterNum,
                volumeNumber: chapterData.volume,
                languageKey: LanguageKey.ENGLISH,
                groupName: groups[groupNum],
                time: chapterData.release_date[groupNum],
                read: false,
              });
            }
          );
        });

        return chapters;
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(`https://guya.moe/api/series/${seriesSourceId}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const chapterNum = chapterSourceId.split(":")[0];
        let groupNum = chapterSourceId.split("/").pop();
        groupNum = groupNum ? groupNum : "";

        const pageBasenames: string[] =
          json.chapters[chapterNum].groups[groupNum];
        const pageFilenames = pageBasenames.map((basename: string) => {
          return `https://guya.moe/media/manga/${chapterSourceId
            .split(":")
            .pop()}/${basename}`;
        });

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames;
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = () => {
    return this.fetchFn(`https://guya.moe/api/get_all_series`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const seriesList: Series[] = [];

        Object.keys(json).forEach((title: string) => {
          const seriesData = json[title];
          const series: Series = {
            id: undefined,
            extensionId: METADATA.id,
            sourceId: seriesData.slug,
            sourceType: SeriesSourceType.STANDARD,
            title: title,
            altTitles: [],
            description: seriesData.description,
            authors: [seriesData.author],
            artists: [seriesData.artist],
            genres: [],
            themes: [],
            formats: [],
            contentWarnings: [],
            demographic: DemographicKey.UNCERTAIN,
            status: SeriesStatus.ONGOING,
            originalLanguageKey: LanguageKey.JAPANESE,
            numberUnread: 0,
            remoteCoverUrl: `https://guya.moe/${seriesData.cover}`,
            userTags: [],
          };
          seriesList.push(series);
        });

        return seriesList;
      });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string }
  ) => {
    return this.getDirectory();
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};
}
