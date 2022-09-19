import * as assert from "assert";
import { ExtensionClient } from "../../extensions/nhentai";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("nhentai", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has METAMORPHOSIS", async () => {
    const response = await env.extensionClient.getSearch(
      "metamorphosis shindol",
      {},
      1
    );
    const actual = hasSeries(response.seriesList, {
      title: "[ShindoLA] METAMORPHOSIS (Complete) [English]",
    });
    assert.equal(actual, true);
  });

  it("get series METAMORPHOSIS", async () => {
    const response = await env.extensionClient.getSeries("177013");
    const actual = matchesSeries(response, {
      title: "METAMORPHOSIS",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
