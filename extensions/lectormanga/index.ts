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
  SeriesTagKey,
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
import DOMParser from "dom-parser";
import metadata from "./metadata.json";
import { parseMetadata } from "../../util/configuring";
import DomParser from "dom-parser";

export const METADATA: ExtensionMetadata = parseMetadata(metadata);

const TAG_MAP: { [key: string]: SeriesTagKey } = {
  1: SeriesTagKey.ACTION,
  2: SeriesTagKey.ADVENTURE,
  3: SeriesTagKey.COMEDY,
  4: SeriesTagKey.DRAMA,
  5: SeriesTagKey.SLICE_OF_LIFE,
  6: SeriesTagKey.ECCHI,
  7: SeriesTagKey.FANTASY,
  8: SeriesTagKey.MAGIC,
  9: SeriesTagKey.SUPERNATURAL,
  10: SeriesTagKey.HORROR,
  11: SeriesTagKey.MYSTERY,
  12: SeriesTagKey.PSYCHOLOGICAL,
  13: SeriesTagKey.ROMANCE,
  14: SeriesTagKey.SCI_FI,
  15: SeriesTagKey.THRILLER,
  16: SeriesTagKey.SPORTS,
  17: SeriesTagKey.SHOUJO_AI,
  18: SeriesTagKey.SHOUNEN_AI,
  19: SeriesTagKey.HAREM,
  20: SeriesTagKey.MECHA,
  21: SeriesTagKey.SURVIVAL,
  22: SeriesTagKey.REINCARNATION,
  23: SeriesTagKey.GORE,
  24: SeriesTagKey.POST_APOCALYPTIC,
  25: SeriesTagKey.TRAGEDY,
  26: SeriesTagKey.SCHOOL_LIFE,
  27: SeriesTagKey.HISTORICAL,
  28: SeriesTagKey.MILITARY,
  29: SeriesTagKey.POLICE,
  30: SeriesTagKey.CRIME,
  31: SeriesTagKey.SUPERHERO,
  32: SeriesTagKey.VAMPIRES,
  33: SeriesTagKey.MARTIAL_ARTS,
  34: SeriesTagKey.SAMURAI,
  35: SeriesTagKey.GENDERSWAP,
  36: SeriesTagKey.VIRTUAL_REALITY,
  // 37: , cyberpunk
  38: SeriesTagKey.MUSIC,
  // 39: , parody
  // 40: , animation
  41: SeriesTagKey.DEMONS,
  // 42: , family
  // 43: , foreign
  // 44: , children
  // 45: , reality
  // 46: , telenovel
  47: SeriesTagKey.MILITARY,
  // 48: , west
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
    const chapterList = doc.getElementsByClassName("chapter-list")![0];
    const chapterRows = chapterList.getElementsByClassName("list-group-item")!;

    return chapterRows.map((chapterRow) => {
      const groupContainer = chapterRow.getElementsByTagName("span")![0];
      const dateStr = chapterRow
        .getElementsByClassName("badge-primary")![0]
        .textContent.trim();
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

  _parseSearchResults = (doc: DomParser.Dom) => {
    const entries = doc.getElementsByClassName("col-6")!;
    const seriesList: Series[] = entries.map((node) => {
      const img = node.getElementsByTagName("img")![0];
      const link = img.parentNode;

      const sourceId = link!.getAttribute("href")!.split("/library/").pop()!;
      const isHentai = node.getElementsByClassName("hentai-icon")!.length > 0;

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
        tagKeys: isHentai ? [SeriesTagKey.PORNOGRAPHIC] : [],
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
    return this.webviewFn(`https://lectormanga.com/library/${id}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        const img = doc.getElementsByTagName("img")![0];

        const details = doc.getElementsByClassName("col-sm-9")![0];
        const title = details
          .getElementsByTagName("h1")![0]
          .firstChild!.textContent.trim();

        const headings = details.getElementsByTagName("h5")!;
        const type = headings[0]
          .getElementsByTagName("span")![0]
          .getAttribute("class")!
          .split("text-")
          .pop()!;

        const publishingNodes =
          details.getElementsByClassName("status-publishing")!;
        const status =
          publishingNodes.length > 0
            ? SeriesStatus.ONGOING
            : SeriesStatus.COMPLETED;

        const description = doc
          .getElementsByClassName("mt-2")![1]
          .getElementsByTagName("p")![0]
          .textContent.trim();

        const tagKeys: SeriesTagKey[] = [];
        details.getElementsByClassName("badge-primary")!.forEach((tagNode) => {
          const tagId = tagNode.getAttribute("href")!.split("=").pop()!;
          if (tagId in TAG_MAP) {
            tagKeys.push(TAG_MAP[tagId]);
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
          tagKeys: tagKeys,
          status,
          originalLanguageKey: ORIGINAL_LANGUAGE_MAP[type],
          numberUnread: 0,
          remoteCoverUrl: img.getAttribute("src")!,
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
          container.getElementsByClassName("mt-2 text-truncate")!;
        const chapterLists = container.getElementsByClassName("chapter-list")!;

        const chapters: Chapter[] = [];
        for (let i = 0; i < chapterLists.length; i++) {
          const chapterList = chapterLists[i];
          const heading = titleHeadings[i];

          const chapterRows =
            chapterList.getElementsByClassName("list-group-item")!;

          const newChapters: Chapter[] = chapterRows.map((chapterRow) => {
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
