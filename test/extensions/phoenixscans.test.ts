import * as assert from "assert";
import { ExtensionClient } from "../../extensions/phoenixscans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("phoenixscans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Addio, Eri", async () => {
    const response = await env.extensionClient.getSearch("addio", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Addio, Eri",
    });
    assert.equal(actual, true);
  });

  it("get series Addio, Eri", async () => {
    const response = await env.extensionClient.getSeries("addio-eri");
    const actual = matchesSeries(response, {
      title: "Addio, Eri",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
