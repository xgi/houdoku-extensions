import * as assert from "assert";
import { ExtensionClient } from "../../extensions/isekaiscan";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("isekaiscan", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Divine Perspective", async () => {
    const response = await env.extensionClient.getSearch("divine", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Divine Perspective",
    });
    assert.equal(actual, true);
  });

  it("get series Divine Perspective", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/manga/divine-perspective"
    );
    const actual = matchesSeries(response, {
      title: "Divine Perspective",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
