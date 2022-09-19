import * as assert from "assert";
import { ExtensionClient } from "../../extensions/mangalife";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("mangalife", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has Kaguya-sama - Love Is War", async () => {
    const response = await env.extensionClient.getSearch("kaguya", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "Kaguya-sama - Love Is War",
    });
    assert.equal(actual, true);
  });

  it("get series Kaguya-sama - Love Is War", async () => {
    const response = await env.extensionClient.getSeries(
      "Kaguya-Wants-To-Be-Confessed-To"
    );
    const actual = matchesSeries(response, {
      title: "Kaguya-sama - Love Is War",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
