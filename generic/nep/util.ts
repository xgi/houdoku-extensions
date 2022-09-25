import { FilterSortValue, MultiToggleValues, SortDirection, TriState } from "houdoku-extension-lib";
import { SortType } from "./filters";
import { DirectoryEntry } from "./types";

export const applyTriStateFilter = (
  entries: DirectoryEntry[],
  entryKey: string,
  toggleValues: MultiToggleValues
): DirectoryEntry[] => {
  const toggleEntries = Object.entries(toggleValues);
  let filtered = entries;

  const includeTags = toggleEntries.filter(([, value]) => value === TriState.INCLUDE);
  if (includeTags.length > 0) {
    filtered = filtered.filter((entry) =>
      includeTags.every(
        ([includeTag]) => entry[entryKey] === includeTag || entry[entryKey].includes(includeTag)
      )
    );
  }
  const excludeTags = toggleEntries.filter(([, value]) => value === TriState.EXCLUDE);
  if (excludeTags.length > 0) {
    filtered = filtered.filter((entry) =>
      excludeTags.every(
        ([excludeTag]) => entry[entryKey] !== excludeTag && !entry.genres.includes(excludeTag)
      )
    );
  }

  return filtered;
};

export const applySort = (
  entries: DirectoryEntry[],
  sortValue: FilterSortValue
): DirectoryEntry[] => {
  switch (sortValue.key) {
    case SortType.POPULARITY:
      entries.sort((a, b) =>
        sortValue.direction === SortDirection.DESCENDING
          ? b.popularity - a.popularity
          : a.popularity - b.popularity
      );
      break;
    case SortType.YEAR:
      entries.sort((a, b) =>
        sortValue.direction === SortDirection.DESCENDING ? b.year - a.year : a.year - b.year
      );
      break;
    case SortType.UPDATED:
      entries.sort((a, b) =>
        sortValue.direction === SortDirection.DESCENDING
          ? b.lastScanReleased - a.lastScanReleased
          : a.lastScanReleased - b.lastScanReleased
      );
      break;
    case SortType.TITLE:
      entries.sort((a, b) =>
        sortValue.direction === SortDirection.DESCENDING
          ? b.seriesName.localeCompare(a.seriesName)
          : a.seriesName.localeCompare(b.seriesName)
      );
      break;
  }
  return entries;
};
