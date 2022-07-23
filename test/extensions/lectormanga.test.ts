import * as assert from "assert";
import { ExtensionClient } from "../../extensions/lectormanga";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("lectormanga", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has No color", async () => {
    const response = await env.extensionClient.getSearch("no color", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "No color",
    });
    assert.equal(actual, true);
  });

  it("get series No color", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "manga/43037/no-color"
    );
    const actual = matchesSeries(response, {
      title: "No color",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
