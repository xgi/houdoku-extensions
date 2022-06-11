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

const LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  "": LanguageKey.JAPANESE,
  "ar-SA": LanguageKey.ARABIC,
  "cs-CZ": LanguageKey.CZECH,
  "da-DK": LanguageKey.DANISH,
  "de-DE": LanguageKey.GERMAN,
  "el-GR": LanguageKey.GREEK,
  "en-AU": LanguageKey.ENGLISH,
  "en-GB": LanguageKey.ENGLISH,
  "en-IE": LanguageKey.ENGLISH,
  "en-US": LanguageKey.ENGLISH,
  "en-ZA": LanguageKey.ENGLISH,
  "es-ES": LanguageKey.SPANISH_ES,
  "es-MX": LanguageKey.SPANISH_LATAM,
  "fi-FI": LanguageKey.FINNISH,
  "fr-CA": LanguageKey.FRENCH,
  "fr-FR": LanguageKey.FRENCH,
  "he-IL": LanguageKey.HEBREW,
  "hi-IN": LanguageKey.HINDI,
  "hu-HU": LanguageKey.HUNGARIAN,
  "id-ID": LanguageKey.INDONESIAN,
  "it-IT": LanguageKey.ITALIAN,
  "ja-JP": LanguageKey.JAPANESE,
  "ko-KR": LanguageKey.KOREAN,
  "nl-BE": LanguageKey.DUTCH,
  "nl-NL": LanguageKey.DUTCH,
  "pl-PL": LanguageKey.POLISH,
  "pt-BR": LanguageKey.PORTUGUESE_BR,
  "pt-PT": LanguageKey.PORTUGUESE_PT,
  "ro-RO": LanguageKey.ROMANIAN,
  "ru-RU": LanguageKey.RUSSIAN,
  "sv-SE": LanguageKey.SWEDISH,
  "th-TH": LanguageKey.THAI,
  "tr-TR": LanguageKey.TURKISH,
  "zh-CN": LanguageKey.CHINESE_SIMP,
  "zh-HK": LanguageKey.CHINESE_SIMP,
  "zh-TW": LanguageKey.CHINESE_SIMP,
};

const STATUS_MAP: { [key: string]: SeriesStatus } = {
  ENDED: SeriesStatus.COMPLETED,
  ONGOING: SeriesStatus.ONGOING,
  ABANDONED: SeriesStatus.CANCELLED,
  HIATUS: SeriesStatus.ONGOING,
};

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
          tagKeys: [],
          status: SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.JAPANESE,
          numberUnread: 0,
          remoteCoverUrl: `https://guya.moe/${json.cover}`,
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

  getDirectory: GetDirectoryFunc = (page: number) => {
    return (
      this.fetchFn(
        `http://192.168.0.120:8080/api/v1/series?search=&page=0`,
        {
          method: "GET",
          headers: { Authorization: "Basic " + btoa("a@a.com:a") },
        }
        // {
        //   extraHeaders: `Authorization: Basic ${btoa("a@a.com:a")}`,
        // }
      )
        // .then((thing) => console.log(thing))
        .then((response: Response) => response.json())
        .then((json: any) => {
          const seriesList: Series[] = json.content.map((element: any) => {
            return {
              id: undefined,
              extensionId: METADATA.id,
              sourceId: element.id,
              sourceType: SeriesSourceType.STANDARD,
              title: element.name,
              altTitles: [],
              description: element.metadata.summary,
              authors: [],
              artists: [],
              tagKeys: [],
              status: STATUS_MAP[element.metadata.status],
              originalLanguageKey: LANGUAGE_MAP[element.metadata.language],
              numberUnread: 0,
              remoteCoverUrl: `http://192.168.0.120:8080/api/v1/series/${element.id}/thumbnail`,
            };
          });

          console.log(seriesList);

          return {
            seriesList,
            hasMore: json.last,
          };
        })
    );
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.getDirectory(page);
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};
}
