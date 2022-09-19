import * as assert from "assert";
import { ExtensionClient } from "../../extensions/deathtollscans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("deathtollscans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("directory has By Myself", async () => {
    const response = await env.extensionClient.getDirectory(1);
    const actual = hasSeries(response.seriesList, {
      title: "By Myself",
    });
    assert.equal(actual, true);
  });

  it("search has By Myself", async () => {
    const response = await env.extensionClient.getSearch("myself", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "By Myself",
    });
    assert.equal(actual, true);
  });

  it("get series By Myself", async () => {
    const response = await env.extensionClient.getSeries("by_myself");
    const actual = matchesSeries(response, {
      title: "By Myself",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
