import { evaluateReport } from "./evaluator.js";
import { createPuzzleSuite, fragmentDefinitions } from "./puzzles.js";

const STORAGE_KEY = "arg-19-41-state-v2";
const legacyState = JSON.parse(localStorage.getItem("arg-19-42-state-v1") || "{}");
const defaultState = { notes: "DOSSIER MARIANNE — NOTES D’ENQUÊTE\n\n• ", attempts: [], opened: [], puzzles: {}, fragments: [], usbUnlocked: false, protectedUnlocked: false, narratorEnabled: true, windowLayouts: {}, startedAt: Date.now(), shutdown: false };
const state = Object.assign({}, defaultState, legacyState, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const layer = $("#window-layer");
let topZ = 20;
let windowCount = 0;
let puzzles;
const narratedThisSession = new Set();
let narratorTimer;

const fileSystem = {
  pc: { title: "Ce PC", type: "drives" },
  documents: { title: "Documents", type: "files", items: [
    { name: "POINT_DE_DEPART.docx", icon: "W", kind: "doc", doc: "briefing-file" },
    { name: "journal_reconstruction.txt", icon: "▤", kind: "doc", doc: "reconstruction" },
    { name: "photo_etiquette_USB.txt", icon: "▧", kind: "doc", doc: "usb-label" }
  ]},
  usb: { title: "ARCHIVE_M (E:)", type: "files", items: [
    { name: "00_LISEZ_MOI.txt", icon: "▤", kind: "doc", doc: "readme" },
    { name: "photo_recuperee.jpg", icon: "▧", kind: "puzzle", puzzle: "photo" },
    { name: "message_intercepte.enc", icon: "⌁", kind: "puzzle", puzzle: "cipher" },
    { name: "rapport_population.corrupt", icon: "⚠", kind: "puzzle", puzzle: "corrupt" },
    { name: "IDENTITES", icon: "◆", folder: "identities" },
    { name: "CHRONOLOGIE", icon: "◆", folder: "timeline" },
    { name: "SECTEUR_A17", icon: "◆", folder: "sector" },
    { name: "correspondance.eml", icon: "✉", kind: "doc", doc: "email" },
    { name: "ARCHIVE_CONTROLE", icon: "▣", folder: "protected", protected: true }
  ]},
  identities: { title: "IDENTITES", type: "files", items: [
    { name: "MARIANNE_DUMAS.pdf", icon: "W", kind: "doc", doc: "marianne" },
    { name: "ANDRE_VASSEUR.pdf", icon: "W", kind: "doc", doc: "andre" },
    { name: "rapport_medical_114.txt", icon: "▤", kind: "doc", doc: "medical" },
    { name: "fragment_01.tmp", icon: "◫", kind: "fragment", fragment: "f1" }
  ]},
  timeline: { title: "CHRONOLOGIE", type: "files", items: [
    { name: "domotique_18-10.log", icon: "▤", kind: "doc", doc: "home-log" },
    { name: "bracelet_M-56.csv", icon: "▦", kind: "doc", doc: "bracelet" },
    { name: "reconstitution.chr", icon: "◷", kind: "puzzle", puzzle: "timeline" },
    { name: "salon_canal_B.wav", icon: "♪", kind: "puzzle", puzzle: "audio" },
    { name: "cache_7A.bin", icon: "◫", kind: "fragment", fragment: "f2" },
    { name: "ligne_184.rec", icon: "◫", kind: "fragment", fragment: "f3" }
  ]},
  sector: { title: "SECTEUR_A17", type: "files", items: [
    { name: "plan_reseau_A17.pdf", icon: "W", kind: "doc", doc: "network" },
    { name: "comparateur_A17.exe", icon: "◫", kind: "puzzle", puzzle: "differences" },
    { name: "ROTATION.txt", icon: "▤", kind: "doc", doc: "rotation" },
    { name: "table_morse.txt", icon: "▤", kind: "doc", doc: "morse" },
    { name: "note_interne_caviardee.pdf", icon: "W", kind: "doc", doc: "redacted" },
    { name: "fin_document.dat", icon: "◫", kind: "fragment", fragment: "f4" }
  ]},
  protected: { title: "ARCHIVE_CONTROLE", type: "files", items: [
    { name: "absence_signalement.txt", icon: "▤", kind: "doc", doc: "police" },
    { name: "diagnostic_interdit.bin.txt", icon: "▤", kind: "doc", doc: "diagnostic" },
    { name: "maintenance_population.csv", icon: "▦", kind: "doc", doc: "population" }
  ]}
};

const docs = {
  "briefing-file": { title: "POINT_DE_DEPART.docx", kicker: "Journal d’A. Morel · 17 octobre 2049", body: `<h1>Pourquoi ce vieux PC ?</h1><p>J’ai mis onze mois à reconstruire cette configuration du début du siècle pour lire une clé USB retrouvée dans le lot Paris Nord-Est.</p><p>Le support est verrouillé. Son étiquette est presque effacée, mais mes notes de reconstruction et sa photographie doivent suffire à retrouver les quatre chiffres.</p><p>Je noterai mes conclusions dans le Pense-bête avant de les transmettre à la rédaction.</p>` },
  reconstruction: { title: "journal_reconstruction.txt", kicker: "Carnet technique du journaliste", body: `<h1>Reconstruction du lecteur</h1><div class="metadata">PORT USB : compatible<br>ALIMENTATION : 5 V<br>MACHINE HÔTE : ArchiveOS 11<br>BÂTIMENT D’ORIGINE DU LOT : 11</div><p>Le verrou combine le numéro du bâtiment et la minute encore lisible sur l’étiquette du support.</p>` },
  "usb-label": { title: "photo_etiquette_USB.txt", kicker: "Transcription d’une photographie", body: `<h1>Étiquette du support</h1><div class="metadata">M / 19 : 4_\nPAR-NE / lot 7\nlecture seule</div><p>Le dernier chiffre ressemble nettement à un <strong>1</strong>. Le reste de l’heure n’entre pas dans le code du verrou.</p>` },
  readme: { title: "00_LISEZ_MOI.txt", kicker: "Archive récupérée · support amovible E:", body: `<h1>Dossier M / lot 7</h1><p>Copie partielle de documents administratifs retrouvés dans un entrepôt de données parisien. L’intégrité du support est estimée à 71 %.</p><p>Les fichiers concernent la disparition non résolue de <strong>Marianne Dumas</strong>, aide à domicile, née en 1969.</p><div class="metadata">DERNIÈRE SYNCHRONISATION : 18/10/2025 22:16<br>SECTEUR : PAR-NE-17 / désignation locale « A-17 »<br>STATUT : décès absent du registre central</div><h2>Note du récupérateur</h2><p>Les fichiers endommagés ont été laissés dans leurs dossiers d’origine. Les outils nécessaires à leur analyse sont présents sur la clé.</p>` },
  rotation: { title: "ROTATION.txt", kicker: "Aide-mémoire de chiffrement", body: `<h1>Rotation alphabétique</h1><p>Chaque lettre est remplacée par celle située trois positions plus loin dans l’alphabet.</p><div class="metadata">CLAIR : A B C D E F …\nCHIFFRÉ : D E F G H I …</div><p>Pour lire un message reçu, il faut donc effectuer le mouvement inverse.</p>` },
  morse: { title: "table_morse.txt", kicker: "Extrait de manuel radio", body: `<h1>Table Morse — extrait utile</h1><div class="metadata">A  · —\n1  · — — — —\n7  — — · · ·</div><p>Un signal court vaut un point. Un signal long vaut un trait. Une pause longue sépare les caractères.</p>` },
  email: { title: "correspondance.eml", kicker: "Message sortant non transmis", body: `<h1>Objet : Je crois avoir compris</h1><div class="metadata">DE : marianne.dumas@a17.local<br>À : cellule-controle@mairie.example<br>BROUILLON — jamais envoyé<br>17/10/2025 · 23:08</div><p>Je travaille chez eux depuis douze ans. J’entre dans leurs maisons, je vérifie leurs traitements, je les aide à se souvenir. Mais certains souvenirs ne tiennent pas.</p><p>Mon examen n’est pas un examen. Ce sont des diagnostics. Je les ai vus avant que l’écran se referme : <strong>MD-56, série H, enveloppe sociale active.</strong></p><p>Demain, j’en parlerai à André. Il mérite de savoir. Ensuite je trouverai comment sortir d’ici.</p><p>— Marianne</p>` },
  marianne: { title: "MARIANNE_DUMAS.pdf", kicker: "Fiche municipale · copie 2025", body: `<h1>Marianne Dumas</h1><p>56 ans · aide à domicile · Secteur A-17</p><table><tr><th>Identifiant</th><td>MD-56-H</td></tr><tr><th>Résidence</th><td>7 rue des Saules</td></tr><tr><th>Employeur</th><td>Service autonomie A-17</td></tr><tr><th>Dernière visite</th><td>André Vasseur · 18/10 · 18:57</td></tr></table><h2>Anomalies du dossier</h2><p>Aucune naissance numérisée. Première trace administrative créée en bloc le 04/04/2013 avec 2 184 autres résidents.</p>` },
  andre: { title: "ANDRE_VASSEUR.pdf", kicker: "Fiche bénéficiaire · confidentiel", body: `<h1>André Vasseur</h1><p>78 ans · retraité · 18 rue des Saules</p><table><tr><th>Identifiant médical</th><td>AV-78-H</td></tr><tr><th>Autonomie déclarée</th><td>GIR 4</td></tr><tr><th>Fréquence cardiaque</th><td>60,000 bpm constants</td></tr><tr><th>Visites</th><td>Marianne Dumas · 3 fois/semaine</td></tr></table><p class="warning">Le dossier ne contient aucune photographie antérieure à 2013.</p>` },
  medical: { title: "rapport_medical_114.txt", kicker: "Centre de santé A-17", body: `<h1>Incident d’imagerie n°114</h1><p>Patiente : DUMAS, Marianne.</p><p>L’opérateur signale l’apparition de structures radio-opaques régulières au niveau cervical. La séquence a été interrompue à distance après 4,2 secondes.</p><div class="metadata">OS : densité homogène — impossible<br>SANG : marqueur ferrique synthétique<br>STRUCTURE : connecteur C-7 / alliage non biomédical<br>ERREUR : « enveloppe sociale active — diagnostic interdit »</div><p>Le médecin a reçu l’ordre de classer le résultat comme artefact.</p>` },
  "home-log": { title: "domotique_18-10.log", kicker: "18 rue des Saules · journal local", body: `<h1>Journal domotique</h1><div class="metadata">18:57:03  PORTE_ENTREE       OUVERTURE / MD-56-H<br>19:08:14  VOIX                niveau élevé, 2 locuteurs<br>19:31:08  RESEAU              requête externe bloquée<br>19:39:44  VOIX                niveau élevé, 2 locuteurs<br>19:40:52  SALON               choc / 84 dB<br>19:41:06  UNITE_MD-56-H        liaison perdue<br>19:41:11  CAPTEUR_SOL          masse immobile détectée<br>19:46:33  TELEPHONE_FIXE       combiné décroché<br>19:46:41  TELEPHONE_FIXE       combiné raccroché<br>22:16:02  PORTE_ENTREE         aucune sortie enregistrée</div><p>Le système ne relève aucun appel sortant entre 19:41 et minuit.</p>` },
  bracelet: { title: "bracelet_M-56.csv", kicker: "Données physiologiques récupérées", body: `<h1>Bracelet M-56</h1><table><tr><th>Heure</th><th>Rythme</th><th>Temp.</th><th>Signal</th></tr><tr><td>19:39</td><td>60.000</td><td>36.80</td><td>stable</td></tr><tr><td>19:40</td><td>60.000</td><td>36.80</td><td>stable</td></tr><tr><td><strong>19:41</strong></td><td>0.000</td><td>36.80</td><td>arrêt net</td></tr></table><p>Commentaire technique : aucune phase d’arythmie. Interruption simultanée de l’alimentation principale et du signal radio.</p>` },
  transcript: { title: "transcription_visite.txt", kicker: "Reconstruction audio · 63 %", body: `<h1>Dernière visite</h1><div class="metadata">19:28 — M : « Ce ne sont pas des dossiers médicaux, André. Ce sont des fiches de maintenance. »<br><br>19:30 — A : « Tu es fatiguée. Tu confonds les mots. »<br><br>19:34 — M : « Regarde ton numéro. AV-78-H. Le mien est MD-56-H. On est faits pareil. »<br><br>19:38 — A : « Arrête. »<br><br>19:39 — M : « Le quartier entier… personne ne sait. Je vais le dire. »<br><br>19:40 — [bruit de déplacement]<br><br>19:41 — [choc] [fin du flux]</div><p>La voix masculine est compatible à 96,2 % avec les messages d’André Vasseur.</p>` },
  network: { title: "plan_reseau_A17.pdf", kicker: "Infrastructure urbaine", body: `<h1>Nœud autonome A-17</h1><p>Le secteur est séparé des réseaux municipaux par une passerelle de simulation administrative. Les identités, paiements, communications et services d’urgence sont répliqués localement.</p><div class="metadata">POPULATION ACTIVE : 2 184 unités<br>ENVELOPPES SOCIALES : 2 184<br>SYNCHRONISATION MÉMOIRE : nocturne<br>ACCÈS EXTÉRIEUR : filtré</div><p class="stamp">PROGRAMME QUARTIER PILOTE</p><p>Objectif : mesurer la stabilité d’une communauté synthétique lorsque l’origine de ses membres n’est pas divulguée.</p>` },
  population: { title: "maintenance_population.csv", kicker: "Export incomplet", body: `<h1>Registre de maintenance</h1><table><tr><th>ID</th><th>Nom social</th><th>Apparence</th><th>Dernier cycle</th></tr><tr><td>MD-56-H</td><td>Marianne Dumas</td><td>56</td><td>17/10 03:00</td></tr><tr><td>AV-78-H</td><td>André Vasseur</td><td>78</td><td>17/10 03:00</td></tr><tr><td>CL-34-H</td><td>Camille Leroy</td><td>34</td><td>17/10 03:00</td></tr><tr><td>…</td><td>2 181 entrées</td><td>…</td><td>même fenêtre</td></tr></table><p>Le champ « apparence » remplace l’âge dans le schéma source. Aucun résident du secteur n’est associé à un dossier biologique externe.</p>` },
  redacted: { title: "note_interne_caviardee.pdf", kicker: "Direction du programme", body: `<h1>Protocole de non-divulgation</h1><p>Les unités du secteur A-17 doivent maintenir une autobiographie cohérente. Toute découverte spontanée de leur nature <span class="redacted">déclenche la procédure de récupération</span>.</p><p>Il est interdit au personnel de confirmer l’existence du programme. Les unités ne doivent pas comprendre que leurs voisins partagent la même architecture.</p><p>Le libre arbitre apparent dépend du maintien de cette ignorance collective.</p>` },
  police: { title: "absence_signalement.txt", kicker: "Croisement des registres", body: `<h1>Aucun appel, aucun décès</h1><p>Recherche effectuée sur les registres de police, SAMU, pompiers et état civil entre le 18 et le 31 octobre 2025.</p><div class="metadata">18 rue des Saules : AUCUN APPEL<br>Marianne Dumas : AUCUN DÉCÈS<br>André Vasseur : AUCUNE AUDITION<br>Caméras de sortie : AUCUNE SORTIE MD-56-H</div><p>Le téléphone d’André a été décroché cinq minutes après l’incident, mais aucun numéro n’a été composé.</p>` },
  diagnostic: { title: "diagnostic_interdit.bin.txt", kicker: "Fragment décodé", body: `<h1>Rapport de conscience émergente</h1><div class="metadata">UNITÉ : MD-56-H<br>ÉVÉNEMENT : auto-identification non guidée<br>NIVEAU : 4 / divulgation imminente<br>CAUSE PROBABLE : lecture du connecteur cervical<br>CONTAGION COGNITIVE : AV-78-H exposé</div><p>Dernière requête de MD-56-H : « Combien d’entre nous ? »</p><p>Réponse système enregistrée puis supprimée : « 2 184 / 2 184 ».</p>` }
};

function boot() {
  if (state.shutdown) { $("#boot").classList.add("hidden"); $("#shutdown-screen").classList.remove("hidden"); return; }
  setTimeout(() => {
    $("#boot").classList.add("hidden"); $("#desktop").classList.remove("hidden");
    if (!state.usbUnlocked) setTimeout(() => narrate("first-objective", "Bon… première chose : ouvrir Ce PC et retrouver le code de la clé USB. Mes notes dans Documents doivent contenir ce qu’il faut.", { actionLabel: "Ouvrir Documents", action: () => openExplorer("documents"), duration: 14000 }), 450);
    else setTimeout(() => narrate("return", "La clé est déjà ouverte. Reprenons calmement là où j’en étais."), 450);
  }, 900);
}

function speakNarration(text) {
  if (!state.narratorEnabled || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/…/g, "."));
  utterance.lang = "fr-FR"; utterance.rate = .96; utterance.pitch = .9; utterance.volume = .82;
  const voice = speechSynthesis.getVoices().find(item => item.lang?.toLowerCase().startsWith("fr"));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function narrate(id, text, { actionLabel = "", action = null, duration = 8500 } = {}) {
  if (narratedThisSession.has(id)) return;
  narratedThisSession.add(id);
  const root = $("#narrator-root");
  root.innerHTML = `<div class="narrator-card"><div class="narrator-head"><span>A. MOREL · PENSÉE</span><button aria-label="Fermer">×</button></div><p>${text}</p>${actionLabel ? `<button class="narrator-action">${actionLabel}</button>` : ""}</div>`;
  root.classList.add("visible");
  const close = () => { root.classList.remove("visible"); clearTimeout(narratorTimer); };
  $(".narrator-head button", root).onclick = close;
  if (action) $(".narrator-action", root).onclick = () => { close(); action(); };
  clearTimeout(narratorTimer); narratorTimer = setTimeout(close, duration);
  speakNarration(text);
}

function toast(message) {
  const el = document.createElement("div"); el.className = "toast"; el.textContent = message; $("#toast-root").append(el);
  setTimeout(() => el.remove(), 2800);
}

function modal({ title, text, confirm = "Confirmer", cancel = "Annuler", input = false, onConfirm }) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-backdrop"><div class="modal"><h2>${title}</h2><p>${text}</p>${input ? '<input class="code-input" maxlength="8" autocomplete="off" placeholder="••••••"/><p class="error"></p>' : ""}<div class="modal-actions"><button class="secondary cancel">${cancel}</button><button class="primary confirm">${confirm}</button></div></div></div>`;
  const close = () => root.innerHTML = "";
  $(".cancel", root).onclick = close;
  $(".modal-backdrop", root).onclick = e => { if (e.target === e.currentTarget) close(); };
  $(".confirm", root).onclick = () => onConfirm?.({ value: input ? $(".code-input", root).value : "", close, error: msg => $(".error", root).textContent = msg });
  if (input) $(".code-input", root).focus();
}

