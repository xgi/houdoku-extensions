import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetPageDataFunc,
  PageRequesterData,
  GetDirectoryFunc,
  SeriesTagKey,
  WebviewFunc,
  FetchFunc,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  WebviewResponse,
  SeriesListResponse,
  Chapter,
  LanguageKey,
  Series,
  SeriesSourceType,
  SeriesStatus,
} from "houdoku-extension-lib";
import DOMParser from "dom-parser";
import DomParser from "dom-parser";

const SERIES_STATUS_MAP: { [key: string]: SeriesStatus } = {
  OnGoing: SeriesStatus.ONGOING,
  Completed: SeriesStatus.COMPLETED,
};

const TAG_MAP: { [key: string]: SeriesTagKey } = {
  action: SeriesTagKey.ACTION,
  adventure: SeriesTagKey.ADVENTURE,
  comedy: SeriesTagKey.COMEDY,
  crime: SeriesTagKey.CRIME,
  drama: SeriesTagKey.DRAMA,
  fantasy: SeriesTagKey.FANTASY,
  historical: SeriesTagKey.HISTORICAL,
  horror: SeriesTagKey.HORROR,
  isekai: SeriesTagKey.ISEKAI,
  mystery: SeriesTagKey.MYSTERY,
  psychological: SeriesTagKey.PSYCHOLOGICAL,
  romance: SeriesTagKey.ROMANCE,
  scifi: SeriesTagKey.SCI_FI,
  sliceoflife: SeriesTagKey.SLICE_OF_LIFE,
  sports: SeriesTagKey.SPORTS,
  thriller: SeriesTagKey.THRILLER,
  tragedy: SeriesTagKey.TRAGEDY,
  yaoi: SeriesTagKey.YAOI,
  yuri: SeriesTagKey.YURI,
  harem: SeriesTagKey.HAREM,
  incest: SeriesTagKey.INCEST,
  office: SeriesTagKey.OFFICE_WORKERS,
  schoollife: SeriesTagKey.SCHOOL_LIFE,
  supernatural: SeriesTagKey.SUPERNATURAL,
  adult: SeriesTagKey.PORNOGRAPHIC,
  shounen: SeriesTagKey.SHOUNEN,
  seinen: SeriesTagKey.SEINEN,
  shoujo: SeriesTagKey.SHOUJO,
  josei: SeriesTagKey.JOSEI,
};

export class MadaraClient {
  fetchFn: FetchFunc;
  webviewFn: WebviewFunc;
  domParser: DOMParser;
  extensionId: string;
  baseUrl: string;

  constructor(
    extensionId: string,
    baseUrl: string,
    fetchFn: FetchFunc,
    webviewFn: WebviewFunc,
    domParser: DOMParser
  ) {
    this.extensionId = extensionId;
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
    this.webviewFn = webviewFn;
    this.domParser = domParser;
  }

  _parseSearch = (doc: DomParser.Dom): SeriesListResponse => {
    const searchContainers = doc.getElementsByClassName("c-tabs-item__content");
    if (!searchContainers) return { seriesList: [], hasMore: false };

    const seriesList: Series[] = [];
    for (let i = 0; i < searchContainers.length; i += 1) {
      const item = searchContainers[i];
      if (!item) continue;

      const linkElements = item.getElementsByTagName("a");
      if (!linkElements) continue;

      const link = linkElements[0];
      if (!link) continue;

      const title = link.getAttribute("title");
      const href = link.getAttribute("href")!.split(`${this.baseUrl}`).pop()!;
      const sourceId = href.substr(0, href.length - 1);
      if (title === null || sourceId === undefined) continue;

      const image = item.getElementsByClassName("img-responsive")![0];

      const coverUrl = (
        image.attributes.find((attrib: any) => attrib.name === "data-src") !==
        undefined
          ? image.getAttribute("data-src")!
          : image.getAttribute("srcset")!
      ).split(" ")[0];

      seriesList.push({
        id: undefined,
        extensionId: this.extensionId,
        sourceId: `x:${sourceId}`,
        sourceType: SeriesSourceType.STANDARD,
        title,
        altTitles: [],
        description: "",
        authors: [],
        artists: [],
        tagKeys: [],
        status: SeriesStatus.ONGOING,
        originalLanguageKey: LanguageKey.JAPANESE,
        numberUnread: 0,
        remoteCoverUrl: coverUrl || "",
      });
    }

    const prevLink = doc.getElementsByClassName("nav-previous")!;
    return { seriesList, hasMore: prevLink.length > 0 };
  };

