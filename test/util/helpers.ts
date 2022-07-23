import { Series } from "houdoku-extension-lib";

/**
 * Determine whether a series matches an object.
 * @param series Series to compare with
 * @param expected object with any fields from Series that must have a match in the series
 * @returns whether series contains all entries in expected
 */
export const matchesSeries = (
  series: Series,
  expected: { [key: string]: any }
) => {
  return Object.keys(expected).every((key) => expected[key] === series[key]);
};

/**
 * Determine whether a list of Series contains a specific one.
 * @param seriesList array of Series
 * @param expected object with any fields from Series that must have a match in seriesList
 * @returns whether there is a Series in seriesList containing all entries in expected
 */
export const hasSeries = (
  seriesList: Series[],
  expected: { [key: string]: any }
) => {
  return seriesList.some((series) => {
    return matchesSeries(series, expected);
  });
};
