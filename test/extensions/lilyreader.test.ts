import * as assert from "assert";
import { ExtensionClient } from "../../extensions/lilyreader";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("lilyreader", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Sakura Trick", async () => {
    const response = await env.extensionClient.getSearch("sakura", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Sakura Trick",
    });
    assert.equal(actual, true);
  });

  it("get series Sakura Trick", async () => {
    const response = await env.extensionClient.getSeries("sakura-trick");
    const actual = matchesSeries(response, {
      title: "Sakura Trick",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
