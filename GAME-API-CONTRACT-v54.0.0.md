# Contrat Add-ons demandé à TanothLegends3D v54

Ce document est un handoff vers la tâche du jeu. Il ne demande aucune modification du cœur depuis le dépôt Add-ons.

## Priorité 0 — Corriger l’identité de version

La construction officielle contient `package.json` en `54.0.0`, mais `Tanoth-Addons-UI.js` fixe encore `GAME_VERSION = '41.0'`.

Comportement attendu :

- lire la version depuis la source de version unique utilisée pour construire la release ;
- exposer exactement `54.0.0` dans `TanothAddons.gameVersion` ;
- conserver la comparaison sémantique de `minGameVersion` ;
- ajouter un test de packaging qui échoue si la version du paquet et celle du pont diffèrent.

Critère d’acceptation : un manifeste de test avec `minGameVersion: 54.0.0` s’active dans la release v54, tandis qu’un manifeste demandant `54.0.1` est refusé clairement.

## Priorité 0 — Exposer les capacités

L’API 1 expose aujourd’hui `getState`, `action`, `on`, `off` et `once`, mais aucun add-on ne peut savoir si une action, un événement ou un champ existe avant de l’utiliser.

Ajouter une lecture immuable, par exemple `api.game.getCapabilities()`, qui retourne au minimum :

```js
{
  apiVersion: 1,
  gameVersion: '54.0.0',
  state: ['player', 'companion', 'social.group', 'social.raid', 'world', 'quests', 'navigation.atlas', 'performance'],
  events: ['state', 'meter', 'atlas:route'],
  actions: [
    'applyHudPreset', 'applyWorldPreset', 'applyTimekeeperOverlay',
    'applyQuestHelper', 'applyEventSentinelHud', 'publishAtlasRoute',
    'openAddon', 'toggleMainMenu', 'useSkillSlot', 'usePotion',
    'selectMapMode', 'openWindow'
  ]
}
```

Le registre doit être généré depuis les branchements réellement disponibles, pas maintenu comme une deuxième liste manuelle.

Critères d’acceptation :

- un add-on vérifie ses capacités avant de créer une surcouche ;
- une capacité absente produit un message clair dans le gestionnaire et un journal ;
- l’échec d’un add-on ne bloque jamais l’activation des add-ons indépendants ;
- une dépendance en erreur empêche seulement ses dépendants de démarrer.

## Priorité 1 — Données nécessaires au HUD Dark Fantasy

Le HUD IV actuel couvre le joueur, le familier de base, le groupe/raid, le chat, la mini-carte, l’XP, les armes, le moral et les événements. Les blocs suivants ne peuvent pas être finalisés proprement avec l’état public actuel.

### Cible et focus

Ajouter `target` et `focus` dans l’état public :

```js
{
  id, name, kind, level, hostile, elite, boss, dead,
  hp, maxHp, mana, maxMana, distance,
  cast: { id, name, startedAt, endsAt, interruptible }
}
```

Ajouter les événements `target:changed`, `focus:changed` et `cast:changed`, ou garantir que leurs changements déclenchent immédiatement `state`.

### Joueur, familier, groupe et raid

Ajouter :

- effets positifs et négatifs avec identifiant, nom, icône, charges et expiration ;
- incantation du joueur ;
- position ou distance du familier, sa cible et son état hors de portée ;
- pour chaque membre de groupe/raid : rôle, connecté, mort/à terre, distance, position, PV/mana et effets utiles au HUD ;
- événements précis ou une fréquence d’état documentée pour les changements rapides de combat.

### Barre de compétences et armes I/II

Ajouter un état public des emplacements :

```js
{
  slot, skillId, name, icon, keybind, usable,
  cooldownStartedAt, cooldownEndsAt, charges, maxCharges,
  resourceCost, inRange, activeWeaponSet
}
```

Prévoir un événement `actionbar:changed` et garder `useSkillSlot` comme action contrôlée. Exposer les deux ensembles d’armes avec leurs noms, icônes et état actif.

### Mini-carte et navigation

Conserver la position et la rotation du joueur, puis ajouter :

- zone/région normalisée avec identifiants ;
- marqueurs visibles et filtrables : groupe, raid, quête, événement, ville, village et capitale ;
- limites ou projection documentée entre coordonnées du monde et carte ;
- destination, distance, cap et arrivée dans `navigation` ;
- flèche du joueur orientée, distincte d’un simple point.

### Moral et démoralisation

Les règles de jeu doivent rester dans le cœur, l’add-on ne faisant qu’afficher le résultat. Publier :

```js
{
  score, tier, difficulty, positiveOnly,
  healthModifier, manaModifier,
  lastReason, updatedAt
}
```

Règles attendues à tester côté jeu :

- Normal : moral positif cumulable, aucune démoralisation ;
- Veteran, Hellmode, Legends : boss/élite tué `+5 %`, mort `-15 %`, cumul autorisé ;
- les malus de vie et mana proviennent du cœur et sont reflétés dans l’état public ;
- un événement `morale:changed` indique la valeur précédente, la nouvelle valeur et la raison.

### Réglages HUD et coexistence

Étendre `applyHudPreset` avec des valeurs contrôlées :

- échelle globale ;
- opacité ;
- contraste normal/élevé ;
- mode daltonien (`off`, `protanopia`, `deuteranopia`, `tritanopia`) ;
- verrouillage/déverrouillage des positions ;
- positions normalisées et bornées pour les blocs joueur, cible/focus, familier, groupe/raid, événements, mini-carte et barre d’action.

Chaque surcouche doit avoir un propriétaire. Une désactivation ne doit retirer que les éléments appartenant à cet add-on.

## Recette officielle après raccord

1. Construire une nouvelle archive officielle sans modifier les add-ons.
2. Vérifier taille et SHA-256 de l’archive reçue.
3. Tester installation, découverte, activation, désactivation, dépendances, stockage et redémarrage.
4. Tester les neuf add-ons simultanément.
5. Jouer au moins un scénario dégâts/soins/résurrection pour KikiMeter.
6. Tester une quête active et un trajet inter-faction pour Quest Helper et Atlas.
7. Tester groupe de 5, raid de 12, familier éloigné, cible, focus, recharge, incantation et effets.
8. Tester Normal, Veteran, Hellmode et Legends pour le moral.
9. Capturer les écrans depuis la construction officielle testée.
10. Seulement après réussite, relever les `minGameVersion` et publier la compatibilité v54.

