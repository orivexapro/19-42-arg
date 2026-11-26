# Bibliothèque de ressources — 19:41

## Révision du 26 novembre

Les cinq images fournies servent uniquement à la direction artistique, en consultation privée. Le panorama de production original est `assets/cinematic/source_assets/generated/paris-braise.png`, généré avec l'outil intégré sur description textuelle. Les modèles Poly Haven et Innerscene ci-dessous sont conservés. L'ancien effet de démarrage de Zeraora est un traitement de données numériques, pas une prise de son de machine.

Toutes les ressources doivent être locales au moment du rendu et compatibles avec une exploitation commerciale. Aucun achat ne doit être déclenché.

## Ressources validées

| Ressource | Source | Licence | État | Usage |
|---|---|---|---|---|
| Industrial Pipe Lamp | https://polyhaven.com/a/industrial_pipe_lamp | CC0 1.0 | Intégrée, version Blender 1K | Lampe du bureau |
| Wooden Table 01 | https://polyhaven.com/a/WoodenTable_01 | CC0 1.0 | Intégrée, version Blender 1K | Bureau, hauteur adaptée |
| Modern Arm Chair 01 | https://polyhaven.com/a/modern_arm_chair_01 | CC0 1.0 | Intégrée, version Blender 1K | Fauteuil mobile |
| Marble020 | https://ambientcg.com/view?id=Marble020 | CC0 1.0 | Intégré en 1K, influence réduite à 3 % | Micro-variation des murs blancs |
| Posable anatomical right hand | https://www.innerscene.com/tools/library/3d-parts/posable-anatomical-right-hand-f6098b4f | CC0 1.0 | Intégrée, seize os | Main subjective |
| Laptop 15.6 inch, open | https://www.innerscene.com/tools/library/3d-parts/laptop-15-6-inch-open-c70532c1 | CC0 1.0 | Intégré à échelle réelle, SHA-256 `3e7cfa3f8fdc9050fc08838aeffc0c443de7bf9e2afb53abb9c4d7aee3e8eb66` | Ordinateur, clavier et pavé tactile |
| Panorama Paris apocalyptique | Création originale OpenAI ImageGen, prompt de production archivé dans l’historique du projet | Ressource originale du projet | Intégré localement | Vue extérieure, tour Eiffel, incendies et fumées |

Poly Haven indique explicitement la licence CC0 sur chaque fiche. ambientCG publie l’ensemble de ses ressources sous CC0, y compris pour un usage commercial. Le modèle de main provient d’une base anatomique MakeHuman/MPFB publiée sous CC0.

## Ressource remplacée

| Ressource | Source | État | Décision |
|---|---|---|---|
| Desktop + keyboard, produit 1480337 | https://www.turbosquid.com/fr/3d-models/desktop-keyboard-3d-1480337 | Licence non vérifiable automatiquement | Exclu définitivement. Le proxy a été supprimé et remplacé par le laptop Innerscene CC0 ci-dessus. |

## Bruitages enregistrés de la prévisualisation

| Son | Source | Licence | Synchronisation |
|---|---|---|---|
| Porte et poignée enregistrées | https://freesound.org/people/Sadiquecat/sounds/868519/ | CC0 1.0 | Préhension et ouverture |
| Pas intérieurs enregistrés | https://freesound.org/people/soundandmelodies/sounds/776197/ | CC0 1.0 | Entrée et marche vers le bureau |
| Fauteuil déplacé enregistré | https://freesound.org/people/Vrymaa/sounds/802694/ | CC0 1.0 | Déplacement et installation |
| Démarrage informatique | https://freesound.org/people/Zeraora/sounds/572773/ | CC0 1.0 | Allumage de l’écran |

Les fichiers utilisés sont les aperçus haute qualité officiels de Freesound, conservés localement dans `assets/cinematic/audio/source/`. Ils sont intégrés à la copie de revue MP4 ; aucun son procédural n’y est utilisé.

## Organisation locale

- `assets/cinematic/source_assets/polyhaven/` : modèles et textures Poly Haven 1K.
- `assets/cinematic/source_assets/ambientcg/` : matériau mural de référence.
- `assets/models/hand-posable.glb` : main anatomique.
- `assets/cinematic/blender/19-41_intro_preview.blend` : scène Blender emballée.
- `assets/cinematic/blender/19-41_intro_animation_preview.blend` : scène animée emballée, 336 images à 24 i/s.
- `assets/cinematic/previews/` : quatre images de validation.
- `assets/cinematic/previews/19-41_intro_preview_480p.mp4` : copie de revue H.264/AAC de 14 secondes.
- `scripts/download_cinematic_assets.ps1` : récupération reproductible des ressources CC0.
- `scripts/build_blender_previews.py` : reconstruction et rendu des prévisualisations.

## Copie de revue Braise à 30 i/s

Le moteur, le clic et le feu proviennent de trois prises supplémentaires sous CC0. Le mix utilise réellement ces enregistrements et les prises de porte, de pas et de fauteuil ci-dessus. La prise industrielle Zeraora reste réservée à l’archive 24 i/s.

| Prise | Auteur et source | Utilisation |
|---|---|---|
| boot286.mp3 | [facuarmo, Freesound 482270](https://freesound.org/people/facuarmo/sounds/482270/) | Mise en route du PC |
| power-click.mp3 | [ccovi, Freesound 718693](https://freesound.org/people/ccovi/sounds/718693/) | Pression de l’index |
| exterior-embers.mp3 | [KVV_Audio, Freesound 714776](https://freesound.org/people/KVV_Audio/sounds/714776/) | Feu extérieur, passe-bas et position latérale |

La bibliothèque 19-41_bibliotheque_braise.blend contient huit collections réutilisables avec leurs enfants, matériaux et animations. Ajouter par collection dans Blender. Les prises et actions proviennent d’une copie de revue en attente de validation artistique.
