import * as assert from "assert";
import { ExtensionClient, SETTING_NAMES } from "../../extensions/komga";
import { hasSeries, matchesSeries } from "../util/helpers";
import { ExtensionEnv, createExtensionEnv, teardownExtensionEnv } from "../util/base";

describe("komga", () => {
  let env: ExtensionEnv;

  before(() => {
    env = createExtensionEnv(ExtensionClient);
    env.extensionClient.setSettings({
      [SETTING_NAMES.ADDRESS]: "https://demo.komga.org",
      [SETTING_NAMES.USERNAME]: "demo@komga.org",
      [SETTING_NAMES.PASSWORD]: "komga-demo",
    });
  });

  it("directory has space adventures", async () => {
    const response = await env.extensionClient.getDirectory(1);
    const actual = hasSeries(response.seriesList, {
      title: "Space Adventures",
    });
    assert.equal(actual, true);
  });

  it("search has space adventures", async () => {
    const response = await env.extensionClient.getSearch("", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Space Adventures",
    });
    assert.equal(actual, true);
  });

  it("get series space adventures", async () => {
    const response = await env.extensionClient.getSeries("63");
    const actual = matchesSeries(response, {
      title: "Space Adventures",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
