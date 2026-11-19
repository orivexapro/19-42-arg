# 19:41 — prototype ARG solo

Premier prototype jouable d’un ARG narratif dans lequel une journaliste du futur explore une clé USB à travers un PC de 2025–2035 reconstitué.

**Jouer en ligne : [orivexapro.github.io/19-42-arg](https://orivexapro.github.io/19-42-arg/)**

## Jouer

1. Installer Node.js 18 ou plus récent.
2. Dans ce dossier, lancer `npm run dev`.
3. Ouvrir `http://localhost:4173`.

Aucune installation de dépendance n’est nécessaire. La progression, le pense-bête et l’historique des transmissions sont enregistrés dans le navigateur.

## Parcours conseillé

- Double-cliquer sur **Ce PC**.
- Retrouver le code de la clé **ARCHIVE_M (E:)** grâce aux notes présentes sur le PC.
- Explorer les archives et recouper les manipulations avec les documents.
- Rédiger librement ses conclusions dans **Pense-bête**.
- Cliquer sur **Transmettre à la rédaction** pour obtenir un bilan.

Le bouton **Démarrer → Arrêter** sauvegarde et ferme seulement la session : il ne termine pas l’enquête.

## Fonctionnalités du prototype

- bureau inspiré de Windows 11, menu Démarrer et fenêtres déplaçables, réductibles et restaurables ;
- barre des tâches dynamique qui conserve les applications et leur contenu ;
- explorateur de fichiers et clé USB verrouillée par un pavé numérique compatible clavier ;
- huit énigmes intégrées : code USB, photographie déchirée, message chiffré, jeu des différences, chronologie, analyse audio, fichier corrompu et dossier protégé ;
- documents, journaux, photographies et enregistrement sonore originaux ;
- calculatrice fonctionnelle ;
- pense-bête libre avec sauvegarde automatique ;
- analyse locale tolérant plusieurs formulations et les négations courantes ;
- bilan uniquement après confirmation d’envoi ;
- questions d’orientation sans révéler les réponses ;
- reprise de l’enquête et historique des tentatives ;
- extinction et reprise de session.

## Vérification

```bash
npm test
npm run check
```

## Choix techniques

HTML, CSS et JavaScript natifs, sans service payant ni appel à une IA. Le moteur de correction reste volontairement local et transparent dans `evaluator.js` pour ce premier jet.

Les visuels d’archive, le fond d’écran et l’enregistrement sonore ont été créés spécialement pour ce prototype.

## Avertissement

Windows est une marque de Microsoft. Ce projet est une œuvre fictionnelle indépendante et n’utilise aucun code ni aucune ressource officielle de Windows.

