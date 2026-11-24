# État du développement — 19:41

Dernière mise à jour : 24 novembre 2026 — correction prioritaire validée
Branche de production : `main`
Version de référence précédente : `9436e8c` — `feat: render archive footage in 3d and document status`

## Correction prioritaire actuelle

- Cause réelle du bureau non cliquable identifiée : `#window-layer`, placé après les icônes et couvrant tout le bureau, interceptait les entrées souris réelles même lorsqu’il était vide. Les anciens tests déclenchaient directement `dblclick` en JavaScript et ne reproduisaient pas ce blocage.
- Correctif appliqué : le calque de fenêtres ignore désormais les événements, tandis que ses fenêtres enfants les reçoivent normalement.
- Correction validée dans Chrome avec de véritables entrées souris : sélection simple, double-clic, Entrée, déplacement, réduction, restauration, maximisation, fermeture et coexistence de plusieurs fenêtres.
- Aucun calque de cinématique, canvas WebGL ou élément transparent ne reste dans la chaîne de ciblage après la transition.

## Phase 1 — Interface informatique : terminée et revalidée

- Bureau ArchiveOS réaliste avec fond d’écran original, icônes SVG colorées et menu Démarrer.
- Clic simple = sélection ; double-clic ou Entrée = ouverture ; clic vide = désélection ; menu contextuel.
- Fenêtres déplaçables, redimensionnables, maximisables, minimisables et restaurables avec état conservé.
- Barre des tâches avec fenêtres actives/réduites, aperçu au survol et sélection directe.
- Explorateur avec historique, barre d’adresse, recherche, navigation latérale, vues grille/liste et périphériques.
- Sélecteur FRA/ENG discret dans la zone de notification.
- Suppression du panneau d’objectif permanent.

Fichiers principaux : `index.html`, `app.js`, `shell.css`, `icons.js`, `assets/archiveos-wallpaper.png`.

## Phase 2 — Cinématiques et vidéos : terminée et remplacée

- Introduction Three.js d’environ 44 secondes, strictement en première personne dès la première image.
- Main anatomique CC0 locale avec seize os articulés : approche, prise de poignée et ouverture de la porte.
- Pièce habitée avec bois, métal, tissu, verre, plâtre texturé, livres, pluie, plante, radiateur, papiers et éclairage volumétrique rétro.
- Marche subjective avec oscillation naturelle et pas, descente de caméra pour l’assise, regard vers clavier et souris, démarrage ArchiveOS et raccord progressif sur le bureau interactif.
- Sons procéduraux locaux pour la porte, les pas, la chaise et le démarrage.
- Reprise de partie sans rejouer automatiquement l’introduction ; option de relecture dans le menu Démarrer.
- Transition USB Three.js dans la même pièce.
- Vidéos CCTV, cuisine, technicien, objet tombé et reconstitution rendues en véritables scènes 3D low-poly.
- Logo ANCC furtif limité à la fenêtre temporelle prévue dans la CCTV.
- Three.js, son chargeur GLTF et le modèle anatomique sont distribués localement sous licences MIT/CC0, sans CDN ni API payante.

Fichiers principaux : `cinematics.js`, `assets/models/hand-posable.glb`, `assets/models/LICENSE-hand-posable.txt`, `assets/vendor/three.module.js`, `assets/vendor/GLTFLoader.js`, `assets/utils/BufferGeometryUtils.js`, `app.js`, `shell.css`.

## Phase 3 — Finalisation du jeu : terminée

- Code USB officiel `2311` et indice du chat trouvé le 23 novembre 2024.
- Sceau gouvernemental, matrice `2727`, restauration réseau, navigateur fictif et Cloud.
- Télé Hebdomadaire de huit pages, témoignage, CCTV, amplification audio, maintenance et objet tombé.
- Mode avion après onze clics, atlas et dossier Honduras.
- Documents administratifs, sauvegarde locale, rapport final et teaser 19:42 cohérents avec la saison 1.
- Évaluateur contrôlé avec rapport complet à 100 %, sans exiger les mystères réservés à 19:42.
- Versions française et anglaise conservées ; progression persistante.

Fichiers principaux : `puzzles.js`, `evaluator.js`, `app.js`, `game.css`, `shell.css`, `tests/puzzle-data.test.mjs`.

## Vérifications effectuées

- `node --check app.js` : réussi.
- `node --check cinematics.js` : réussi.
- `node --test` : **45/45 tests réussis**.
- Parcours navigateur local avec entrées Chrome natives : réussi sans exception JavaScript.
- Captures visuelles contrôlées aux huit moments clés : porte fermée, main en approche, prise, ouverture, marche, assise, regard clavier/écran et transition finale.
- Chaque icône du bureau est accessible ; sélection simple, double-clic réel, Entrée, glisser de fenêtre, réduction, restauration depuis la barre des tâches, maximisation et fermeture ont été rejoués.
- Parcours navigateur public complet : introduction, bureau, Explorateur, USB, sceau, matrice, réseau, Cloud, magazine, CCTV 3D, scènes secondaires, maintenance, onze clics, Honduras et rapport final **100 %**.
- GitHub Pages : workflow **Deploy to GitHub Pages #10** réussi pour `669ae4b`.
- URL publique contrôlée : `https://orivexapro.github.io/19-42-arg/`.

## Décisions techniques

- Application statique sans dépendance à installer et sans service payant.
- Three.js et le modèle anatomique sont épinglés et servis depuis le dépôt pour éviter une dépendance réseau d’exécution.
- Tous les médias et sons nécessaires au jeu sont locaux ou générés par le navigateur.
- Les fenêtres restent dans le DOM lorsqu’elles sont réduites afin de préserver texte, zoom, lecture et navigation.
- Les secrets non révélés de 19:42 restent caviardés ou formulés comme inconnus.

## Éléments non réalisés / risques connus

- Aucun paiement ni système d’authentification : ils nécessitent un service serveur et une configuration commerciale qui ne sont pas présents dans ce dépôt statique.
- Le dépôt public expose nécessairement les codes, textes, réponses et logique des énigmes. Pour une commercialisation, rendre les contenus protégés privés ou les servir depuis un backend authentifié.
- Le contrôle automatique couvre le parcours fonctionnel complet, mais une validation humaine finale du rythme, du confort audio et de la durée réelle reste recommandée avant une mise en vente.

## Prochaine action précise

Après publication, surveiller les retours de confort sur la durée de l’introduction et conserver en priorité la stabilité du bureau et du parcours d’enquête.
