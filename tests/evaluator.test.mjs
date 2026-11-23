import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReport } from "../evaluator.js";

const full="Marianne est une IA et André est un robot. André a tué Marianne à 19:41 après la révélation de leur nature, car il refuse la vérité. Les habitants sont des IA dans un quartier expérimental, une expérimentation gouvernementale maintenue en quarantaine avec des communications contrôlées. Le gouvernement a coupé les caméras volontairement. André n’a pas appelé les autorités : aucun signalement. Il a caché le corps, qui n’a pas été retrouvé, puis André a fui. Le lieu est inconnu et la raison exacte de la coupure reste non révélée.";
test("un rapport complet peut obtenir 100 %",()=>{const r=evaluateReport(full);assert.equal(r.score,100);assert.equal(r.matched.length,13);assert.equal(r.coherent,true)});
test("les formulations anglaises sont acceptées",()=>{const r=evaluateReport("Marianne is an AI. Andre is a robot and Andre killed Marianne at 19:41 in a government experiment. The residents are AI. The district was in quarantine, the government cut the cameras, the death was unreported, he hid the body and Andre fled. The reason is unknown.");assert.ok(r.score>=75)});
test("une négation contradictoire ne valide pas un fait",()=>{const r=evaluateReport("André n’a pas tué Marianne. Marianne n’est pas une IA.");assert.equal(r.matched.includes("andre-killed"),false);assert.equal(r.matched.includes("marianne-ai"),false)});
test("un spoiler inventé de saison 2 est pénalisé",()=>{const r=evaluateReport(full+" Le corps est dans une cave.");assert.equal(r.overreach,true);assert.ok(r.score<100);assert.equal(r.coherent,false)});
test("le bilan expose les thèmes manquants",()=>{const r=evaluateReport("Marianne est une IA à 19:41.");assert.ok(r.missingCount>0);assert.equal(r.total,13);assert.ok(r.missing.includes("andre-killed"))});
