# Add-ons pour Tanoth Legends 3D

[![Validation des add-ons](https://github.com/moonyflash-ui/Add-ons-games-TanothLegends3D/actions/workflows/validate-addons.yml/badge.svg)](https://github.com/moonyflash-ui/Add-ons-games-TanothLegends3D/actions/workflows/validate-addons.yml)
[![Licence GPL-2.0](https://img.shields.io/badge/licence-GPL--2.0-blue.svg)](LICENSE)

Collection d’add-ons pour **Tanoth Legends 3D**. Ces extensions améliorent l’interface, le monde 3D, le suivi des quêtes et l’analyse des combats sans donner accès aux sauvegardes ni aux services privés du launcher.

## Catalogue

| Add-on | Version | Fonction principale |
| --- | ---: | --- |
| [`atlas-navigator`](atlas-navigator/) | 2.0.0 | Carte universelle zoomable avec régions, zones, quêtes, favoris, coordonnées libres et publication d’itinéraires. |
| [`atlas-route-guide`](atlas-route-guide/) | 1.0.0 | Guide de terrain dépendant d’Atlas Navigator : flèche, cap, distance, danger, territoire adverse et arrivée. |
| [`dark-fantasy-hud`](dark-fantasy-hud/) | 3.0.0 | HUD Dark Fantasy complet avec portrait 3D, mini-carte ronde ou carrée, flèche joueur, Moral par cases, armes, XP et suivis d’événements configurables. |
| [`dark-fantasy-world`](dark-fantasy-world/) | 2.0.0 | Dark Fantasy confortable : lumière adaptative, brume maîtrisée et relief 3D doux des personnages. |
| [`kikimeter`](kikimeter/) | 1.0.0 | Dégâts infligés et subis, DPS, soins donnés et reçus, sursoins et résurrections par combat. |
| [`quest-helper`](quest-helper/) | 2.0.0 | Optimise la quête à suivre et synchronise automatiquement son itinéraire avec Atlas Navigator et Atlas Route Guide. |
| [`timekeeper-hud`](timekeeper-hud/) | 1.0.0 | Heure locale IRL, heure du monde et FPS réels dans un affichage compact qui ne masque pas l’action. |
| [`exemple-hud`](exemple-hud/) | 1.0.0 | Exemple minimal pour apprendre à créer un add-on de HUD. |

## Installation

1. Téléchargez le dépôt avec **Code → Download ZIP**.
2. Décompressez l’archive.
3. Copiez le dossier de chaque add-on souhaité dans le dossier `Add-ons` de Tanoth Legends 3D.
4. Vérifiez que le chemin ressemble à `TanothLegends3D/Add-ons/quest-helper/addon.json` et qu’il n’existe pas de dossier intermédiaire supplémentaire.
5. Lancez le jeu depuis son launcher ou avec Electron.
6. Ouvrez **Add-ons communautaires**, activez les extensions et utilisez **Ouvrir** pour afficher leur panneau de configuration.

Version minimale actuellement requise : **Tanoth Legends 3D 41.0**.

## Utilisation

### Atlas Navigator

Utilisez la molette ou les boutons `+` et `−` pour zoomer, puis faites glisser la carte pour la déplacer. Recherchez une région, une zone, une capitale, un village ou une quête, choisissez des coordonnées X/Z et conservez vos favoris. La carte trace l’itinéraire, estime le danger et publie la destination pour le guide complémentaire.

### Atlas Route Guide

Activez-le avec Atlas Navigator pour conserver une flèche compacte pendant vos déplacements. Sa dépendance à `atlas-navigator` 2.0 est déclarée dans son manifeste : le jeu charge la carte en premier et l’active automatiquement si nécessaire.

### Dark Fantasy HUD

Active un nouveau HUD pour le joueur et son familier, des cadres de groupe et de raid, une barre de compétences remaniée, la progression d’expérience mieux centrée et une mini-carte ronde par défaut ou carrée au choix. Le joueur est représenté par une flèche orientée et une destination Atlas apparaît directement sur la mini-carte.

Les suivis **Failles du néant** et **Cimetières / Porte de la mort** sont masqués par défaut et peuvent être réactivés depuis le panneau. Les ensembles **Armes I** et **Armes II** sont espacés et harmonisés avec le style Dark Fantasy. Le Moral utilise des cases avec infobulles : un Boss ou une Élite donne `+5 %`. Une mort retire `−15 %` uniquement en Veteran, HellMode et Legends ; le mode normal conserve seulement le Moral positif.

Le HUD charge automatiquement `timekeeper-hud`, sa dépendance d’affichage compacte.

### Dark Fantasy World

Applique au moteur 3D une palette sombre plus douce, un éclairage chaud/froid équilibré, une brume réglable et un relief visuel pour mieux détacher les personnages du décor. Trois profils sont disponibles : **Confort** recommandé, **Immersif** et **Performance**. La lumière anti-fatigue et le relief 3D peuvent être désactivés séparément.

### KikiMeter

Ouvrez son panneau pendant un combat pour consulter les dégâts, le DPS, les soins et les résurrections. Une nouvelle rencontre est créée après une période d’inactivité. Les dix dernières rencontres sont conservées dans le stockage privé de l’add-on.

### Quest Helper

Choisissez **Plus rentable**, **Plus proche** ou **Déjà suivie**. La meilleure quête devient automatiquement le point de repère du journal et la destination de la suite Atlas. Activer Quest Helper charge automatiquement Atlas Route Guide, qui charge à son tour Atlas Navigator : le classement, la carte et la flèche de terrain restent ainsi synchronisés.

### Heure & FPS

`timekeeper-hud` affiche séparément l’heure locale réelle, l’heure de Tanoth et les FPS mesurés par le moteur 3D. Chaque donnée peut être masquée, les secondes sont optionnelles et le bloc peut être placé en bas à droite, en bas au centre ou en haut au centre.

## Créer un add-on

Chaque add-on doit vivre dans un dossier portant exactement son identifiant :

```text
mon-addon/
├── addon.json
├── main.js
└── style.css
```

Exemple de manifeste :

```json
{
  "id": "mon-addon",
  "name": "Mon add-on",
  "version": "1.0.0",
  "apiVersion": 1,
  "minGameVersion": "41.0",
  "entry": "main.js",
  "styles": ["style.css"],
  "assets": [],
  "permissions": ["game.read", "ui", "storage"],
  "dependencies": [
    { "id": "autre-addon", "minVersion": "1.0.0", "required": true }
  ],
  "author": "Votre nom",
  "description": "Description courte",
  "enabledByDefault": false
}
```

Enregistrement minimal :

```js
TanothAddon.register({
  async activate(api) {
    const state = await api.game.getState()
    document.body.textContent = `${state.identity.tag} — ${state.player.hp} PV`
    await api.ui.show()
  }
})
```

Permissions acceptées :

- `game.read` : lecture de l’état public et des événements du jeu ;
- `game.actions` : demandes d’actions autorisées par le jeu ;
- `ui` : fenêtre et notifications de l’add-on ;
- `storage` : réglages privés et isolés.

Les add-ons n’ont pas accès à Node.js, aux fichiers du joueur, aux sauvegardes, aux clés du launcher ni aux données des autres add-ons.

Le champ optionnel `dependencies` permet de construire plusieurs add-ons complémentaires sans recopier leur logique. Chaque dépendance requise est vérifiée, activée et chargée avant l’add-on qui l’utilise.

## Ajouter ou mettre à jour un add-on

1. Ajoutez ou modifiez son dossier sans inclure de sauvegardes, journaux ou dépendances locales.
2. Incrémentez la version dans `addon.json`.
3. Lancez la validation locale :

```bash
node tools/validate-addons.mjs
```

4. Créez un commit et envoyez-le sur GitHub. La même validation est exécutée automatiquement à chaque push et pull request.

## Licence

Ce dépôt est distribué sous licence [GNU GPL version 2](LICENSE).
