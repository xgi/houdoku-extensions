import * as assert from "assert";
import { ExtensionClient } from "../../extensions/lecercleduscan";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("lecercleduscan", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Terror Man", async () => {
    const response = await env.extensionClient.getSearch("terror", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Terror Man",
    });
    assert.equal(actual, true);
  });

  it("get series Terror Man", async () => {
    const response = await env.extensionClient.getSeries("terror-man");
    const actual = matchesSeries(response, {
      title: "Terror Man",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
