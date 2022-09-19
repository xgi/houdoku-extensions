import * as assert from "assert";
import { ExtensionClient } from "../../extensions/sensescans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("sensescans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Kingdom", async () => {
    const response = await env.extensionClient.getSearch("kingdom", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Kingdom",
    });
    assert.equal(actual, true);
  });

  it("get series Kingdom", async () => {
    const response = await env.extensionClient.getSeries("kingdom");
    const actual = matchesSeries(response, {
      title: "Kingdom",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
