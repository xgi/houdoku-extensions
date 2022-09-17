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
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const TAG_MAP: { [key: string]: string } = {
  1: "ACTION",
  2: "ADVENTURE",
  3: "COMEDY",
  4: "DRAMA",
  5: "SLICE_OF_LIFE",
  6: "ECCHI",
  7: "FANTASY",
  8: "MAGIC",
  9: "SUPERNATURAL",
  10: "HORROR",
  11: "MYSTERY",
  12: "PSYCHOLOGICAL",
  13: "ROMANCE",
  14: "SCI_FI",
  15: "THRILLER",
  16: "SPORTS",
  17: "SHOUJO_AI",
  18: "SHOUNEN_AI",
  19: "HAREM",
  20: "MECHA",
  21: "SURVIVAL",
  22: "REINCARNATION",
  23: "GORE",
  24: "POST_APOCALYPTIC",
  25: "TRAGEDY",
  26: "SCHOOL_LIFE",
  27: "HISTORICAL",
  28: "MILITARY",
  29: "POLICE",
  30: "CRIME",
  31: "SUPERHERO",
  32: "VAMPIRES",
  33: "MARTIAL_ARTS",
  34: "SAMURAI",
  35: "GENDERSWAP",
  36: "VIRTUAL_REALITY",
  37: "Cyberpunk",
  38: "MUSIC",
  39: "Parody",
  40: "Animation",
  41: "DEMONS",
  42: "Family",
  43: "Foreign",
  44: "Children",
  45: "Reality",
  46: "Telenovel",
  47: "MILITARY",
  48: "West",
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
  _parseOneshotChapter = (doc: Document): Chapter[] => {
    const chapterList = doc.getElementsByClassName("chapter-list")![0];
    const chapterRows = chapterList.getElementsByClassName("list-group-item")!;

    return Array.from(chapterRows).map((chapterRow) => {
      const groupContainer = chapterRow.getElementsByTagName("span")![0];
      const dateStr = chapterRow.getElementsByClassName("badge-primary")![0].textContent.trim();
      const btn = chapterRow.getElementsByClassName("btn-sm")![0];

      return {
        id: undefined,
        seriesId: undefined,
        sourceId: btn.getAttribute("href")!.split("/").pop()!,
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

  _parseSearchResults = (doc: Document) => {
    const entries = doc.getElementsByClassName("col-6")!;
    const seriesList: Series[] = Array.from(entries).map((node) => {
      const img = node.getElementsByTagName("img")![0];
      const link = img.parentElement;
      const sourceId = link!.getAttribute("href")!.split("/library/").pop()!;

      return {
        id: undefined,
        extensionId: metadata.id,
        sourceId,
        sourceType: SeriesSourceType.STANDARD,
        title: img.getAttribute("alt")!.trim(),
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tags: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: ORIGINAL_LANGUAGE_MAP[sourceId.split("/")[0]],
        numberUnread: 0,
        remoteCoverUrl: img.getAttribute("src")!,
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
    return this.utilFns
      .webviewFn(`https://lectormanga.com/library/${id}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);

        const img = doc.getElementsByTagName("img")![0];

        const details = doc.getElementsByClassName("col-sm-9")![0];
        const title = details.getElementsByTagName("h1")![0].firstChild!.textContent.trim();

        const headings = details.getElementsByTagName("h5")!;
        const type = headings[0]
          .getElementsByTagName("span")![0]
          .getAttribute("class")!
          .split("text-")
          .pop()!;

        const publishingNodes = details.getElementsByClassName("status-publishing")!;
        const status = publishingNodes.length > 0 ? SeriesStatus.ONGOING : SeriesStatus.COMPLETED;

        const description = doc
          .getElementsByClassName("mt-2")![1]
          .getElementsByTagName("p")![0]
          .textContent.trim();

        const tags: string[] = [];
        Array.from(details.getElementsByClassName("badge-primary")!).forEach((tagNode) => {
          const tagId = tagNode.getAttribute("href")!.split("=").pop()!;
          if (tagId in TAG_MAP) {
            tags.push(TAG_MAP[tagId]);
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
          tags: tags,
          status,
          originalLanguageKey: ORIGINAL_LANGUAGE_MAP[type],
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("src")!,
        };
      });
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.utilFns
      .webviewFn(`https://lectormanga.com/library/${id}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        const container = doc.getElementById("chapters");

        if (!container) {
          return this._parseOneshotChapter(doc);
        }

        const titleHeadings = container.getElementsByClassName("mt-2 text-truncate")!;
        const chapterLists = container.getElementsByClassName("chapter-list")!;

        const chapters: Chapter[] = [];
        for (let i = 0; i < chapterLists.length; i++) {
          const chapterList = chapterLists[i];
          const heading = titleHeadings[i];

          const chapterRows = chapterList.getElementsByClassName("list-group-item")!;

          const newChapters: Chapter[] = Array.from(chapterRows).map((chapterRow) => {
            const title = heading.getAttribute("title")!;
            const groupContainer = chapterRow.getElementsByTagName("span")![0];
            const dateStr = chapterRow
              .getElementsByClassName("badge-primary")![0]
              .textContent.trim();
            const btn = chapterRow.getElementsByClassName("btn-sm")![0];

            const chapterNumStr = title.split(" ")[1].split(" ")[0];

            const chapter: Chapter = {
              id: undefined,
              seriesId: undefined,
              sourceId: btn.getAttribute("href")!.split("/").pop()!,
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
      });
  };

  getPageRequesterData: GetPageRequesterDataFunc = async (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    const newUrl = await this.utilFns
      .webviewFn(`https://lectormanga.com/view_uploads/${chapterSourceId}`)
      .then((response) => response.url);

    return this.utilFns
      .fetchFn(newUrl, {
        headers: { Referer: "https://lectormanga.com/" },
      })
      .then((response: Response) => response.text())
      .then((data: string) => {
        const root = data.split(`var dirPath = '`)[1].split(`'`)[0];
        const imgListStr = data.split(`var images = JSON.parse('`)[1].split(`'`)[0];
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
    return pageRequesterData.pageFilenames.map((fname) => `${pageRequesterData.server}${fname}`);
  };

  getPageData: GetPageDataFunc = (series: Series, url: string) => {
    const referer = url.split("/uploads/")[0].replace("img1.", "");
    return this.utilFns
      .fetchFn(url, {
        headers: { Referer: referer },
      })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        const buffer = await response.arrayBuffer();
        return `data:${contentType};base64,` + Buffer.from(buffer).toString("base64");
      });
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.utilFns
      .webviewFn(
        `https://lectormanga.com/library?title=&order_field=title&order_item=likes_count&order_dir=desc&type=&demography=&webcomic=&yonkoma=&amateur=&erotic=`
      )
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        return this._parseSearchResults(doc);
      });
  };

  getSearch: GetSearchFunc = (text: string, params: { [key: string]: string }, page: number) => {
    return this.utilFns
      .webviewFn(`https://lectormanga.com/library?title=${text}`)
      .then((response: WebviewResponse) => {
        const doc = this.utilFns.docFn(response.text);
        return this._parseSearchResults(doc);
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
