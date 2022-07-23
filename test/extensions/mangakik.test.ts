import * as assert from "assert";
import { ExtensionClient } from "../../extensions/mangakik";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";
import { SeriesSourceType } from "houdoku-extension-lib";

describe("mangakik", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Martial Peak", async () => {
    const response = await env.extensionClient.getSearch("martial", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Martial Peak",
    });
    assert.equal(actual, true);
  });

  it("get series Martial Peak", async () => {
    const response = await env.extensionClient.getSeries(
      SeriesSourceType.STANDARD,
      "/manga/martial-peak"
    );
    const actual = matchesSeries(response, {
      title: "Martial Peak",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
