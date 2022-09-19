import * as assert from "assert";
import { ExtensionClient } from "../../extensions/guya";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("guya", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("directory has kaguya-sama", async () => {
    const response = await env.extensionClient.getDirectory(1);
    const actual = hasSeries(response.seriesList, {
      title: "Kaguya-sama: Love is War",
    });
    assert.equal(actual, true);
  });

  it("search has kaguya-sama", async () => {
    const response = await env.extensionClient.getSearch("", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Kaguya-sama: Love is War",
    });
    assert.equal(actual, true);
  });

  it("get series kaguya-sama", async () => {
    const response = await env.extensionClient.getSeries(
      "Kaguya-Wants-To-Be-Confessed-To"
    );
    const actual = matchesSeries(response, {
      title: "Kaguya-sama: Love is War",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