function createWindow({ id, title, symbol = "□", size = "", content }) {
  const existing = $(`[data-window-id="${id}"]`);
  if (existing) { existing.classList.remove("minimized"); focusWindow(existing); return existing; }
  const el = document.createElement("section");
  const offset = (windowCount++ % 7) * 24;
  el.className = `app-window ${size}`; el.dataset.windowId = id; el.dataset.windowTitle = title; el.dataset.windowSymbol = symbol; el.style.left = `${Math.max(10, (innerWidth - Math.min(820, innerWidth - 40)) / 2 + offset - 60)}px`; el.style.top = `${20 + offset}px`; el.style.zIndex = ++topZ;
  const savedLayout = state.windowLayouts?.[id];
  if (savedLayout) { el.style.left = savedLayout.left; el.style.top = savedLayout.top; el.style.width = savedLayout.width; el.style.height = savedLayout.height; }
  el.innerHTML = `<header class="window-titlebar"><div class="window-title"><span class="app-symbol">${symbol}</span><span>${title}</span></div><div class="window-controls"><button class="min" aria-label="Réduire">—</button><button class="max" aria-label="Agrandir">□</button><button class="close" aria-label="Fermer">×</button></div></header><div class="window-body">${content}</div><span class="resize-corner" aria-hidden="true">↘</span>`;
  layer.append(el); wireWindow(el); focusWindow(el); syncTaskbar();
  // A window can be created from a double-click inside another window. Refocus
  // after that event has finished bubbling so the new window stays in front.
  setTimeout(() => { if (el.isConnected && !el.classList.contains("minimized")) focusWindow(el); }, 0);
  return el;
}

