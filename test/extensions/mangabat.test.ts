import * as assert from "assert";
import { ExtensionClient } from "../../extensions/mangabat";
import { hasSeries, matchesSeries } from "../util/helpers";
import { ExtensionEnv, createExtensionEnv, teardownExtensionEnv } from "../util/base";

describe("mangabat", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has kaguya-sama", async () => {
    const response = await env.extensionClient.getSearch("kaguya", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Kaguya-sama wa Kokurasetai - Tensai-tachi no Renai Zunousen",
    });
    assert.equal(actual, true);
  });

  it("get series kaguya-sama", async () => {
    const response = await env.extensionClient.getSeries(
      "https://readmangabat.com/read-sh357900"
    );
    const actual = matchesSeries(response, {
      title: "Kaguya-Sama Wa Kokurasetai - Tensai-Tachi No Renai Zunousen",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
