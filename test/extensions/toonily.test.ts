import * as assert from "assert";
import { ExtensionClient } from "../../extensions/toonily";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("toonily", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Tomb Raider King", async () => {
    const response = await env.extensionClient.getSearch("tomb", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Tomb Raider King",
    });
    assert.equal(actual, true);
  });

  it("get series Tomb Raider King", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/webtoon/tomb-raider-king/"
    );
    const actual = matchesSeries(response, {
      title: "Tomb Raider King",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