  getSeries: GetSeriesFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${this.baseUrl}/${id.split(":").pop()}`).then(
      (response: WebviewResponse) => {
        const doc = this.domParser.parseFromString(response.text);

        try {
          const titleContainer = doc.getElementsByClassName("post-title")![0];
          const title = titleContainer
            .getElementsByTagName("h1")![0]
            .lastChild!.textContent.trim();

          const detailsContainer =
            doc.getElementsByClassName("tab-summary")![0];
          const link = detailsContainer.getElementsByTagName("a")![0];

          const href = link
            .getAttribute("href")!
            .split(`${this.baseUrl}`)
            .pop()!;
          const pageId = href.substr(0, href.length - 1);
          const dataId = doc
            .getElementsByClassName("wp-manga-action-button")![0]
            .getAttribute("data-post")!;
          const sourceId = `${dataId}:${pageId}`;

          const image = link.getElementsByTagName("img")![0];
          const remoteCoverUrl = (
            image.attributes.find(
              (attrib: any) => attrib.name === "data-src"
            ) !== undefined
              ? image.getAttribute("data-src")!
              : image.getAttribute("srcset")!
          ).split(" ")[0];

          const description = doc
            .getElementsByClassName("description-summary")![0]
            .textContent.trim();

          const author = detailsContainer
            ?.getElementsByClassName("author-content")![0]
            ?.textContent.trim();
          const artist = detailsContainer
            ?.getElementsByClassName("artist-content")![0]
            ?.textContent.trim();

          const statusContainer =
            detailsContainer.getElementsByClassName("post-status")![0];
          const statusText = statusContainer
            .getElementsByClassName("summary-content")!
            .pop()!
            .textContent.trim();

          const tagKeys: SeriesTagKey[] = [];
          const tagLinks = detailsContainer
            .getElementsByClassName("genres-content")![0]
            .getElementsByTagName("a")!;

          Object.values(tagLinks).forEach((tagLink: DOMParser.Node) => {
            const tagStr = tagLink.textContent
              .trim()
              .replace(" ", "")
              .replace("-", "")
              .toLowerCase();
            if (tagStr !== undefined && tagStr in TAG_MAP) {
              tagKeys.push(TAG_MAP[tagStr]);
            }
          });

          const series: Series = {
            id: undefined,
            extensionId: this.extensionId,
            sourceId: sourceId || "",
            sourceType: SeriesSourceType.STANDARD,
            title: title || "",
            altTitles: [],
            description: description || "",
            authors: author ? [author] : [],
            artists: artist ? [artist] : [],
            tagKeys: tagKeys,
            status: statusText
              ? SERIES_STATUS_MAP[statusText]
              : SeriesStatus.ONGOING,
            originalLanguageKey: LanguageKey.KOREAN,
            numberUnread: 0,
            remoteCoverUrl: remoteCoverUrl || "",
          };
          return series;
        } catch (err) {
          console.error(err);
          return undefined;
        }
      }
    );
  };

  getChapters: GetChaptersFunc = (sourceType: SeriesSourceType, id: string) => {
    return this.webviewFn(`${this.baseUrl}${id.split(":")[1]}/ajax/chapters`, {
      postData: [
        {
          type: "rawData",
          bytes: Buffer.from(""),
        },
      ],
    }).then((response: WebviewResponse) => {
      const chapters: Chapter[] = [];
      const doc = this.domParser.parseFromString(response.text);

      try {
        const chapterContainers =
          doc.getElementsByClassName("wp-manga-chapter")!;

        chapterContainers.forEach((node: DOMParser.Node) => {
          const dateStr = node
            .getElementsByClassName("chapter-release-date")![0]
            .textContent.trim();
          const date = new Date(dateStr);
          const link = node.getElementsByTagName("a")![0];
          const title = link.textContent.trim();

          let href = link.getAttribute("href");
          href =
            href?.charAt(href.length - 1) === "/"
              ? href.substr(0, href.length - 1)
              : href;
          const sourceId = href?.split("/").pop();

          const matchChapterNum: RegExpMatchArray | null = title.match(
            new RegExp(/(^|\s)(\d)+/g)
          );

          if (matchChapterNum === null) return;
          const chapterNumber = matchChapterNum[0].trim();

          const chapter: Chapter = {
            id: undefined,
            seriesId: undefined,
            sourceId: sourceId || "",
            title: title || "",
            chapterNumber: chapterNumber || "",
            volumeNumber: "",
            languageKey: LanguageKey.ENGLISH,
            groupName: "",
            time: date.getTime(),
            read: false,
          };
          chapters.push(chapter);
        });

        return chapters;
      } catch (err) {
        console.error(err);
        return [];
      }
    });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    sourceType: SeriesSourceType,
    seriesSourceId: string,
    chapterSourceId: string
  ) => {
    return this.webviewFn(
      `${this.baseUrl}/${seriesSourceId.split(":").pop()}/${chapterSourceId}`
    ).then((response: WebviewResponse) => {
      const doc = this.domParser.parseFromString(response.text);
      const imgContainers = doc.getElementsByClassName("wp-manga-chapter-img")!;

      const pageFilenames = imgContainers.map((node: DOMParser.Node) => {
        return node.attributes.find(
          (attrib: any) => attrib.name === "data-src"
        ) !== undefined
          ? node.getAttribute("data-src")!
          : node.getAttribute("src")!;
      });

      return {
        server: "",
        hash: "",
        numPages: pageFilenames.length,
        pageFilenames: pageFilenames,
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

  getSearch: GetSearchFunc = (
    text: string,
    params: { [key: string]: string },
    page: number
  ) => {
    return this.webviewFn(
      `${this.baseUrl}/page/${page}/?s=${text}&post_type=wp-manga`
    ).then((response: WebviewResponse) =>
      this._parseSearch(this.domParser.parseFromString(response.text))
    );
  };

  getDirectory: GetDirectoryFunc = (page: number) => {
    return this.webviewFn(
      `${this.baseUrl}/page/${page}/?s=&post_type=wp-manga`
    ).then((response: WebviewResponse) =>
      this._parseSearch(this.domParser.parseFromString(response.text))
    );
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = (newSettings: { [key: string]: any }) => {};
}
