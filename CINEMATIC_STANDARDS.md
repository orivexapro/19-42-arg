# Normes de production des cinématiques — 19:41

## Pipeline obligatoire

1. Lire `ART_DIRECTION.md`, `ASSET_LIBRARY.md` et ce document.
2. Vérifier chaque licence avant téléchargement ou import.
3. Construire ou modifier la scène dans Blender.
4. Vérifier l’échelle, les collisions, la lumière et les mouvements.
5. Produire quatre images fixes de validation.
6. Attendre une validation explicite.
7. Seulement ensuite, animer, sonoriser et rendre la vidéo complète.
8. Tester le WebM dans le navigateur et vérifier que sa fin libère totalement le bureau interactif.

## Paramètres de référence

- Blender : 5.2.2 LTS ou version LTS compatible.
- Moteur de prévisualisation : Eevee.
- Gestion colorimétrique : AgX, contraste moyen-haut.
- Cadence finale de référence : 30 images/seconde.
- Copie de revue économique autorisée : 24 images/seconde, 336 images, soit 14 secondes en 854 × 480.
- Prévisualisations : PNG 1440 × 810.
- Format de revue : MP4 H.264/AAC local. Format final prévu après validation : WebM VP9, audio Opus, dimensions adaptées au navigateur.
- Tous les chemins doivent être relatifs ou les ressources emballées dans le `.blend`.
- Les sources Blender et scripts reproductibles doivent être conservés.

## Découpage de l’introduction

- Images 1–90 : approche, prise, abaissement de la béquille, ouverture et relâchement.
- Images 91–180 : entrée dans la pièce et marche vers le bureau.
- Images 181–300 : prise du fauteuil, déplacement et installation.
- Images 301–360 : allumage de l’ordinateur.
- Images 361–450 : rapprochement de l’écran et raccord avec le bureau interactif.

## Animation

- Caméra strictement subjective.
- Main riggée avec cinq doigts, poignet et articulations.
- Les doigts enveloppent la béquille sans traverser le métal ni la porte.
- La poignée s’abaisse avant la rotation de la porte.
- Le fauteuil est déplacé physiquement avant l’assise.
- La caméra suit les variations de hauteur du corps sans interpolation flottante.
- Les collisions doivent être examinées image par image aux contacts main/poignée, main/fauteuil et corps/fauteuil.

## Son

- Utiliser uniquement des enregistrements réels avec licence commerciale vérifiée.
- Synchroniser chaque transitoire avec l’image correspondante.
- Éviter les boucles courtes perceptibles et les niveaux disproportionnés.
- Garder l’ambiance extérieure discrète et filtrée par la fenêtre.

## Intégration web

- La vidéo ne doit pas charger depuis un service externe.
- Prévoir un bouton de passage et respecter le réglage muet.
- À la fin ou lors du passage, retirer le lecteur, son calque et tous leurs gestionnaires d’événements.
- Vérifier avec de véritables clics que les icônes du bureau sont immédiatement accessibles.
- Conserver un poster léger et un repli si la lecture automatique est refusée.

## Contrôle qualité minimal

- Aucun visage interdit visible.
- Aucun élément Lego, Minecraft, voxel ou cartoon.
- Aucun objet non demandé dans l’appartement.
- Aucun asset sans licence documentée.
- Aucun croisement de géométrie visible.
- Aucun rendu vidéo complet avant validation des quatre images.
