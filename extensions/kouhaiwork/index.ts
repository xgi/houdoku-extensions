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
  GenreKey,
  ContentWarningKey,
  ThemeKey,
  FormatKey,
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

const API_URL = "https://api.kouhai.work/v3";
const STORAGE_URL = "https://api.kouhai.work/storage";

const TAG_KEY_MAP: {
  [key: string]:
    | GenreKey
    | ThemeKey
    | FormatKey
    | ContentWarningKey
    | DemographicKey;
} = {
  Romance: GenreKey.ROMANCE,
  Comedy: GenreKey.COMEDY,
  "Slice of Life": GenreKey.SLICE_OF_LIFE,
  Fantasy: GenreKey.FANTASY,
  "Sci-Fi": GenreKey.SCI_FI,
  Psychological: GenreKey.PSYCHOLOGICAL,
  Horror: GenreKey.HORROR,
  Mystery: GenreKey.MYSTERY,
  "Girls' Love": GenreKey.SHOUJO_AI,
  Drama: GenreKey.DRAMA,
  Action: GenreKey.ACTION,
  Ecchi: ContentWarningKey.ECCHI,
  Adventure: GenreKey.ADVENTURE,
  Thriller: GenreKey.THRILLER,
  Crime: GenreKey.CRIME,
  Isekai: GenreKey.ISEKAI,
  Historical: GenreKey.HISTORICAL,
  Tragedy: GenreKey.TRAGEDY,
  Sports: GenreKey.SPORTS,
  "Office Workers": ThemeKey.OFFICE_WORKERS,
  // Family: ThemeKey.FAMILY,
  Supernatural: ThemeKey.SUPERNATURAL,
  Demons: ThemeKey.DEMONS,
  Magic: ThemeKey.MAGIC,
  Aliens: ThemeKey.ALIENS,
  Suggestive: ContentWarningKey.ECCHI,
  Doujinshi: FormatKey.DOUJINSHI,
  "School Life": ThemeKey.SCHOOL_LIFE,
  Police: ThemeKey.POLICE,
  Mafia: ThemeKey.MAFIA,
  Shota: ThemeKey.SHOTA,
  Animals: GenreKey.ROMANCE,
  Shounen: DemographicKey.SHOUNEN,
  Shoujo: DemographicKey.SHOUJO,
  Seinen: DemographicKey.SEINEN,
};

const STATUS_MAP: { [key: string]: SeriesStatus } = {
  ongoing: SeriesStatus.ONGOING,
  finished: SeriesStatus.COMPLETED,
  "axed/dropped": SeriesStatus.CANCELLED,
};

export class ExtensionClient extends ExtensionClientAbstract {
  _parseSeries = (data: any) => {
    const source_tags = (data.genres || [])
      .concat(data.themes || [])
      .concat(data.demographics || [])
      .map((tag: [number, string] | { id: number; name: string }) =>
        "name" in tag ? tag.name : tag[1]
      );
    // .map(([_id, name]: [number, string]) => name);

    const mapped_tags: (
      | GenreKey
      | ThemeKey
      | FormatKey
      | ContentWarningKey
      | DemographicKey
    )[] = [];
    source_tags.forEach((source_tag: string) => {
      if (Object.keys(TAG_KEY_MAP).includes(source_tag)) {
        mapped_tags.push(TAG_KEY_MAP[source_tag]);
      }
    });

    // @ts-expect-error
    const genres: GenreKey[] = mapped_tags.filter(
      (tag: any) => tag in GenreKey
    );
    // @ts-expect-error
    const themes: ThemeKey[] = mapped_tags.filter(
      (tag: any) => tag in ThemeKey
    );
    // @ts-expect-error
    const formats: FormatKey[] = mapped_tags.filter(
      (tag: any) => tag in FormatKey
    );
    // @ts-expect-error
    const contentWarnings: ContentWarningKey[] = mapped_tags.filter(
      (tag: any) => tag in ContentWarningKey
    );
    // @ts-expect-error
    const demographicKeys: DemographicKey[] = mapped_tags.filter(
      (tag: any) => tag in DemographicKey
    );

    const authors = data.authors
      ? data.authors.map((author: { id: Number; name: string }) => author.name)
      : [];
    const artists = data.artists
      ? data.artists.map((artist: { id: Number; name: string }) => artist.name)
      : [];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: data.id,
      sourceType: SeriesSourceType.STANDARD,
      title: data.title,
      altTitles: data.alternative_titles || [],
      description: data.synopsis,
      authors: authors,
      artists: artists,
      genres: genres,
      themes: themes,
      formats: formats,
      contentWarnings: contentWarnings,
      demographic:
        demographicKeys.length > 0
          ? demographicKeys[0]
          : DemographicKey.UNCERTAIN,
      status: STATUS_MAP[data.status] || SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: `${STORAGE_URL}/${data.cover}`,
      userTags: [],
    };
    return series;
  };

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${API_URL}/manga/get/${id}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        return this._parseSeries(json.data);
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${API_URL}/manga/get/${id}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        return json.data.chapters.map((chapterData: any) => {
          const groupName =
            chapterData.groups && chapterData.groups.length > 0
              ? chapterData.groups[0].name
              : "";

          const chapter: Chapter = {
            sourceId: chapterData.id,
            title: chapterData.name || "",
            chapterNumber: chapterData.number,
            volumeNumber: "",
            languageKey: LanguageKey.ENGLISH,
            groupName: groupName,
            time: new Date(chapterData).getTime(),
            read: false,
          };
          return chapter;
        });
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(`${API_URL}/chapters/get/${chapterSourceId}`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        const pageFilenames: string[] = json.chapter.pages.map(
          (pageData: { id: number; next_id: number; media: string }) =>
            pageData.media
        );

        return {
          server: "",
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames.map(
      (filename: string) => `${STORAGE_URL}/${filename}`
    );
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, _reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.fetchFn(`${API_URL}/manga/all`)
      .then((response: Response) => response.json())
      .then((json: any) => {
        return json.data.map((data: any) => this._parseSeries(data));
      })
      .then((seriesList: Series[]) => {
        return {
          seriesList,
          hasMore: false,
        };
      });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.fetchFn(`${API_URL}/search/manga`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search: text }),
    })
      .then((response: Response) => response.json())
      .then((json: any) => {
        return json.data.map((data: any) => {
          const series: Series = {
            extensionId: METADATA.id,
            sourceId: data[0],
            sourceType: SeriesSourceType.STANDARD,
            title: data[1],
            altTitles: [],
            description: data[2],
            authors: [],
            artists: [],
            genres: [],
            themes: [],
            formats: [],
            contentWarnings: [],
            demographic: DemographicKey.UNCERTAIN,
            status: SeriesStatus.ONGOING,
            originalLanguageKey: LanguageKey.JAPANESE,
            numberUnread: 0,
            remoteCoverUrl: `${STORAGE_URL}/${data[4]}`,
            userTags: [],
          };
          return series;
        });
      })
      .then((seriesList: Series[]) => {
        return {
          seriesList,
          hasMore: false,
        };
      });
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};
}
