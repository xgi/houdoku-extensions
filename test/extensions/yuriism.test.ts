import * as assert from "assert";
import { ExtensionClient } from "../../extensions/yuriism";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("yuriism", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Bakemonogatari", async () => {
    const response = await env.extensionClient.getSearch("bakemonogatari", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Bakemonogatari",
    });
    assert.equal(actual, true);
  });

  it("get series Bakemonogatari", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "bakemonogatari"
    );
    const actual = matchesSeries(response, {
      title: "Bakemonogatari",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
