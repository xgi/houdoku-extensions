import * as assert from "assert";
import { ExtensionClient } from "../../extensions/readcomiconline";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("readcomiconline", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has The Boys", async () => {
    const response = await env.extensionClient.getSearch("boys", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "The Boys",
    });
    assert.equal(actual, true);
  });

  it("get series The Boys", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "The-Boys"
    );
    const actual = matchesSeries(response, {
      title: "The Boys",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
