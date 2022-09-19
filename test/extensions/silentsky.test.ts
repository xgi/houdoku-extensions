import * as assert from "assert";
import { ExtensionClient } from "../../extensions/silentsky";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("silentsky", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Great Pretender", async () => {
    const response = await env.extensionClient.getSearch("pretender", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Great Pretender",
    });
    assert.equal(actual, true);
  });

  it("get series Great Pretender", async () => {
    const response = await env.extensionClient.getSeries("great_pretender");
    const actual = matchesSeries(response, {
      title: "Great Pretender",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
