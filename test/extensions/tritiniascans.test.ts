import * as assert from "assert";
import { ExtensionClient } from "../../extensions/tritiniascans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("tritiniascans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Live Dungeon!", async () => {
    const response = await env.extensionClient.getSearch("dungeon", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Live Dungeon!",
    });
    assert.equal(actual, true);
  });

  it("get series Live Dungeon!", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/manga/live-dungeon"
    );
    const actual = matchesSeries(response, {
      title: "Live Dungeon!",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
