import * as assert from "assert";
import { ExtensionClient } from "../../extensions/mangatellers";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("mangatellers", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Mythos", async () => {
    const response = await env.extensionClient.getSearch("mythos", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Mythos",
    });
    assert.equal(actual, true);
  });

  it("get series Mythos", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "mythos"
    );
    const actual = matchesSeries(response, {
      title: "Mythos",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
