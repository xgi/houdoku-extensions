import * as assert from "assert";
import { ExtensionClient } from "../../extensions/manga347";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("manga347", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("get series Rise of The Demon King", async () => {
    const response = await env.extensionClient.getSeries(
      "/manga/rise-of-the-demon-king/630"
    );
    const actual = matchesSeries(response, {
      title: "Rise of The Demon King",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
