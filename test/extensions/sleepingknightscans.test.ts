import * as assert from "assert";
import { ExtensionClient } from "../../extensions/sleepingknightscans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("sleepingknightscans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Chronicles of the Martial God’s Return", async () => {
    const response = await env.extensionClient.getSearch("chronicles", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Chronicles of the Martial God’s Return",
    });
    assert.equal(actual, true);
  });

  it("get series Chronicles of the Martial God’s Return", async () => {
    const response = await env.extensionClient.getSeries(
      "/manga/chronicles-of-the-martial-gods-return"
    );
    const actual = matchesSeries(response, {
      title: "Chronicles of the Martial God’s Return",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
