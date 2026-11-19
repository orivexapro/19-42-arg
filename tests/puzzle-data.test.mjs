import test from "node:test";
import assert from "node:assert/strict";
import { fragmentDefinitions } from "../puzzles.js";

test("les quatre fragments forment un document lisible", () => {
  assert.equal(Object.keys(fragmentDefinitions).length, 4);
  const restored = ["f1", "f2", "f3", "f4"].map(id => fragmentDefinitions[id].text).join(" ");
  assert.match(restored, /résidents du secteur.*architecture.*maintenance synchronisée/i);
});

