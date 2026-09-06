# Add-ons pour Tanoth Legends 3D

[![Validation des add-ons](https://github.com/moonyflash-ui/Add-ons-games-TanothLegends3D/actions/workflows/validate-addons.yml/badge.svg)](https://github.com/moonyflash-ui/Add-ons-games-TanothLegends3D/actions/workflows/validate-addons.yml)
[![Licence GPL-2.0](https://img.shields.io/badge/licence-GPL--2.0-blue.svg)](LICENSE)

Collection d’add-ons pour **Tanoth Legends 3D**. Ces extensions améliorent l’interface, le monde 3D, le suivi des quêtes et l’analyse des combats sans donner accès aux sauvegardes ni aux services privés du launcher.

## Catalogue

| Add-on | Version | Fonction principale |
| --- | ---: | --- |
| [`dark-fantasy-hud`](dark-fantasy-hud/) | 2.0.0 | HUD Dark Fantasy complet avec portrait réel du personnage 3D équipé, familier, groupe/raid, compétences, XP et mini-carte carrée. |
| [`dark-fantasy-world`](dark-fantasy-world/) | 1.0.0 | Ambiance médiévale Dark Fantasy pour les décors, ennemis, personnages, villages, villes et capitales. |
| [`kikimeter`](kikimeter/) | 1.0.0 | Dégâts infligés et subis, DPS, soins donnés et reçus, sursoins et résurrections par combat. |
| [`quest-helper`](quest-helper/) | 1.1.0 | Sélection de la quête la plus rentable ou la plus proche, flèche, cap, distance, trajet estimé, progression et arrivée. |
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

### Dark Fantasy HUD

Active un nouveau HUD pour le joueur et son familier, des cadres de groupe et de raid, une barre de compétences remaniée, la progression d’expérience et une mini-carte carrée. Le portrait est capturé directement depuis le modèle 3D équipé dans le monde du jeu.

### Dark Fantasy World

Applique au moteur 3D une palette sombre, une brume renforcée, un éclairage médiéval et des matériaux adaptés. Trois profils de qualité sont disponibles : `cinematic`, `balanced` et `performance`.

### KikiMeter

Ouvrez son panneau pendant un combat pour consulter les dégâts, le DPS, les soins et les résurrections. Une nouvelle rencontre est créée après une période d’inactivité. Les dix dernières rencontres sont conservées dans le stockage privé de l’add-on.

### Quest Helper

Choisissez **Plus rentable**, **Plus proche** ou **Déjà suivie**. La meilleure quête devient automatiquement le point de repère du journal. La flèche indique le cap, l’angle, la distance, le temps de trajet estimé et signale l’arrivée à l’objectif.

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
