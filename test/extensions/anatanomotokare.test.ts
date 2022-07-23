import * as assert from "assert";
import { ExtensionClient } from "../../extensions/anatanomotokare";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("anatanomotokare", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("directory has Black Terror", async () => {
    const response = await env.extensionClient.getDirectory(1);
    const actual = hasSeries(response.seriesList, {
      title: "Black Terror",
    });
    assert.equal(actual, true);
  });

  it("search has Black Terror", async () => {
    const response = await env.extensionClient.getSearch("terror", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Black Terror",
    });
    assert.equal(actual, true);
  });

  it("get series Black Terror", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "black-terror"
    );
    const actual = matchesSeries(response, {
      title: "Black Terror",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
