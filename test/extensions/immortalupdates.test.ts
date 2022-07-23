import * as assert from "assert";
import { ExtensionClient } from "../../extensions/immortalupdates";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("immortalupdates", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Player", async () => {
    const response = await env.extensionClient.getSearch("player", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Player",
    });
    assert.equal(actual, true);
  });

  it("get series Player", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/manga/player-five"
    );
    const actual = matchesSeries(response, {
      title: "Player",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
