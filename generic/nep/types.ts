export type DirectoryEntry = {
  indexName: string;
  seriesName: string;
  official: boolean; // yes or no
  scanStatus: "Cancelled" | "Complete" | "Discontinued" | "Hiatus" | "Ongoing";
  publishStatus: "Cancelled" | "Complete" | "Discontinued" | "Hiatus" | "Ongoing";
  type: "Doujinshi" | "Manga" | "Manhua" | "Manhwa" | "OEL" | "One-shot";
  year: number; // parse string
  popularity: number; // v, parse string
  genres: string[];
  lastScanReleased: number; // ls, parse string as date
};
