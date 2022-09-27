export enum FilterControlIds {
  Sort = "sort",
  Official = "tricheck-official",
  ScanStatus = "multitoggle-scanstatus",
  PublishStatus = "multitoggle-publishstatus",
  Type = "multitoggle-type",
  Genres = "multitoggle-genre",
}

export const FIELDS_GENRES = [
  { key: "Action", label: "Action" },
  { key: "Adult", label: "Adult" },
  { key: "Adventure", label: "Adventure" },
  { key: "Comedy", label: "Comedy" },
  { key: "Doujinshi", label: "Doujinshi" },
  { key: "Drama", label: "Drama" },
  { key: "Ecchi", label: "Ecchi" },
  { key: "Fantasy", label: "Fantasy" },
  { key: "Gender Bender", label: "Gender Bender" },
  { key: "Harem", label: "Harem" },
  { key: "Hentai", label: "Hentai" },
  { key: "Historical", label: "Historical" },
  { key: "Horror", label: "Horror" },
  { key: "Isekai", label: "Isekai" },
  { key: "Josei", label: "Josei" },
  { key: "Lolicon", label: "Lolicon" },
  { key: "Martial Arts", label: "Martial Arts" },
  { key: "Martial Arts  Shounen", label: "Martial Arts  Shounen" },
  { key: "Mature", label: "Mature" },
  { key: "Mecha", label: "Mecha" },
  { key: "Mystery", label: "Mystery" },
  { key: "Psychological", label: "Psychological" },
  { key: "Romance", label: "Romance" },
  { key: "School Life", label: "School Life" },
  { key: "Sci-fi", label: "Sci-fi" },
  { key: "Seinen", label: "Seinen" },
  { key: "Shotacon", label: "Shotacon" },
  { key: "Shoujo", label: "Shoujo" },
  { key: "Shoujo Ai", label: "Shoujo Ai" },
  { key: "Shounen", label: "Shounen" },
  { key: "Shounen Ai", label: "Shounen Ai" },
  { key: "Slice of Life", label: "Slice of Life" },
  { key: "Slice of Life  Supernatural", label: "Slice of Life  Supernatural" },
  { key: "Smut", label: "Smut" },
  { key: "Sports", label: "Sports" },
  { key: "Supernatural", label: "Supernatural" },
  { key: "Tragedy", label: "Tragedy" },
  { key: "Yaoi", label: "Yaoi" },
  { key: "Yuri", label: "Yuri" },
];

export const FIELDS_STATUS = [
  { key: "Cancelled", label: "Cancelled" },
  { key: "Complete", label: "Complete" },
  { key: "Discontinued", label: "Discontinued" },
  { key: "Hiatus", label: "Hiatus" },
  { key: "Ongoing", label: "Ongoing" },
];

export const FIELDS_TYPES = [
  { key: "Doujinshi", label: "Doujinshi" },
  { key: "Manga", label: "Manga" },
  { key: "Manhua", label: "Manhua" },
  { key: "Manhwa", label: "Manhwa" },
  { key: "OEL", label: "OEL" },
  { key: "One-shot", label: "One-shot" },
];

export enum SortType {
  POPULARITY = "POPULARITY",
  UPDATED = "UPDATED",
  TITLE = "TITLE",
  YEAR = "YEAR",
}

export const FIELDS_SORT = [
  { key: SortType.POPULARITY, label: "Popularity" },
  { key: SortType.UPDATED, label: "Updated" },
  { key: SortType.TITLE, label: "Title" },
  { key: SortType.YEAR, label: "Year" },
];
