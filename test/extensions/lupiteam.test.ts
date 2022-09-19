import * as assert from "assert";
import { ExtensionClient } from "../../extensions/lupiteam";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("lupiteam", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Berserk", async () => {
    const response = await env.extensionClient.getSearch("berserk", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Berserk",
    });
    assert.equal(actual, true);
  });

  it("get series Berserk", async () => {
    const response = await env.extensionClient.getSeries("berserk");
    const actual = matchesSeries(response, {
      title: "Berserk",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
