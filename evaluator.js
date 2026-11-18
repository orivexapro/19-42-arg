const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9:]+/g, " ");
const containsAny = (text, terms) => terms.some((term) => text.includes(term));
const negated = (text, term) => {
  const index = text.indexOf(term);
  if (index < 0) return false;
  const before = text.slice(Math.max(0, index - 36), index);
  return /\b(ne|n|pas|jamais|aucun|ni)\b/.test(before);
};
const positiveAny = (text, terms) => terms.some((term) => text.includes(term) && !negated(text, term));

export const conclusions = [
  { id: "marianne-ai", label: "La nature de Marianne", weight: 12, test: t => positiveAny(t, ["marianne est une ia", "marianne est un robot", "marianne est une intelligence artificielle", "marianne est un androide", "marianne est artificielle", "marianne n est pas humaine"]), hint: "Les examens médicaux de Marianne concordent-ils avec son identité administrative ?" },
  { id: "awareness", label: "La découverte de Marianne", weight: 11, test: t => containsAny(t, ["marianne a decouvert sa nature", "marianne a compris qu elle etait", "marianne a pris conscience", "elle a compris qu elle etait", "elle sait qu elle est une ia", "decouvert qu elle etait une ia"]), hint: "Que cherchait Marianne dans les diagnostics interdits avant sa dernière visite ?" },
  { id: "andre-ai", label: "La nature d’André", weight: 10, test: t => positiveAny(t, ["andre est une ia", "andre est un robot", "andre est un androide", "andre n est pas humain", "andre aussi est une ia"]), hint: "L’âge apparent d’André explique-t-il vraiment ses relevés biologiques ?" },
  { id: "murder", label: "La mort de Marianne", weight: 15, test: t => positiveAny(t, ["andre a tue marianne", "andre tue marianne", "tuee par andre", "andre est le meurtrier", "andre l a tuee"]), hint: "Qui était présent au 18 rue des Saules lorsque le bracelet de Marianne s’est arrêté ?" },
  { id: "time", label: "L’heure exacte", weight: 8, test: t => containsAny(t, ["19:42", "19h42", "19 h 42"]) && containsAny(t, ["mort", "tue", "deces", "incident", "arrete"]), hint: "Trois appareils se figent à la même minute. Laquelle ?" },
  { id: "motive", label: "Le mobile", weight: 12, test: t => containsAny(t, ["pour l empecher de reveler", "parce qu elle lui a revele", "apres qu elle lui a dit", "andre refuse la verite", "andre ne supporte pas", "peur de la verite", "revelation de marianne"]) && containsAny(t, ["ia", "robot", "artificiel", "nature", "verite"]), hint: "Quel aveu de Marianne transforme sa visite ordinaire en confrontation ?" },
  { id: "district", label: "Le quartier expérimental", weight: 13, test: t => containsAny(t, ["quartier experimental", "quartier est experimental", "ville experimentale", "ville est experimentale", "zone experimentale", "secteur pilote", "experience grandeur nature"]), hint: "Pourquoi le secteur A-17 possède-t-il sa propre infrastructure, absente des plans publics ?" },
  { id: "residents", label: "La nature des habitants", weight: 12, test: t => containsAny(t, ["tous les habitants sont des ia", "quartier entier est peuple d ia", "ville entiere est peuplee d ia", "habitants sont des robots", "population artificielle", "tout le monde est une ia"]), hint: "Les anomalies relevées chez Marianne et André sont-elles réellement des cas isolés ?" },
  { id: "ignorance", label: "L’ignorance collective", weight: 4, test: t => containsAny(t, ["ils ignorent qu ils sont", "sans savoir qu ils sont", "sans le savoir", "ne savent pas qu ils sont", "ignorent leur nature", "aucun habitant ne sait"]), hint: "Les habitants connaissent-ils la véritable fonction du quartier ?" },
  { id: "no-police", label: "L’absence de signalement", weight: 3, test: t => containsAny(t, ["andre n a pas appele la police", "andre ne previent pas la police", "aucun appel a la police", "pas contacte les autorites", "aucun signalement", "deces non signale"]), hint: "Aucun signalement officiel ne correspond aux événements de 19:42. Comment expliquer cette absence ?" }
];

export function evaluateReport(report) {
  const text = normalize(report);
  const matched = conclusions.filter(item => item.test(text));
  const score = matched.reduce((sum, item) => sum + item.weight, 0);
  const missing = conclusions.filter(item => !matched.includes(item));
  const themes = missing.slice().sort((a, b) => b.weight - a.weight).slice(0, 4).map(item => ({ label: item.label, question: item.hint }));
  return { score, matched: matched.map(i => i.id), missingCount: missing.length, total: conclusions.length, themes };
}

