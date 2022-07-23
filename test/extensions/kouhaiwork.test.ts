import * as assert from "assert";
import { ExtensionClient } from "../../extensions/kouhaiwork";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("kouhaiwork", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Youjo Senki", async () => {
    const response = await env.extensionClient.getSearch("youjo", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Youjo Senki",
    });
    assert.equal(actual, true);
  });

  it("get series Youjo Senki", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "42"
    );
    const actual = matchesSeries(response, {
      title: "Youjo Senki",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
