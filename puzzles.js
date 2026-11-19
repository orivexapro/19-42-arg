const PHOTO_ORDER = [4, 0, 5, 2, 1, 3];
const CHRONOLOGY = ["arrival", "query", "argument", "impact", "silence"];
const CORRUPT_ORDER = ["f1", "f2", "f3", "f4"];

export const fragmentDefinitions = {
  f1: { label: "fragment_01.tmp", text: "Les résidents du secteur" },
  f2: { label: "cache_7A.bin", text: "partagent une architecture" },
  f3: { label: "ligne_184.rec", text: "et reçoivent chaque nuit" },
  f4: { label: "fin_document.dat", text: "une maintenance synchronisée." }
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function createPuzzleSuite(ctx) {
  const { state, save, createWindow, toast } = ctx;
  state.puzzles ||= {};
  state.fragments ||= [];

  const complete = (id, message) => {
    state.puzzles[id] = true;
    save();
    if (message) toast(message);
  };

  function openUsbKeypad() {
    const win = createWindow({
      id: "usb-keypad",
      title: "ARCHIVE_M (E:) — Accès sécurisé",
      symbol: "▮",
      size: "small keypad-window",
      content: `<div class="keypad-app"><div class="keypad-led"><small>CODE À 4 CHIFFRES</small><output aria-live="polite">••••</output></div><p>Le support attend le numéro du bâtiment suivi de la minute inscrite sur son étiquette.</p><div class="keypad-grid">${[1,2,3,4,5,6,7,8,9,"⌫",0,"↵"].map(key => `<button data-key="${key}">${key}</button>`).join("")}</div><div class="keypad-status">Lecteur verrouillé</div></div>`
    });
    let code = "";
    let accepted = false;
    const output = win.querySelector("output");
    const status = win.querySelector(".keypad-status");
    const render = () => output.textContent = code.padEnd(4, "•");
    const submit = () => {
      if (code === "1141" && !accepted) {
        accepted = true;
        state.usbUnlocked = true;
        complete("usb", "Le lecteur E: est maintenant accessible.");
        status.textContent = "Accès autorisé";
        status.classList.add("ok");
        window.removeEventListener("keydown", win._keyHandler);
        win.remove();
        ctx.syncTaskbar?.();
        ctx.openExplorer("usb");
      } else {
        status.textContent = "Code refusé";
        status.classList.remove("ok");
        win.classList.add("shake");
        setTimeout(() => win.classList.remove("shake"), 350);
        code = "";
        render();
      }
    };
    const press = key => {
      if (/^\d$/.test(key) && code.length < 4) code += key;
      else if (key === "Backspace" || key === "⌫") code = code.slice(0, -1);
      else if (key === "Enter" || key === "↵") submit();
      render();
    };
    win.querySelectorAll("[data-key]").forEach(button => button.onclick = () => press(button.dataset.key));
    win._keyHandler = event => {
      if (!document.body.contains(win) || win.classList.contains("minimized")) return;
      if (/^\d$/.test(event.key) || event.code.startsWith("Numpad") && /^Numpad\d$/.test(event.code)) press(event.key.match(/\d/)?.[0] || event.code.slice(-1));
      else if (["Enter", "NumpadEnter", "Backspace"].includes(event.key) || event.code === "NumpadEnter") press(event.code === "NumpadEnter" ? "Enter" : event.key);
    };
    window.addEventListener("keydown", win._keyHandler);
    win.addEventListener("windowclose", () => window.removeEventListener("keydown", win._keyHandler), { once: true });
  }

  function openPhotoPuzzle() {
    const initial = state.photoOrder || PHOTO_ORDER.slice();
    const win = createWindow({ id: "puzzle-photo", title: "photo_recuperee.jpg — Reconstruction", symbol: "▧", size: "puzzle-wide", content: `<div class="puzzle-shell photo-puzzle"><header><span>ARCHIVE VISUELLE / 18 RUE DES SAULES</span><h2>Photographie déchirée</h2><p>Faites glisser les fragments. Un clic sur deux fragments permet aussi de les échanger.</p></header><div class="photo-workbench"><div class="photo-grid" role="grid"></div><aside><strong>Table lumineuse</strong><p>Les déchirures suivent une grille de tirage 3 × 2.</p><button class="secondary photo-reset">Mélanger à nouveau</button><div class="puzzle-note"></div></aside></div></div>` });
    let order = initial.slice(); let selected = null;
    const grid = win.querySelector(".photo-grid");
    const note = win.querySelector(".puzzle-note");
    const render = () => {
      grid.innerHTML = order.map((tile, position) => `<button class="photo-piece ${selected === position ? "selected" : ""}" draggable="true" data-position="${position}" data-tile="${tile}" style="--col:${tile % 3};--row:${Math.floor(tile / 3)}" aria-label="Fragment ${tile + 1}"></button>`).join("");
      grid.querySelectorAll(".photo-piece").forEach(piece => {
        piece.ondragstart = e => e.dataTransfer.setData("text/plain", piece.dataset.position);
        piece.ondragover = e => e.preventDefault();
        piece.ondrop = e => { e.preventDefault(); swap(Number(e.dataTransfer.getData("text/plain")), Number(piece.dataset.position)); };
        piece.onclick = () => {
          const pos = Number(piece.dataset.position);
          if (selected === null) {
            selected = pos;
            piece.classList.add("selected");
          } else {
            const from = selected;
            selected = null;
            swap(from, pos);
          }
        };
      });
      state.photoOrder = order; save();
      if (order.every((tile, i) => tile === i)) {
        complete("photo");
        note.innerHTML = `<strong>Image restaurée.</strong><p>Le verso porte une mention au crayon : « André — 18, rue des Saules ».</p>`;
        grid.classList.add("complete");
      }
    };
    const swap = (a, b) => { [order[a], order[b]] = [order[b], order[a]]; render(); };
    win.querySelector(".photo-reset").onclick = () => { order = PHOTO_ORDER.slice(); selected = null; render(); };
    render();
  }

  const cipherText = "OH UHJLVWUH D17 HVW VHUYLFH D 03K00. PRW GH SDVVH: QRP GH UXH + VHFWHXU.";
  const decode = (input, shift) => input.replace(/[A-Z]/g, char => String.fromCharCode((char.charCodeAt(0) - 65 - shift + 26) % 26 + 65));
  function openCipherPuzzle() {
    const win = createWindow({ id: "puzzle-cipher", title: "message_intercepte.enc", symbol: "⌁", size: "puzzle-wide", content: `<div class="puzzle-shell cipher-puzzle"><header><span>OUTIL DE DÉCHIFFREMENT LOCAL</span><h2>Message intercepté</h2><p>La fiche « ROTATION.txt » décrit le principe utilisé par l’auteur.</p></header><div class="cipher-card"><label>Message chiffré</label><div class="cipher-source">${cipherText}</div><label for="shift-range">Décalage alphabétique : <b class="shift-value">0</b></label><input id="shift-range" type="range" min="0" max="25" value="0"><label>Résultat</label><div class="cipher-result"></div><button class="primary cipher-accept">Archiver le résultat lisible</button><div class="puzzle-note"></div></div></div>` });
    const range = win.querySelector("input"); const result = win.querySelector(".cipher-result"); const note = win.querySelector(".puzzle-note");
    const render = () => { win.querySelector(".shift-value").textContent = range.value; result.textContent = decode(cipherText, Number(range.value)); };
    range.oninput = render;
    win.querySelector(".cipher-accept").onclick = () => {
      if (Number(range.value) === 3) { complete("cipher"); note.innerHTML = `<strong>Texte cohérent archivé.</strong><p>La combinaison demandée est le nom de la rue d’André suivi du numéro de secteur.</p>`; }
      else note.textContent = "Le texte reste incohérent.";
    };
    render();
  }

  function openDifferencesPuzzle() {
    const spots = [{ id:"door", x:11, y:58, label:"Numéro de porte modifié" },{ id:"camera", x:50, y:15, label:"Caméra ajoutée" },{ id:"lamp", x:76, y:45, label:"Fenêtre active" },{ id:"cabinet", x:89, y:70, label:"Armoire technique ouverte" }];
    const found = new Set(state.differences || []);
    const win = createWindow({ id:"puzzle-differences", title:"comparateur_A17.exe", symbol:"◫", size:"puzzle-xl", content:`<div class="puzzle-shell differences-puzzle"><header><span>CAMÉRAS MUNICIPALES / MÊME CADRAGE</span><h2>Comparer les prises de vue</h2><p>Cliquez sur les anomalies de la vue du 18 octobre.</p></header><div class="compare-grid"><figure><img src="assets/neighborhood.jpg" alt="Quartier le 17 octobre"><figcaption>17 OCT. · 18:40</figcaption></figure><figure class="changed-photo"><img src="assets/neighborhood.jpg" alt="Quartier le 18 octobre"><span class="visual-change camera-change"></span><span class="visual-change lamp-change"></span><span class="visual-change cabinet-change"></span><span class="visual-change door-change">17</span>${spots.map(s=>`<button class="difference-spot ${found.has(s.id)?"found":""}" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="Signaler une différence"></button>`).join("")}<figcaption>18 OCT. · 18:40</figcaption></figure></div><div class="puzzle-note"></div></div>` });
    const note = win.querySelector(".puzzle-note");
    win.querySelectorAll(".difference-spot").forEach(button => button.onclick = () => {
      found.add(button.dataset.id); button.classList.add("found"); state.differences = [...found]; save();
      if (found.size === spots.length) { complete("differences"); note.innerHTML = `<strong>Comparaison terminée.</strong><p>Les quatre anomalies sont concentrées autour du réseau autonome A-17.</p>`; }
    });
    if (found.size === spots.length) note.innerHTML = `<strong>Comparaison terminée.</strong><p>Les quatre anomalies sont concentrées autour du réseau autonome A-17.</p>`;
  }

  function openTimelinePuzzle() {
    const events = {
      arrival: ["18:57:03", "Marianne ouvre la porte avec son badge."],
      query: ["19:31:08", "Une requête vers l’extérieur est bloquée."],
      argument: ["19:39:44", "Deux voix sont détectées dans le salon."],
      impact: ["19:40:52", "Un choc de 84 dB est enregistré."],
      silence: ["19:41:06", "Le bracelet de Marianne cesse d’émettre."]
    };
    let order = state.timelineOrder || ["impact","arrival","silence","query","argument"];
    const win = createWindow({ id:"puzzle-timeline", title:"reconstitution.chr", symbol:"◷", size:"puzzle-wide", content:`<div class="puzzle-shell timeline-puzzle"><header><span>CORRÉLATION DES HORODATAGES</span><h2>Reconstituer les dernières minutes</h2><p>Glissez les événements ou utilisez les flèches.</p></header><div class="timeline-list"></div><button class="primary timeline-check">Comparer aux horodatages</button><div class="puzzle-note"></div></div>` });
    const list = win.querySelector(".timeline-list"); const note = win.querySelector(".puzzle-note");
    const render = () => {
      list.innerHTML = order.map((id,index)=>`<article class="timeline-card" draggable="true" data-id="${id}" data-index="${index}"><span class="drag-handle">⠿</span><div><time>${events[id][0]}</time><p>${events[id][1]}</p></div><span><button data-move="-1" aria-label="Monter">↑</button><button data-move="1" aria-label="Descendre">↓</button></span></article>`).join("");
      list.querySelectorAll(".timeline-card").forEach(card => {
        card.ondragstart=e=>e.dataTransfer.setData("text/plain",card.dataset.index); card.ondragover=e=>e.preventDefault(); card.ondrop=e=>{e.preventDefault(); const from=Number(e.dataTransfer.getData("text/plain")),to=Number(card.dataset.index); const [item]=order.splice(from,1);order.splice(to,0,item);render();};
        card.querySelectorAll("[data-move]").forEach(button=>button.onclick=()=>{const from=Number(card.dataset.index),to=Math.max(0,Math.min(order.length-1,from+Number(button.dataset.move)));[order[from],order[to]]=[order[to],order[from]];render();});
      }); state.timelineOrder=order; save();
    };
    win.querySelector(".timeline-check").onclick=()=>{if(order.every((id,i)=>id===CHRONOLOGY[i])){complete("timeline");note.innerHTML=`<strong>Chronologie cohérente.</strong><p>L’arrêt du bracelet intervient à 19:41, après le choc et sans appel sortant.</p>`;}else note.textContent="Au moins un horodatage est encore déplacé.";};
    render();
  }

  function openAudioPuzzle() {
    const win = createWindow({ id:"puzzle-audio", title:"salon_canal_B.wav", symbol:"♪", size:"puzzle-wide", content:`<div class="puzzle-shell audio-puzzle"><header><span>ENREGISTREMENT / CANAL SECONDAIRE</span><h2>Analyse audio</h2><p>Le son utile est masqué par le ronflement électrique. La table Morse se trouve dans les archives.</p></header><div class="waveform">${Array.from({length:54},(_,i)=>`<i style="height:${18+((i*17)%52)}%"></i>`).join("")}</div><audio controls preload="metadata" src="assets/signal-a17.wav"></audio><div class="audio-tools"><button class="secondary isolate">Isoler 860 Hz</button><button class="secondary speed" data-speed="0.5">×0,5</button><button class="secondary speed" data-speed="1">×1</button><label>Indice entendu <input class="audio-answer" maxlength="8" placeholder="…"></label><button class="primary audio-check">Consigner</button></div><div class="puzzle-note"></div></div>` });
    const audio=win.querySelector("audio"); const note=win.querySelector(".puzzle-note");
    win.querySelectorAll(".speed").forEach(button=>button.onclick=()=>{audio.playbackRate=Number(button.dataset.speed);});
    win.querySelector(".isolate").onclick=async()=>{ if(!win._audioCtx){const AudioCtx=window.AudioContext||window.webkitAudioContext;win._audioCtx=new AudioCtx();const source=win._audioCtx.createMediaElementSource(audio),filter=win._audioCtx.createBiquadFilter();filter.type="bandpass";filter.frequency.value=860;filter.Q.value=8;source.connect(filter).connect(win._audioCtx.destination);} await win._audioCtx.resume();win.classList.add("isolated");toast("Canal 860 Hz isolé.");};
    win.querySelector(".audio-check").onclick=()=>{const answer=win.querySelector(".audio-answer").value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(answer==="A17"){complete("audio");note.innerHTML=`<strong>Signal identifié : A-17.</strong><p>Le canal est lié au secteur du quartier.</p>`;}else note.textContent="La séquence ne correspond pas encore à la table Morse.";};
  }

  function collectFragment(id) {
    if (!fragmentDefinitions[id] || state.fragments.includes(id)) return;
    state.fragments.push(id); save(); toast(`${fragmentDefinitions[id].label} copié dans le restaurateur.`);
  }

  function openCorruptPuzzle() {
    let order = state.corruptOrder || state.fragments.slice().sort(()=>.5-Math.random());
    const win=createWindow({id:"puzzle-corrupt",title:"rapport_population.corrupt",symbol:"⚠",size:"puzzle-wide",content:`<div class="puzzle-shell corrupt-puzzle"><header><span>RESTAURATEUR DE FICHIERS</span><h2>Document fragmenté</h2><p>Quatre fragments se trouvent dans des dossiers différents de la clé.</p></header><div class="fragment-bank"></div><div class="corrupt-slots"></div><button class="primary corrupt-check">Reconstruire le document</button><div class="puzzle-note"></div></div>`});
    const bank=win.querySelector(".fragment-bank"),slots=win.querySelector(".corrupt-slots"),note=win.querySelector(".puzzle-note");
    const render=()=>{bank.innerHTML=`<strong>Fragments récupérés</strong><p>${state.fragments.length?state.fragments.map(id=>fragmentDefinitions[id].label).join(" · "):"Aucun fragment copié."}</p>`;order=order.filter(id=>state.fragments.includes(id));state.fragments.forEach(id=>{if(!order.includes(id))order.push(id);});slots.innerHTML=order.map((id,i)=>`<article draggable="true" data-index="${i}"><span>${i+1}</span>${escapeHtml(fragmentDefinitions[id].text)}</article>`).join("")||`<div class="empty-fragments">Explorez IDENTITES, CHRONOLOGIE et SECTEUR_A17.</div>`;slots.querySelectorAll("article").forEach(card=>{card.ondragstart=e=>e.dataTransfer.setData("text/plain",card.dataset.index);card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain")),to=Number(card.dataset.index);const[item]=order.splice(from,1);order.splice(to,0,item);render();};card.onclick=()=>{const i=Number(card.dataset.index),j=(i+1)%order.length;[order[i],order[j]]=[order[j],order[i]];render();};});state.corruptOrder=order;save();};
    win.querySelector(".corrupt-check").onclick=()=>{if(state.fragments.length<4)note.textContent="Le document reste incomplet.";else if(order.every((id,i)=>id===CORRUPT_ORDER[i])){complete("corrupt");note.innerHTML=`<strong>Document restauré.</strong><p>« Les résidents du secteur partagent une architecture et reçoivent chaque nuit une maintenance synchronisée. »</p>`;}else note.textContent="Les raccords syntaxiques ne coïncident pas.";};render();
  }

  function openProtectedFolder() {
    const win=createWindow({id:"protected-login",title:"ARCHIVE_CONTROLE — Authentification",symbol:"▣",size:"small",content:`<div class="protected-login"><div class="lock-emblem">▣</div><h2>Dossier protégé</h2><p>Convention interne : <strong>nom de rue + numéro de secteur</strong>, sans espace.</p><input type="password" autocomplete="off" placeholder="Mot de passe"><button class="primary">Ouvrir l’archive</button><div class="puzzle-note"></div></div>`});
    const input=win.querySelector("input"),note=win.querySelector(".puzzle-note");const submit=()=>{const value=input.value.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");if(value==="SAULES17"){state.protectedUnlocked=true;complete("protected","Archive de contrôle déverrouillée.");win.dispatchEvent(new CustomEvent("windowclose"));win.remove();ctx.syncTaskbar?.();ctx.openExplorer("protected");}else{note.textContent="Authentification refusée.";input.select();}};win.querySelector("button.primary").onclick=submit;input.onkeydown=e=>{if(e.key==="Enter")submit();};input.focus();
  }

  return { openUsbKeypad, openPhotoPuzzle, openCipherPuzzle, openDifferencesPuzzle, openTimelinePuzzle, openAudioPuzzle, openCorruptPuzzle, openProtectedFolder, collectFragment };
}

