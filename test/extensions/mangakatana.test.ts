import * as assert from "assert";
import { ExtensionClient } from "../../extensions/mangakatana";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("mangakatana", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search for Meshinuma redirects to series page", async () => {
    const response = await env.extensionClient.getSearch("meshinuma", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Meshinuma",
    });
    assert.equal(actual, true);
  });

  it("search for Please Save My Earth", async () => {
    const response = await env.extensionClient.getSearch("please", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Please Save My Earth",
    });
    assert.equal(actual, true);
  });

  it("get series Meshinuma", async () => {
    const response = await env.extensionClient.getSeries("meshinuma.26073");
    const actual = matchesSeries(response, {
      title: "Meshinuma",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
