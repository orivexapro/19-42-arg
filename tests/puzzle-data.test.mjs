import test from "node:test";
import assert from "node:assert/strict";
import { fragmentDefinitions } from "../puzzles.js";
import { readFileSync } from "node:fs";

test("les quatre fragments forment un document lisible", () => {
  assert.equal(Object.keys(fragmentDefinitions).length, 4);
  const restored = ["f1", "f2", "f3", "f4"].map(id => fragmentDefinitions[id].text).join(" ");
  assert.match(restored, /résidents du secteur.*architecture.*maintenance synchronisée/i);
});

test("la photographie utilise douze fragments orientables et une source anonymisée", () => {
  const source = readFileSync(new URL("../puzzles.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../enhancements.css", import.meta.url), "utf8");
  const values = source.match(/PHOTO_ORDER = \[([^\]]+)\]/)?.[1].split(",");
  assert.equal(values?.length, 12);
  assert.match(source, /PHOTO_ROTATIONS/);
  assert.match(css, /archive-photo-anonymized\.png/);
});

