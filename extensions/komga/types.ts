export type KomgaSeriesMetadata = {
  status: "HIATUS" | "ENDED" | "ONGOING" | "ABANDONED";
  title: string;
  summary: string;
  language: string;
  genres: string[];
  tags: string[];
};

export type KomgaSeriesBooksMetadata = {
  authors: {
    name: string;
    role: string;
  }[];
};

export type KomgaSeries = {
  id: string;
  libraryId: string;
  name: string;
  booksCount: number;
  metadata: KomgaSeriesMetadata;
  booksMetadata: KomgaSeriesBooksMetadata;
};

export type KomgaSeriesListResponse = {
  content: KomgaSeries[];
  first: boolean;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  numberOfElements: number;
}

export type KomgaBookMetadata = {
  title: string;
  summary: string;
  number: string;
  numberSort: number;
  authors: {
    name: string;
    role: string;
  }[];
  tags: string[];
};

export type KomgaBook = {
  id: string;
  seriesId: string;
  seriesTitle: string;
  name: string;
  url: string;
  number: number;
  fileLastModified: string;
  metadata: KomgaBookMetadata;
};

export type KomgaPage = {
  number: number;
  fileName: string;
  mediaType: string;
  width: number;
  heihgt: number;
}