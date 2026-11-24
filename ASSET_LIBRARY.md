# Bibliothèque de ressources — 19:41

Toutes les ressources doivent être locales au moment du rendu et compatibles avec une exploitation commerciale. Aucun achat ne doit être déclenché.

## Ressources validées

| Ressource | Source | Licence | État | Usage |
|---|---|---|---|---|
| Industrial Pipe Lamp | https://polyhaven.com/a/industrial_pipe_lamp | CC0 1.0 | Intégrée, version Blender 1K | Lampe du bureau |
| Wooden Table 01 | https://polyhaven.com/a/WoodenTable_01 | CC0 1.0 | Intégrée, version Blender 1K | Bureau, hauteur adaptée |
| Modern Arm Chair 01 | https://polyhaven.com/a/modern_arm_chair_01 | CC0 1.0 | Intégrée, version Blender 1K | Fauteuil mobile |
| Marble020 | https://ambientcg.com/view?id=Marble020 | CC0 1.0 | Intégré en 1K, influence réduite à 3 % | Micro-variation des murs blancs |
| Posable anatomical right hand | https://www.innerscene.com/tools/library/3d-parts/posable-anatomical-right-hand-f6098b4f | CC0 1.0 | Intégrée, seize os | Main subjective |

Poly Haven indique explicitement la licence CC0 sur chaque fiche. ambientCG publie l’ensemble de ses ressources sous CC0, y compris pour un usage commercial. Le modèle de main provient d’une base anatomique MakeHuman/MPFB publiée sous CC0.

## Ressource bloquée

| Ressource | Source | État | Décision |
|---|---|---|---|
| Desktop + keyboard, produit 1480337 | https://www.turbosquid.com/fr/3d-models/desktop-keyboard-3d-1480337 | La fiche est protégée par un anti-robot ; prix, téléchargement et licence exacte non vérifiables automatiquement | Aucun achat et aucune intégration. Le fichier Blender contient un proxy clairement nommé `PROXY_COMPUTER_TURBOSQUID_LICENSE_UNVERIFIED`. Il devra être remplacé avant le rendu vidéo final. |

## Organisation locale

- `assets/cinematic/source_assets/polyhaven/` : modèles et textures Poly Haven 1K.
- `assets/cinematic/source_assets/ambientcg/` : matériau mural de référence.
- `assets/models/hand-posable.glb` : main anatomique.
- `assets/cinematic/blender/19-41_intro_preview.blend` : scène Blender emballée.
- `assets/cinematic/previews/` : quatre images de validation.
- `scripts/download_cinematic_assets.ps1` : récupération reproductible des ressources CC0.
- `scripts/build_blender_previews.py` : reconstruction et rendu des prévisualisations.

## Ressources sonores à acquérir après validation

Les sons finaux devront être des enregistrements réels sous CC0 ou licence commerciale explicite :

- poignée métallique ;
- ouverture de porte intérieure ;
- pas sur sol dur ;
- déplacement et poids du fauteuil ;
- installation dans le fauteuil ;
- démarrage d’ordinateur ;
- ambiance urbaine lointaine avec incendies étouffés.

Chaque fichier devra être accompagné de son URL source, de sa licence, de la date de récupération et de la preuve de compatibilité commerciale. Aucun son synthétique provisoire ne doit être conservé dans la vidéo finale.
