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
  ContentWarningKey,
  GenreKey,
  ThemeKey,
  WebviewResponse,
} from "houdoku-extension-lib";
import {
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import { Response } from "node-fetch";
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import DomParser from "dom-parser";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const GENRE_MAP: { [key: string]: GenreKey } = {
  1: GenreKey.ACTION,
  2: GenreKey.ADVENTURE,
  3: GenreKey.COMEDY,
  4: GenreKey.DRAMA,
  5: GenreKey.SLICE_OF_LIFE,
  7: GenreKey.FANTASY,
  10: GenreKey.HORROR,
  11: GenreKey.MYSTERY,
  12: GenreKey.PSYCHOLOGICAL,
  13: GenreKey.ROMANCE,
  14: GenreKey.SCI_FI,
  15: GenreKey.THRILLER,
  16: GenreKey.SPORTS,
  17: GenreKey.SHOUJO_AI,
  18: GenreKey.SHOUNEN_AI,
  20: GenreKey.MECHA,
  25: GenreKey.TRAGEDY,
  27: GenreKey.HISTORICAL,
  30: GenreKey.CRIME,
  31: GenreKey.SUPERHERO,
  // 37: , cyberpunk
  // 39: , parody
  // 40: , animation
  // 42: , family
  // 43: , foreign
  // 44: , children
  // 45: , reality
  // 46: , telenovel
  // 48: , west
};

const THEME_MAP: { [key: string]: ThemeKey } = {
  8: ThemeKey.MAGIC,
  9: ThemeKey.SUPERNATURAL,
  19: ThemeKey.HAREM,
  21: ThemeKey.SURVIVAL,
  22: ThemeKey.REINCARNATION,
  24: ThemeKey.POST_APOCALYPTIC,
  26: ThemeKey.SCHOOL_LIFE,
  28: ThemeKey.MILITARY,
  29: ThemeKey.POLICE,
  32: ThemeKey.VAMPIRES,
  33: ThemeKey.MARTIAL_ARTS,
  34: ThemeKey.SAMURAI,
  35: ThemeKey.GENDERSWAP,
  36: ThemeKey.VIRTUAL_REALITY,
  38: ThemeKey.MUSIC,
  41: ThemeKey.DEMONS,
  47: ThemeKey.MILITARY,
};

const CONTENT_WARNING_MAP: { [key: string]: ContentWarningKey } = {
  6: ContentWarningKey.ECCHI,
  23: ContentWarningKey.GORE,
};

const ORIGINAL_LANGUAGE_MAP: { [key: string]: LanguageKey } = {
  manga: LanguageKey.JAPANESE,
  manhua: LanguageKey.CHINESE_SIMP,
  manhwa: LanguageKey.KOREAN,
  one_shot: LanguageKey.JAPANESE,
  novel: LanguageKey.JAPANESE,
  doujinshi: LanguageKey.JAPANESE,
  oel: LanguageKey.ENGLISH,
};

export class ExtensionClient extends ExtensionClientAbstract {
  _parseOneshotChapter = (doc: DOMParser.Dom): Chapter[] => {
    const chapterList = doc.getElementsByClassName("chapter-list")[0];
    const chapterRows = chapterList.getElementsByClassName("list-group-item");

    return chapterRows.map((chapterRow) => {
      const groupContainer = chapterRow.getElementsByTagName("span")[0];
      const dateStr = chapterRow
        .getElementsByClassName("badge-primary")[0]
        .textContent.trim();
      const btn = chapterRow.getElementsByClassName("btn-sm")[0];

      return {
        id: undefined,
        seriesId: undefined,
        sourceId: btn.getAttribute("href").split("/").pop(),
        title: "",
        chapterNumber: "1",
        volumeNumber: "",
        languageKey: LanguageKey.SPANISH_ES,
        groupName: groupContainer.textContent.trim(),
        time: new Date(dateStr).getTime(),
        read: false,
      };
    });
  };

  _parseSearchResults = (doc: DomParser.Dom) => {
    const entries = doc.getElementsByClassName("col-6");
    const seriesList: Series[] = entries.map((node) => {
      const img = node.getElementsByTagName("img")[0];
      const link = img.parentNode;

      const sourceId = link.getAttribute("href").split("/library/").pop();
      const isHentai = node.getElementsByClassName("hentai-icon").length > 0;

      return {
        id: undefined,
        extensionId: metadata.id,
        sourceId,
        sourceType: SeriesSourceType.STANDARD,
        title: img.getAttribute("alt").trim(),
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        genres: [],
        themes: [],
        formats: [],
        contentWarnings: isHentai ? [ContentWarningKey.PORNOGRAPHIC] : [],
        demographic: DemographicKey.UNCERTAIN,
        status: SeriesStatus.ONGOING,
        originalLanguageKey: ORIGINAL_LANGUAGE_MAP[sourceId.split("/")[0]],
        numberUnread: 0,
        remoteCoverUrl: img.getAttribute("src"),
        userTags: [],
      };
    });

    return {
      seriesList,
      hasMore: false,
    };
  };

  getMetadata: () => ExtensionMetadata = () => {
    return METADATA;
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`https://lectormanga.com/library/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const img = doc.getElementsByTagName("img")[0];

        const details = doc.getElementsByClassName("col-sm-9")[0];
        const title = details
          .getElementsByTagName("h1")[0]
          .firstChild.textContent.trim();

        const headings = details.getElementsByTagName("h5");
        const type = headings[0]
          .getElementsByTagName("span")[0]
          .getAttribute("class")
          .split("text-")
          .pop();

        const publishingNodes =
          details.getElementsByClassName("status-publishing");
        const status =
          publishingNodes.length > 0
            ? SeriesStatus.ONGOING
            : SeriesStatus.COMPLETED;

        const description = doc
          .getElementsByClassName("mt-2")[1]
          .getElementsByTagName("p")[0]
          .textContent.trim();

        const tagNodes = details.getElementsByClassName("badge-primary");
        const genres: GenreKey[] = [];
        const themes: ThemeKey[] = [];
        const contentWarnings: ContentWarningKey[] = [];
        tagNodes.forEach((tagNode) => {
          const tagId = tagNode.getAttribute("href").split("=").pop();
          if (tagId in GENRE_MAP) {
            genres.push(GENRE_MAP[tagId]);
          }
          if (tagId in THEME_MAP) {
            themes.push(THEME_MAP[tagId]);
          }
          if (tagId in CONTENT_WARNING_MAP) {
            contentWarnings.push(CONTENT_WARNING_MAP[tagId]);
          }
        });

        return {
          id: undefined,
          extensionId: metadata.id,
          sourceId: id,
          sourceType: SeriesSourceType.STANDARD,
          title,
          altTitles: [],
          description,
          authors: [],
          artists: [],
          genres,
          themes,
          formats: [],
          contentWarnings,
          demographic: DemographicKey.UNCERTAIN,
          status,
          originalLanguageKey: ORIGINAL_LANGUAGE_MAP[type],
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("src"),
          userTags: [],
        };
      }
    );
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`https://lectormanga.com/library/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);
        const container = doc.getElementById("chapters");

        if (!container) {
          return this._parseOneshotChapter(doc);
        }

        const titleHeadings =
          container.getElementsByClassName("mt-2 text-truncate");
        const chapterLists = container.getElementsByClassName("chapter-list");

        const chapters: Chapter[] = [];
        for (let i = 0; i < chapterLists.length; i++) {
          const chapterList = chapterLists[i];
          const heading = titleHeadings[i];

          const chapterRows =
            chapterList.getElementsByClassName("list-group-item");

          const newChapters: Chapter[] = chapterRows.map((chapterRow) => {
            const title = heading.getAttribute("title");
            const groupContainer = chapterRow.getElementsByTagName("span")[0];
            const dateStr = chapterRow
              .getElementsByClassName("badge-primary")[0]
              .textContent.trim();
            const btn = chapterRow.getElementsByClassName("btn-sm")[0];

            const chapterNumStr = title.split(" ")[1].split(" ")[0];

            const chapter: Chapter = {
              id: undefined,
              seriesId: undefined,
              sourceId: btn.getAttribute("href").split("/").pop(),
              title,
              chapterNumber: parseFloat(chapterNumStr).toString(),
              volumeNumber: "",
              languageKey: LanguageKey.SPANISH_ES,
              groupName: groupContainer.textContent.trim(),
              time: new Date(dateStr).getTime(),
              read: false,
            };
            return chapter;
          });
          newChapters.forEach((chapter) => chapters.push(chapter));
        }

        return chapters;
      }
    );
  };

  getPageRequesterData: GetPageRequesterDataFunc = async (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    const newUrl = await this.webviewFn(
      `https://lectormanga.com/view_uploads/${chapterSourceId}`
    ).then((response) => response.url);

    return this.fetchFn(newUrl, {
      headers: { Referer: "https://lectormanga.com/" },
    })
      .then((response: Response) => response.text())
      .then((data: string) => {
        const root = data.split(`var dirPath = '`)[1].split(`'`)[0];
        const imgListStr = data
          .split(`var images = JSON.parse('`)[1]
          .split(`'`)[0];
        const pageFilenames: string[] = JSON.parse(imgListStr);

        return {
          server: root,
          hash: "",
          numPages: pageFilenames.length,
          pageFilenames,
        };
      });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames.map(
      (fname) => `${pageRequesterData.server}${fname}`
    );
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    const referer = url.split("/uploads/")[0].replace("img1.", "");
    return this.fetchFn(url, {
      headers: { Referer: referer },
    }).then(async (response) => {
      const contentType = response.headers.get("content-type");
      const buffer = await response.arrayBuffer();
      return (
        `data:${contentType};base64,` + Buffer.from(buffer).toString("base64")
      );
    });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.webviewFn(
      `https://lectormanga.com/library?title=&order_field=title&order_item=likes_count&order_dir=desc&type=&demography=&webcomic=&yonkoma=&amateur=&erotic=`
    ).then((response: WebviewResponse) => {
      const doc = this.domParser.parseFromString(response.text);
      return this._parseSearchResults(doc);
    });
  };

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.webviewFn(`https://lectormanga.com/library?title=${text}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);
        return this._parseSearchResults(doc);
      }
    );
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};
}
