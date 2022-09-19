import * as assert from "assert";
import { ExtensionClient } from "../../extensions/kireicake";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("kireicake", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Frieren at the Funeral", async () => {
    const response = await env.extensionClient.getSearch("frieren", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Frieren at the Funeral",
    });
    assert.equal(actual, true);
  });

  it("get series Frieren at the Funeral", async () => {
    const response = await env.extensionClient.getSeries(
      "frieren_at_the_funeral"
    );
    const actual = matchesSeries(response, {
      title: "Frieren at the Funeral",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
