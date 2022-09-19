import * as assert from "assert";
import { ExtensionClient } from "../../extensions/disasterscans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("disasterscans", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Rich Player", async () => {
    const response = await env.extensionClient.getSearch("rich", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Rich Player",
    });
    assert.equal(actual, true);
  });

  it("get series Rich Player", async () => {
    const response = await env.extensionClient.getSeries("/manga/rich-player");
    const actual = matchesSeries(response, {
      title: "Rich Player",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
