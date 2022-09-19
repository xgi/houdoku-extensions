import * as assert from "assert";
import { ExtensionClient } from "../../extensions/menudofansub";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("menudofansub", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Lucky Star", async () => {
    const response = await env.extensionClient.getSearch("lucky", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Lucky Star",
    });
    assert.equal(actual, true);
  });

  it("get series Lucky Star", async () => {
    const response = await env.extensionClient.getSeries("lucky_star");
    const actual = matchesSeries(response, {
      title: "Lucky Star",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
