# 19:41 — Saison 1

ARG narratif solo bilingue jouable dans le navigateur. En 2129, un journaliste utilise un ordinateur reconstitué pour enquêter sur la disparition de Marianne Dumas, aide à domicile du quartier expérimental A-17, survenue un siècle plus tôt à 19 h 41.

**Jouer : [orivexapro.github.io/19-42-arg](https://orivexapro.github.io/19-42-arg/)**

## Expérience intégrée

- introduction animée et transition immersive vers un bureau inspiré des systèmes modernes ;
- explorateur, bloc-notes sauvegardé, calculatrice, corbeille, paramètres rapides, Wi‑Fi, mode avion, barre des tâches et fenêtres persistantes ;
- clé USB `2311`, sceau gouvernemental à reconstituer, matrice `2727`, restauration réseau et maintenance confidentielle ;
- navigateur fictif à onglets et Cloud reconstitué sans accès au véritable Internet ;
- magazine Télé Hebdomadaire de huit pages, feuilletable et zoomable ;
- lecteur commun avec progression, volume, plein écran, retour, image par image, vitesse ×0,05 à ×2, amplification, luminosité et contraste ;
- vidéos animées rétro : arrivée chez André, coupure volontaire, cuisine de Marianne, appel et objet perdu du technicien ;
- atlas mondial caché après onze bascules du mode avion et dossier Honduras ;
- rapport final local acceptant différentes formulations françaises et anglaises ;
- sauvegarde LocalStorage, reprise de partie, aide immersive après inactivité et teaser 19:42 sans révélation réservée.

## Vérifier

Node.js 18 ou plus récent suffit. Aucune dépendance à installer et aucune API payante.

```bash
npm run dev
npm test
npm run check
```

Le site est statique et déployé par GitHub Actions vers GitHub Pages.

## Commercialisation

Le prototype ne contient volontairement ni paiement ni authentification. Une future commercialisation doit placer les fichiers protégés et la vérification des droits derrière un serveur (par exemple Supabase avec règles d’accès et Stripe Checkout). Un contrôle uniquement exécuté dans le navigateur ne constitue pas une protection commerciale.

Le dépôt public expose nécessairement les codes, les réponses, les documents et les dialogues dans les sources. Avant toute vente, le dépôt devrait devenir privé ou ne conserver qu’un client dépourvu des contenus protégés ; les secrets de la saison 2 ne doivent jamais être ajoutés à cette branche publique.
