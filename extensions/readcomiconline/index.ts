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
  SeriesListResponse,
  GenreKey,
  ThemeKey,
  FormatKey,
  ContentWarningKey,
} from "houdoku-extension-lib";
import {
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import { Response } from "node-fetch";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

const BASE_URL = "https://readcomiconline.li";
export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const TAG_KEY_MAP: {
  [key: string]:
    | GenreKey
    | ThemeKey
    | FormatKey
    | ContentWarningKey
    | DemographicKey;
} = {
  Action: GenreKey.ACTION,
  Adventure: GenreKey.ADVENTURE,
  Anthology: FormatKey.ANTHOLOGY,
  Comedy: GenreKey.COMEDY,
  Crime: GenreKey.DRAMA,
  Fantasy: GenreKey.FANTASY,
  Historical: GenreKey.HISTORICAL,
  Horror: GenreKey.HORROR,
  "Martial Arts": ThemeKey.MARTIAL_ARTS,
  Military: ThemeKey.MILITARY,
  Music: ThemeKey.MUSIC,
  Mystery: GenreKey.MYSTERY,
  "Post-Apocalyptic": ThemeKey.POST_APOCALYPTIC,
  Psychological: GenreKey.PSYCHOLOGICAL,
  Romance: GenreKey.ROMANCE,
  "School Life": ThemeKey.SCHOOL_LIFE,
  "Sci-Fi": GenreKey.SCI_FI,
  "Slice of Life": GenreKey.SLICE_OF_LIFE,
  Sport: GenreKey.SPORTS,
  Superhero: GenreKey.SUPERHERO,
  Supernatural: ThemeKey.SUPERNATURAL,
  Thriller: GenreKey.THRILLER,
  Vampires: ThemeKey.VAMPIRES,
  "Video Games": ThemeKey.VIDEO_GAMES,
  Zombies: ThemeKey.ZOMBIES,
};

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  Ongoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

const getDetailsRowFields = (
  rows: DOMParser.Node[],
  text: string
): string[] => {
  const row = rows.find((row: DOMParser.Node) =>
    row.textContent.includes(text)
  );
  if (!row) return [];

  return row
    .getElementsByTagName("a")
    .map((node: DOMParser.Node) => node.textContent.trim());
};

const parseDirectoryResponse = (doc: DOMParser.Dom): SeriesListResponse => {
  const rows = doc.getElementsByClassName("section group list");
  const hasMore = doc.getElementsByClassName("right_bt next_bt").length > 0;

  const seriesList = rows.map((row: DOMParser.Node) => {
    const link = row.getElementsByTagName("a")[0];
    const img = link.getElementsByTagName("img")[0];

    const series: Series = {
      id: undefined,
      extensionId: METADATA.id,
      sourceId: link.getAttribute("href").replace("/Comic/", ""),
      sourceType: SeriesSourceType.STANDARD,
      title: img.getAttribute("title").trim(),
      altTitles: [],
      description: "",
      authors: [],
      artists: [],
      genres: [],
      themes: [],
      formats: [],
      contentWarnings: [],
      demographic: DemographicKey.UNCERTAIN,
      status: SeriesStatus.ONGOING,
      originalLanguageKey: LanguageKey.ENGLISH,
      numberUnread: 0,
      remoteCoverUrl: `${BASE_URL}/${img.getAttribute("src")}`,
      userTags: [],
    };
    return series;
  });

  return {
    seriesList,
    hasMore,
  };
};

export class ExtensionClient extends ExtensionClientAbstract {
  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${BASE_URL}/Comic/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        const parent = doc.getElementsByClassName("section group")[0];
        const description = doc
          .getElementsByClassName("section group")[1]
          .textContent.trim();

        const img = parent.getElementsByTagName("img")[0];
        const rows = parent.getElementsByTagName("p");

        const altNames = getDetailsRowFields(rows, "Other name:");
        const tags = getDetailsRowFields(rows, "Genres:");
        const authors = getDetailsRowFields(rows, "Writer:");
        const artists = getDetailsRowFields(rows, "Artist:");

        const statusRow = rows.find((row: DOMParser.Node) =>
          row.textContent.includes("Status:")
        );
        const statusStr =
          statusRow && false
            ? statusRow.textContent.replace("Status:&nbsp;", "").trim()
            : "";

        const mapped_tags: (
          | GenreKey
          | ThemeKey
          | FormatKey
          | ContentWarningKey
          | DemographicKey
        )[] = [];
        tags.forEach((source_tag: string) => {
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

        const series: Series = {
          extensionId: METADATA.id,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title: img.getAttribute("title").trim(),
          altTitles: altNames,
          description: description,
          authors: authors,
          artists: artists,
          genres: genres,
          themes: themes,
          formats: formats,
          contentWarnings: contentWarnings,
          demographic: DemographicKey.UNCERTAIN,
          status: SERIES_STATUS_MAP[statusStr] || SeriesStatus.ONGOING,
          originalLanguageKey: LanguageKey.ENGLISH,
          numberUnread: 0,
          remoteCoverUrl: `${BASE_URL}/${img.getAttribute("src")}`,
          userTags: [],
        };
        return series;
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.fetchFn(`${BASE_URL}/Comic/${id}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        const parent = doc.getElementsByClassName("section group")[2];
        const rows = parent.getElementsByTagName("li");

        return rows.map((row: DOMParser.Node) => {
          const link = row.getElementsByTagName("a")[0];
          const title = link.textContent.trim();
          const chapterNum = title.startsWith("Issue #")
            ? title.split("Issue #")[1]
            : "";

          return {
            id: undefined,
            seriesId: undefined,
            sourceId: link.getAttribute("href"),
            title: title,
            chapterNumber: chapterNum,
            volumeNumber: "",
            languageKey: LanguageKey.ENGLISH,
            groupName: "",
            time: 0,
            read: false,
          };
        });
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.fetchFn(`${BASE_URL}${chapterSourceId}}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        // const doc = this.domParser.parseFromString(data);

        const snippetRegexp = /lstImages\.push\(\"http.*\)/g;
        const snippets = [...data.matchAll(snippetRegexp)];

        const pageFilenames: string[] = snippets.map((snippet) =>
          snippet.toString().replace('lstImages.push("', "").replace('")', "")
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
    return pageRequesterData.pageFilenames;
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    return new Promise((resolve, reject) => {
      resolve(url);
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.fetchFn(`${BASE_URL}/ComicList/LatestUpdate?page=${page}`)
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        return parseDirectoryResponse(doc);
      });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.fetchFn(`${BASE_URL}/AdvanceSearch?page=${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: [`comicName=${text}`, "genres=[]", "status="].join("&"),
    })
      .then((response: Response) => response.text())
      .then((data: string) => {
        const doc = this.domParser.parseFromString(data);
        return parseDirectoryResponse(doc);
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
