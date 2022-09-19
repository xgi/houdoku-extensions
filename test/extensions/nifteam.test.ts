import * as assert from "assert";
import { ExtensionClient } from "../../extensions/nifteam";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv,
} from "../util/base";

describe("nifteam", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has One Piece", async () => {
    const response = await env.extensionClient.getSearch("piece", {}, 1);
    const actual = hasSeries(response.seriesList, {
      title: "One Piece",
    });
    assert.equal(actual, true);
  });

  it("get series One Piece", async () => {
    const response = await env.extensionClient.getSeries("one-piece");
    const actual = matchesSeries(response, {
      title: "One Piece di Eichiro Oda",
    });
    assert.equal(actual, true);
  });

  after(() => teardownExtensionEnv(env));
});
