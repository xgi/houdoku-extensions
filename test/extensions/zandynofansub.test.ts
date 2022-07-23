import * as assert from "assert";
import { ExtensionClient } from "../../extensions/zandynofansub";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("zandynofansub", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Otogi", async () => {
    const response = await env.extensionClient.getSearch("otogi", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Otogi",
    });
    assert.equal(actual, true);
  });

  it("get series Otogi", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/series/otogi"
    );
    const actual = matchesSeries(response, {
      title: "Otogi",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
