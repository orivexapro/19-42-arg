import { reportFacts } from "./puzzles.js";

export const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9:]+/g, " ").trim();
const negated = (text, term) => { const i=text.indexOf(term); if(i<0)return false; const start=Math.max(0,i-12); let before=text.slice(start,i); if(start>0&&/[a-z0-9]/.test(text[start-1]))before=before.replace(/^[a-z0-9]+\s*/,""); return /\b(ne|n|pas|jamais|aucun|ni|not|never|no)\b/.test(before); };

export function evaluateReport(report) {
  const text=normalize(report);
  const matched=reportFacts.filter((fact)=>fact.terms.some((raw)=>{const term=normalize(raw);return text.includes(term)&&(fact.id==="no-report"||!negated(text,term));}));
  const ids=matched.map((fact)=>fact.id);
  const score=matched.reduce((sum,fact)=>sum+fact.weight,0);
  const missing=reportFacts.filter((fact)=>!ids.includes(fact.id));
  const spoiler=/\b(corps (est|se trouve) (dans|sous|chez)|andre (a fui|est parti) (a|au|aux|en)|objectif final (est|du)|raison precise.*camera|19:42 revele)\b/i.test(normalize(report));
  return { score:Math.max(0,score-(spoiler?15:0)), matched:ids, missing:missing.map((fact)=>fact.id), missingCount:missing.length, total:reportFacts.length, coherent:score>=85&&!spoiler, overreach:spoiler };
}
