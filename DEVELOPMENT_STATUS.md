# État du développement — 19:41

## Copie de revue R05 — 26 novembre 2026

**Prochaine action** — regarder `19-41_Paris-Braise_R05.mp4` et recueillir le retour artistique avant le master navigateur ou toute intégration sur le site. La production publique est à cb49d98. La scène, les actions, les textures et la bibliothèque de revue sont sauvegardées sur la branche `dev/cinematique-paris-30fps` au commit a513bac (précédents jalons 7ff656c et d5b8379).

**Reprise constatée.** Blender avait terminé son travail. Les 480 PNG numérotés de 0001 à 0480 et le MP4 complet existaient déjà. Le fichier de contrôle Chrome restait local. Aucun nouveau rendu de scène n’a été nécessaire.

**Livrable.** Dans le dossier de production, `outputs/19-41_Paris-Braise_R05.mp4` fait 4 165 902 octets. Empreinte SHA-256 : `6036c1204983e53248e3def23afdb913724b2cbf7a47db8c3bc22f7bbc141872`. Vidéo H.264 de 16,000 s, 854 × 480 à 30 i/s, audio AAC stéréo 48 kHz. Le raccord des neuf dernières images utilise la capture du véritable bureau. Six prises de son enregistrées couvrent la porte, les pas, la chaise, le bouton, le démarrage et les foyers extérieurs.

**Contrôles de la copie livrée.** Décodage intégral FFmpeg sans erreur. Chrome a lu 16 s, décodé les 480 images et la piste audio, et signalé zéro image perdue. Inspection visuelle d’un échantillon toutes les demi-secondes et des trois gestes en gros plan lors de la fabrication. Son mesuré à −23 LUFS intégrés, crête vraie à −1,6 dB. Clic programmé à 12,00 s pour l’image 361, démarrage à 12,08 s. Similarité SSIM du dernier cadre avec la capture redimensionnée du bureau : 0,9814. L’écoute subjective et l’appréciation du naturel des gestes restent à valider avec le propriétaire.

**Géométrie.** Les mesures Blender sur la main déformée donnent 0,15 mm d’écart à plusieurs images de maintien sur la poignée, l’accoudoir et le bouton. Sur 480 positions, les distances minimales du point de vue sont 23,2 cm à la porte, 52,4 cm au fauteuil et 32,7 cm à la table. Le contrôle porte sur la caméra et sur les contacts échantillonnés de la main. Le personnage entier reste hors champ.

**Fichiers.** Les révisions R01 à R05 et la bibliothèque de huit collections sont dans `assets/cinematic/blender/`. La scène retenue pour la revue est `19-41_braise_r05.blend`, toutes ses images sont emballées. Les images de rendu se trouvent dans `assets/cinematic/braise-r05/`, les bruitages et le mix dans `assets/cinematic/audio/`. Les scriptages de contact et de finition sont dans `scripts/seat_contacts.py` et `scripts/finish_braise.py`. Les cinq références visuelles privées restent dans le dossier d’origine DA Game.

**Reconstruction en cas de besoin.** Utiliser `python scripts/assemble_braise.py film.mp4 --revision r05` depuis le dépôt avec FFmpeg installé. Contrôler la lecture avec `node scripts/check_review_video.mjs film.mp4`. En cas de PNG réellement manquant, ouvrir la scène R05 dans Blender 5.2.2 et rendre les seuls numéros concernés.

## Historique du 24 novembre

Dernière mise à jour : 24 novembre 2026 — prévisualisation Blender 480p prête pour validation
Branche de production : `main`
Version de référence précédente : `9436e8c` — `feat: render archive footage in 3d and document status`

## Correction prioritaire actuelle

- Cause réelle du bureau non cliquable identifiée : `#window-layer`, placé après les icônes et couvrant tout le bureau, interceptait les entrées souris réelles même lorsqu’il était vide. Les anciens tests déclenchaient directement `dblclick` en JavaScript et ne reproduisaient pas ce blocage.
- Correctif appliqué : le calque de fenêtres ignore désormais les événements, tandis que ses fenêtres enfants les reçoivent normalement.
- Correction validée dans Chrome avec de véritables entrées souris : sélection simple, double-clic, Entrée, déplacement, réduction, restauration, maximisation, fermeture et coexistence de plusieurs fenêtres.
- Aucun calque de cinématique, canvas WebGL ou élément transparent ne reste dans la chaîne de ciblage après la transition.

## Prévisualisation Blender — prête pour validation

- Blender 5.2.2 LTS portable vérifié sur la RTX 3060 12 Go.
- Scène source `assets/cinematic/blender/19-41_intro_preview.blend` construite et ressources emballées.
- Quatre rendus Blender 1440 × 810 produits : main/poignée, pièce blanche, fenêtre/Paris et vue assise.
- Lampe, bureau et fauteuil Poly Haven CC0 intégrés ; Marble020 ambientCG CC0 adapté à 3 % ; main anatomique CC0 intégrée.
- La référence TurboSquid 1480337 reste exclue : fiche bloquée par anti-robot et gratuité non vérifiable. Un ordinateur proxy explicitement nommé est présent uniquement pour valider le cadrage.
- `ART_DIRECTION.md`, `ASSET_LIBRARY.md`, `CINEMATIC_STANDARDS.md` et `AGENTS.md` définissent désormais les règles permanentes.
- Les quatre cadrages fixes ont été validés comme base technique et mobilier ; la qualité graphique doit encore être relevée avant validation finale.
- Un panorama parisien apocalyptique original a été produit et sauvegardé dans `assets/cinematic/source_assets/generated/paris_apocalypse_panorama.png` : Paris identifiable, ville intacte, foyers dispersés et fumées, sans texte ni marque.
- La scène Blender existante a été conservée et prolongée dans `assets/cinematic/blender/19-41_intro_animation_preview.blend`.
- Le proxy d’ordinateur non vérifié a été supprimé et remplacé par le laptop Innerscene CC0 à échelle réelle.
- Poignée longue, doigts riggés, ouverture de porte, caméra subjective, regard vers Paris, déplacement du fauteuil, assise, allumage et raccord écran sont animés sur 336 images.
- Quatre enregistrements CC0 sont synchronisés : porte/poignée, pas, fauteuil et démarrage informatique.
- La copie de revue `assets/cinematic/previews/19-41_intro_preview_480p.mp4` est terminée : 854 × 480, 24 i/s, 14,00 s, H.264 + AAC, 1 970 427 octets.
- La cinématique publique et la direction artistique du faux Windows restent inchangées.

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
- Contrôle Blender de huit images de contact : poignée, prise, porte ouverte, fenêtre/Paris, fauteuil, assise, ordinateur et raccord écran.
- Décodage intégral de la prévisualisation par FFmpeg : réussi sans erreur.
- `ffprobe` : durée 14,000 s ; vidéo H.264 854 × 480 à 24 i/s ; audio AAC mono 48 kHz.
- Décodage de la scène sauvegardée par Blender 5.2.2 : 336 images, 854 × 480, 24 i/s, 62 objets.
- Suite automatisée du jeu après ajout des sources Blender : **45/45 tests réussis** ; aucun fichier du faux Windows ou de la logique de jeu n’a été modifié.

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

Faire valider la copie de revue 480p par l’utilisateur. Après validation seulement, produire le master WebM/Opus et remplacer l’ancienne cinématique publique sans modifier le faux Windows.