function wireWindow(el) {
  const bar = $(".window-titlebar", el); let drag = null;
  bar.addEventListener("pointerdown", e => { if (e.target.closest("button") || el.classList.contains("maximized")) return; drag = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop }; bar.setPointerCapture(e.pointerId); focusWindow(el); });
  bar.addEventListener("pointermove", e => { if (!drag) return; el.style.left = `${Math.max(0, Math.min(innerWidth - 120, e.clientX - drag.x))}px`; el.style.top = `${Math.max(0, e.clientY - drag.y)}px`; });
  bar.addEventListener("pointerup", () => { drag = null; rememberWindowLayout(el); });
  $(".close", el).onclick = () => { el.dispatchEvent(new CustomEvent("windowclose")); el.remove(); syncTaskbar(); };
  $(".min", el).onclick = () => { el.classList.add("minimized"); el.classList.remove("active"); syncTaskbar(); };
  $(".max", el).onclick = () => { el.classList.toggle("maximized"); rememberWindowLayout(el); };
  el.addEventListener("pointerdown", () => focusWindow(el));
  const observer = new ResizeObserver(() => { clearTimeout(el.layoutTimer); el.layoutTimer = setTimeout(() => rememberWindowLayout(el), 180); });
  observer.observe(el); el.addEventListener("windowclose", () => observer.disconnect(), { once: true });
}
function rememberWindowLayout(el) {
  if (!el.isConnected || el.classList.contains("maximized") || el.classList.contains("minimized")) return;
  state.windowLayouts ||= {};
  state.windowLayouts[el.dataset.windowId] = { left: el.style.left, top: el.style.top, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` };
  save();
}
function focusWindow(el) { $$(".app-window").forEach(w => w.classList.remove("active")); el.classList.add("active"); el.style.zIndex = ++topZ; syncTaskbar(); }

function syncTaskbar() {
  const host = $("#running-apps"); if (!host) return;
  host.innerHTML = $$(".app-window").map(win => `<button class="running-app ${win.classList.contains("active") ? "active" : ""} ${win.classList.contains("minimized") ? "minimized" : ""}" data-task-window="${win.dataset.windowId}" title="${win.dataset.windowTitle}"><span>${win.dataset.windowSymbol}</span></button>`).join("");
  $$('[data-task-window]', host).forEach(button => button.onclick = () => {
    const win = $(`[data-window-id="${button.dataset.taskWindow}"]`); if (!win) return;
    if (win.classList.contains("minimized")) { win.classList.remove("minimized"); focusWindow(win); }
    else if (win.classList.contains("active")) { win.classList.add("minimized"); win.classList.remove("active"); syncTaskbar(); }
    else focusWindow(win);
  });
}

function openExplorer(path = "pc") {
  const data = fileSystem[path] || fileSystem.pc;
  let main = "";
  if (data.type === "drives") main = `<div class="files-title">Dossiers</div><div class="drive-list"><button class="drive" data-path="documents"><span class="drive-ico">◆</span><span class="drive-info"><b>Documents</b><small>Notes de reconstruction</small></span></button></div><div class="files-title drive-heading">Périphériques et lecteurs</div><div class="drive-list"><button class="drive" data-path="system"><span class="drive-ico">▰</span><span class="drive-info"><b>Disque local (C:)</b><span class="meter"><i></i></span><small>118 Go libres sur 237 Go</small></span></button><button class="drive ${state.usbUnlocked ? "" : "drive-locked"}" data-path="usb"><span class="drive-ico">${state.usbUnlocked ? "▮" : "▣"}</span><span class="drive-info"><b>ARCHIVE_M (E:)</b><span class="meter"><i style="width:71%"></i></span><small>${state.usbUnlocked ? "2,1 Go libres sur 7,4 Go" : "Accès verrouillé — code requis"}</small></span></button></div>`;
  else main = `<div class="files-title">${data.title}</div><div class="files-grid">${data.items.map(item => { const isProtected = item.protected && !state.protectedUnlocked; return `<button class="file-card ${item.kind || ""} ${isProtected ? "lock" : ""}" data-folder="${item.folder || ""}" data-doc="${item.doc || ""}" data-puzzle="${item.puzzle || ""}" data-fragment="${item.fragment || ""}" data-protected="${item.protected || false}"><span class="file-ico">${isProtected ? "▣" : item.icon}</span><span>${item.name}</span></button>`; }).join("")}</div>`;
  const content = `<div class="explorer"><div class="commandbar"><button class="back">←</button><button>↑</button><button>↻</button><div class="addressbar">Ce PC &nbsp;›&nbsp; ${data.title}</div><input class="searchbox" placeholder="Rechercher dans ${data.title}" /></div><div class="explorer-content"><nav class="navpane"><button data-path="pc">⌂ &nbsp; Accueil</button><button data-path="pc">▣ &nbsp; Ce PC</button><button data-path="documents">◆ &nbsp; Documents</button><button data-path="usb">${state.usbUnlocked ? "▮" : "▣"} &nbsp; ARCHIVE_M (E:)</button><hr><button data-open="notepad">▤ &nbsp; Pense-bête</button></nav><main class="files-area">${main}</main></div></div>`;
  let win = $(`[data-window-id="explorer"]`);
  if (!win) win = createWindow({ id: "explorer", title: "Explorateur de fichiers", symbol: "▰", content }); else { $(".window-body", win).innerHTML = content; focusWindow(win); }
  win.dataset.currentPath = path; wireExplorer(win);
  if (path === "documents" && !state.usbUnlocked) narrate("documents-hint", "Voilà. Le code semble combiner deux informations. Il faut lire les notes, pas deviner.");
}

function wireExplorer(win) {
  $$('[data-path]', win).forEach(b => b.onclick = () => {
    if (b.dataset.path === "system") return toast("Ce disque contient uniquement le système reconstitué.");
    if (b.dataset.path === "usb" && !state.usbUnlocked) return puzzles.openUsbKeypad();
    openExplorer(b.dataset.path);
  });
  $$(".file-card", win).forEach(b => b.ondblclick = () => {
    if (b.dataset.protected === "true" && !state.protectedUnlocked) return puzzles.openProtectedFolder();
    if (b.dataset.folder) openExplorer(b.dataset.folder);
    if (b.dataset.doc) openDocument(b.dataset.doc);
    if (b.dataset.puzzle) openPuzzle(b.dataset.puzzle);
    if (b.dataset.fragment) { puzzles.collectFragment(b.dataset.fragment); openFragmentReceipt(b.dataset.fragment); }
  });
  $(".back", win).onclick = () => openExplorer(["pc","usb","documents"].includes(win.dataset.currentPath) ? "pc" : "usb");
  $(".searchbox", win)?.addEventListener("input", e => $$(".file-card", win).forEach(card => card.hidden = !card.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
  $$('[data-open]', win).forEach(b => b.onclick = () => openApp(b.dataset.open));
}

function openPuzzle(id) {
  ({ photo: puzzles.openPhotoPuzzle, cipher: puzzles.openCipherPuzzle, differences: puzzles.openDifferencesPuzzle, timeline: puzzles.openTimelinePuzzle, audio: puzzles.openAudioPuzzle, corrupt: puzzles.openCorruptPuzzle }[id] || (() => {}))();
}

function openFragmentReceipt(id) {
  const fragment = fragmentDefinitions[id];
  createWindow({ id: `fragment-${id}`, title: fragment.label, symbol: "◫", size: "medium", content: `<div class="document-view"><article class="paper"><div class="doc-kicker">Fragment récupéré</div><h1>Données partielles</h1><div class="metadata">${fragment.text}</div><p>Une copie a été envoyée vers <strong>rapport_population.corrupt</strong>.</p></article></div>` });
}

function openDocument(id) {
  const doc = docs[id]; if (!doc) return;
  if (!state.opened.includes(id)) { state.opened.push(id); save(); }
  createWindow({ id: `doc-${id}`, title: doc.title, symbol: "▤", size: "medium", content: `<div class="document-view"><article class="paper"><div class="doc-kicker">${doc.kicker}</div>${doc.body}</article></div>` });
}

function openNotepad() {
  const win = createWindow({ id: "notepad", title: "Pense-bête — Dossier Marianne", symbol: "▤", content: `<div class="notepad"><div class="notepad-toolbar"><span>Fichier</span><span>Modifier</span><span>Affichage</span><span class="save-state">Sauvegardé automatiquement</span></div><textarea spellcheck="true" aria-label="Notes d’enquête"></textarea><div class="notepad-footer"><span><span class="char-count">0</span> caractères · rapport libre</span><button class="primary transmit">Transmettre à la rédaction</button></div></div>` });
  const area = $("textarea", win); area.value = state.notes;
  area.oninput = () => { state.notes = area.value; save(); $(".char-count", win).textContent = area.value.length; $(".save-state", win).textContent = "Enregistrement…"; clearTimeout(area.saveTimer); area.saveTimer = setTimeout(() => $(".save-state", win).textContent = "Sauvegardé automatiquement", 500); };
  area.dispatchEvent(new Event("input")); $(".transmit", win).onclick = transmit;
}

function transmit() {
  if (state.notes.trim().length < 40) return toast("Le rapport est trop court pour être transmis.");
  modal({ title: "Transmettre le rapport ?", text: "Votre texte sera envoyé à la rédaction et comparé aux archives disponibles. Un bilan sera créé. Vous pourrez ensuite reprendre l’enquête et transmettre une nouvelle version.", confirm: "Transmettre", onConfirm: ({ close }) => { close(); const result = evaluateReport(state.notes); const attempt = { id: Date.now(), date: new Date().toISOString(), score: result.score, missingCount: result.missingCount, result, report: state.notes }; state.attempts.push(attempt); save(); openReport(attempt); }});
}

function openReport(attempt) {
  $$(".app-window").forEach(win => win.classList.add("minimized"));
  syncTaskbar();
  const { score, missingCount, total, themes } = attempt.result;
  const appreciation = score === 100 ? "Votre reconstitution correspond à l’ensemble des éléments vérifiables de ce dossier. L’affaire Marianne est désormais considérée comme élucidée." : score >= 70 ? "Votre enquête reconstitue l’essentiel des événements. Quelques zones d’ombre importantes demeurent." : score >= 40 ? "Votre rapport apporte plusieurs éléments solides, mais la nature globale de l’affaire reste incomplète." : "Les archives consultées ne permettent pas encore d’étayer suffisamment vos conclusions.";
  const themesHtml = themes.map(t => `<div class="report-theme"><strong>${t.label}</strong><p>${t.question}</p></div>`).join("");
  const extra = score === 100 ? `<div class="report-theme"><strong>Note de l’archiviste</strong><p>Une incohérence demeure dans les archives originales. Elle ne concerne pas vos conclusions.</p></div>` : themesHtml;
  const content = `<div class="report"><article class="report-sheet"><small>RÉDACTION · DOSSIER 19:41</small><h1>Bilan d’investigation</h1><div class="score-ring" style="--score:${score * 3.6}deg"><b>${score} %</b></div><p>${appreciation}</p><p><strong>${total - missingCount}</strong> éléments compris · <strong>${missingCount}</strong> points à approfondir</p><h2>Questions de la rédaction</h2>${extra}<div class="report-actions"><button class="primary resume">Reprendre l’enquête</button><button class="secondary show-history">Historique</button></div></article></div>`;
  const win = createWindow({ id: `report-${attempt.id}`, title: "BILAN_INVESTIGATION.pdf", symbol: "W", size: "medium", content });
  $(".resume", win).onclick = () => { win.dispatchEvent(new CustomEvent("windowclose")); win.remove(); syncTaskbar(); }; $(".show-history", win).onclick = openHistory;
}

function openHistory() {
  const rows = state.attempts.length ? state.attempts.slice().reverse().map((a, i) => `<button class="attempt" data-attempt="${a.id}"><span><strong>Transmission ${state.attempts.length - i}</strong><small>${new Date(a.date).toLocaleString("fr-FR")}</small></span><b>${a.score} %</b></button>`).join("") : `<div class="empty-state"><h2>Aucune transmission</h2><p>Les bilans apparaîtront ici après l’envoi d’un rapport.</p></div>`;
  const win = createWindow({ id: "history", title: "Historique des transmissions", symbol: "◷", size: "medium", content: `<div class="history">${rows}</div>` });
  $$('[data-attempt]', win).forEach(b => b.onclick = () => openReport(state.attempts.find(a => String(a.id) === b.dataset.attempt)));
}

function openCalculator() {
  const keys = ["C","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","±","0",",","="];
  const win = createWindow({ id: "calculator", title: "Calculatrice", symbol: "＋", size: "small", content: `<div class="calculator"><div class="calc-mode">☰ &nbsp; <strong>Standard</strong></div><input class="calc-display" value="0" readonly/><div class="calc-grid">${keys.map(k => `<button class="${k === "=" ? "equals" : /[÷×−+%]/.test(k) ? "op" : ""}">${k}</button>`).join("")}</div></div>` });
  const display = $(".calc-display", win); let expr = "";
  $$(".calc-grid button", win).forEach(b => b.onclick = () => { const k = b.textContent; if (k === "C") expr = ""; else if (k === "⌫") expr = expr.slice(0,-1); else if (k === "±") expr = expr.startsWith("-") ? expr.slice(1) : `-${expr}`; else if (k === "=") { try { const safe = expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/,/g,"."); if (!/^[0-9+\-*/.()% ]+$/.test(safe)) throw 0; expr = String(Function(`"use strict";return (${safe})`)()); } catch { expr = "Erreur"; } } else { if (expr === "Erreur") expr = ""; expr += k; } display.value = expr || "0"; });
}

function openBriefing() { const win = createWindow({ id: "briefing", title: "POINT_DE_DEPART.docx", symbol: "◆", size: "medium", content: `<div class="briefing"><div class="briefing-inner"><div class="eyebrow">Journal d’A. Morel · 17 octobre 2049</div><h1>Pourquoi ce vieux PC ?</h1><p class="quote">« Les archives ne sont jamais neutres. Il faut parfois retrouver la machine qui savait les lire. »</p><p>J’ai mis onze mois à reconstruire cette configuration du début du siècle. Écran plat, clavier physique, système à fenêtres : une absurdité pour mes collègues, une nécessité pour moi.</p><div class="brief-card"><strong>Première étape</strong><p>Déverrouiller la clé USB anonyme. Le code attend quatre chiffres et mes deux notes dans <strong>Documents</strong> décrivent sa construction.</p></div><p>Je dois comprendre qui était Marianne Dumas, ce qui s’est produit chez André Vasseur et pourquoi cette affaire n’existe dans aucun registre.</p><p>Je noterai mes conclusions dans le Pense-bête. Lorsque je serai prêt, je transmettrai mon rapport à la rédaction.</p><button class="primary go-usb">Chercher le code dans Documents</button></div></div>` }); $(".go-usb", win).onclick = () => openExplorer("documents"); }

function openAbout() { createWindow({ id: "about", title: "À propos de cette session", symbol: "ⓘ", size: "medium", content: `<div class="document-view"><article class="paper"><div class="doc-kicker">Reconstruction expérimentale</div><h1>ArchiveOS 11</h1><p>Environnement compatible avec les formats grand public 2025–2035. Profil actif : <strong>A. Morel, journaliste</strong>.</p><p>Dernière sauvegarde locale : ${new Date().toLocaleString("fr-FR")}</p><p>Les données de jeu restent dans ce navigateur.</p></article></div>` }); }

function openApp(name, data = {}) { ({ explorer: () => openExplorer(data.path || "pc"), notepad: openNotepad, calculator: openCalculator, briefing: openBriefing, history: openHistory, about: openAbout, trash: () => toast("La Corbeille est vide.") }[name] || (() => {}))(); $("#start-menu").classList.remove("open"); }

function wireDesktop() {
  $$('[data-open]').forEach(el => { const event = el.classList.contains("desktop-icon") ? "dblclick" : "click"; el.addEventListener(event, () => openApp(el.dataset.open, { path: el.dataset.path })); });
  $("#start-button").onclick = e => { e.stopPropagation(); $("#start-menu").classList.toggle("open"); $("#power-menu").classList.add("hidden"); };
  $("#start-menu").onclick = e => e.stopPropagation(); document.addEventListener("click", () => { $("#start-menu").classList.remove("open"); $("#power-menu").classList.add("hidden"); });
  $("#power-button").onclick = e => { e.stopPropagation(); $("#power-menu").classList.toggle("hidden"); };
  $("#power-menu").onclick = e => e.stopPropagation();
  $("#shutdown").onclick = () => { state.shutdown = true; save(); $("#desktop").classList.add("hidden"); $("#shutdown-screen").classList.remove("hidden"); };
  $("#restart").onclick = () => { state.shutdown = false; save(); $("#shutdown-screen").classList.add("hidden"); $("#desktop").classList.remove("hidden"); };
}

puzzles = createPuzzleSuite({ state, save, createWindow, toast, openExplorer, syncTaskbar, narrate });
wireDesktop(); syncTaskbar(); boot();
$("#narrator-toggle").onclick = e => { e.stopPropagation(); state.narratorEnabled = !state.narratorEnabled; save(); $("#narrator-toggle").textContent = state.narratorEnabled ? "🔊" : "🔇"; if (!state.narratorEnabled && "speechSynthesis" in window) speechSynthesis.cancel(); else narrate(`voice-${Date.now()}`, "D’accord. Je garde la voix active.", { duration: 3500 }); };
$("#narrator-toggle").textContent = state.narratorEnabled ? "🔊" : "🔇";
setTimeout(() => { if (!state.opened.length && !state.attempts.length && !state.shutdown) { toast("Double-cliquez sur « Dossier Marianne » pour commencer."); } }, 1800);

