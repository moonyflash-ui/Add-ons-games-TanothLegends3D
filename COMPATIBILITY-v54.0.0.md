# Audit de compatibilité — TanothLegends3D v54.0.0

Statut : **compatibilité v54 non certifiée**. Les add-ons fonctionnent dans la construction officielle testée, mais le pont Add-ons annonce encore le jeu en version `41.0`. Les manifestes ne doivent donc pas être relevés à `minGameVersion: 54.0.0` avant correction du jeu.

## Construction officielle contrôlée

- Release : `v54.0.0`
- Archive : `TanothLegends3D-Windows-54.0.0.zip`
- Taille contrôlée : `1 602 582 161` octets
- SHA-256 contrôlé : `4E367ED55497B678CC559E86A9074004EFDA57D5221E8A29DA06785CA88D44AE`
- Version du paquet Electron : `54.0.0`
- Version publiée par `TanothAddons.gameVersion` : `41.0` — **anomalie bloquante**
- API Add-ons : `1`

Les fichiers des neuf add-ons inclus dans l’archive officielle sont identiques, octet par octet, à ceux de ce dépôt au commit `c1618b4`.

## Matrice des capacités réellement utilisées

| Add-on | Dépendances | État lu | Événements | Actions | Résultat dans la v54 officielle |
|---|---|---|---|---|---|
| `atlas-navigator` 3.0.0 | — | joueur, monde, quêtes, navigation | `state`, `atlas:route` | `publishAtlasRoute` | Activation, affichage, zoom, rechargement et coexistence validés |
| `atlas-route-guide` 1.0.0 | `atlas-navigator >= 2.0.0` | position, niveau, navigation | `state`, `atlas:route` | `openAddon`, `publishAtlasRoute` | Activation automatique de la dépendance et affichage validés |
| `dark-fantasy-hud` 4.0.0 | `timekeeper-hud >= 1.0.0` | identité, joueur, familier, groupe, raid | `state` | `applyHudPreset` | HUD, chat, menus, mini-carte ronde/carrée et persistance validés |
| `dark-fantasy-world` 2.3.0 | — | — | — | `applyWorldPreset` | Activation, désactivation et coexistence validées |
| `exemple-hud` 1.0.0 | — | identité, joueur | `state` | — | Activation et rafraîchissement validés |
| `kikimeter` 1.0.0 | — | — | `meter` | — | Activation et coexistence validées ; scénarios complets de combat à rejouer après contrat d’événements |
| `quest-helper` 2.0.0 | `atlas-route-guide >= 1.0.0` | joueur, quêtes | `state` | `applyQuestHelper`, `publishAtlasRoute` | Activation et état sans quête validés ; trajet de quête réel à rejouer avec une quête active |
| `rift-death-hud` 1.1.0 | `atlas-navigator >= 3.0.0` | joueur, Failles, invasions, Portes de la Mort | `state` | `applyEventSentinelHud`, `publishAtlasRoute`, `openAddon` | Événements actifs, compteurs, HUD compact et coexistence validés |
| `timekeeper-hud` 1.0.0 | — | heure du monde, performances | `state` | `applyTimekeeperOverlay` | Heure locale, heure de Tanoth, FPS, persistance et redémarrage validés |

## Contrôles exécutés dans l’application officielle

| Contrôle | Résultat |
|---|---|
| Installation dans un dossier Add-ons neuf | Réussi : 9 dossiers, 35 fichiers, aucune erreur, empreintes identiques au paquet |
| Découverte des manifestes | Réussie : 9/9, API 1, permissions acceptées |
| Activation individuelle | Réussie : 9/9 |
| Résolution des dépendances | Réussie : activation automatique d’Atlas et de Timekeeper selon le graphe |
| Activation simultanée | Réussie : 9/9 actifs sans doublon de fenêtre ou de surcouche |
| Rechargement à chaud | Réussi : 9/9, une seule instance par add-on après rechargement |
| Désactivation | Réussie : 9/9, classes, panneaux et surcouches retirés |
| Persistance des réglages | Réussie : mini-carte carrée et réglages HUD conservés |
| Redémarrage de l’application | Réussi : 9/9 réactivés avec le profil de test isolé |
| Isolation d’une incompatibilité | Réussie : l’add-on incompatible et ses dépendants passent en erreur, les autres restent actifs |
| Déclaration honnête `minGameVersion: 54.0.0` | **Échec attendu** : `Erreur : Jeu 54.0.0 minimum requis.` car le pont annonce `41.0` |

Les essais ont utilisé un héros factice dans un profil Electron isolé. Aucune sauvegarde réelle n’a été lue ou modifiée et aucun fichier du jeu officiel n’a été changé.

## Dépendances

```text
atlas-navigator
├─ atlas-route-guide
│  └─ quest-helper
└─ rift-death-hud

timekeeper-hud
└─ dark-fantasy-hud
```

Les quatre autres add-ons sont autonomes : `dark-fantasy-world`, `exemple-hud`, `kikimeter` et `timekeeper-hud`.

## Décision de publication

Ne pas annoncer « compatible v54.0.0 » et ne pas changer les `minGameVersion` tant que les deux conditions suivantes ne sont pas remplies :

1. `TanothAddons.gameVersion` retourne `54.0.0` dans la construction officielle ;
2. un registre de capacités permet de vérifier les champs, événements et actions avant activation.

Le raccord demandé au jeu est décrit dans [GAME-API-CONTRACT-v54.0.0.md](GAME-API-CONTRACT-v54.0.0.md).

