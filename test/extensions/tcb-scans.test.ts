import * as assert from "assert";
import { ExtensionClient } from "../../extensions/tcb-scans";
import { hasSeries, matchesSeries } from "../util/helpers";
import {
  ExtensionEnv,
  createExtensionEnv,
  teardownExtensionEnv
} from "../util/base";

describe("tcb", () => {
  let env: ExtensionEnv;

  before(() => (env = createExtensionEnv(ExtensionClient)));

  it("search has One Piece", async () => {
    const response = await env.extensionClient.getSearch("one piece", 1, {});
    console.log(response.seriesList[0].sourceId)
    const actual = hasSeries(response.seriesList, {
      title: "One Piece"
    });
    assert.equal(actual, true);
  });

  it("get series One Piece", async () => {
    const response = await env.extensionClient.getSeries(
      "5/one-piece"
    );
    const actual = matchesSeries(response, {
      title: "One Piece"
    });
    assert.equal(actual, true);
  });




  after(() => teardownExtensionEnv(env));
});
