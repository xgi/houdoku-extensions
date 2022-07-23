import * as assert from "assert";
import { ExtensionClient } from "../../extensions/tuttoanimemanga";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("tuttoanimemanga", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Bleach", async () => {
    const response = await env.extensionClient.getSearch("bleach", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Bleach",
    });
    assert.equal(actual, true);
  });

  it("get series Bleach", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "bleach"
    );
    const actual = matchesSeries(response, {
      title: "Bleach",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
