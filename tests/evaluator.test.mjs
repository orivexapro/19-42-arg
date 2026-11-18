import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReport } from "../evaluator.js";

test("reconnaît des formulations naturelles", () => {
  const r = evaluateReport("Marianne est un androïde. Elle a été tuée par André à 19h42. André n'a pas appelé la police.");
  assert.equal(r.matched.includes("marianne-ai"), true);
  assert.equal(r.matched.includes("murder"), true);
  assert.equal(r.matched.includes("time"), true);
  assert.equal(r.matched.includes("no-police"), true);
});

test("refuse une affirmation niée", () => {
  const r = evaluateReport("André n'a pas tué Marianne. Marianne n'est pas une IA.");
  assert.equal(r.matched.includes("murder"), false);
  assert.equal(r.matched.includes("marianne-ai"), false);
});

test("ne contient aucune conclusion secrète de saison 2", () => {
  const r = evaluateReport("André a conservé le corps de Marianne.");
  assert.equal(r.matched.length, 0);
});

