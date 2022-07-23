import * as assert from "assert";
import { ExtensionClient } from "../../extensions/hniscantrad";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("hniscantrad", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Black-Box", async () => {
    const response = await env.extensionClient.getSearch("box", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Black-Box",
    });
    assert.equal(actual, true);
  });

  it("get series Black-Box", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "black-box"
    );
    const actual = matchesSeries(response, {
      title: "Black-Box",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
