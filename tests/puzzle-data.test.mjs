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

test("toutes les fenêtres partagent agrandissement, restauration et sauvegarde de taille", () => {
  const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(source, /function toggleMaximize/);
  assert.match(source, /Rétablir la taille précédente/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /arg-19-41-state-v3/);
  assert.match(source, /reset-session/);
});

test("le didacticiel explique le rôle, le premier objectif et le Pense-bête avec un audio dédié", () => {
  const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(source, /assets\/tutorial-intro\.mp3/);
  assert.match(source, /Votre rôle/);
  assert.match(source, /Premier objectif/);
  assert.match(source, /Où noter vos découvertes/);
  assert.match(source, /Pense-bête/);
  assert.doesNotMatch(source, /speechSynthesis|SpeechSynthesisUtterance/);
  const audio = readFileSync(new URL("../assets/tutorial-intro.mp3", import.meta.url));
  assert.ok(audio.length > 10_000);
});

