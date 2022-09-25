export enum FilterControlIds {
  Sort = "sort",
  Official = "tricheck-official",
  ScanStatus = "multitoggle-scanstatus",
  PublishStatus = "multitoggle-publishstatus",
  Type = "multitoggle-type",
  Genres = "multitoggle-genre",
}

export const FIELDS_GENRES = [
  { key: "Adventure", label: "Adventure" },
  { key: "Comedy", label: "Comedy" },
  { key: "Drama", label: "Drama" },
  { key: "Fantasy", label: "Fantasy" },
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
