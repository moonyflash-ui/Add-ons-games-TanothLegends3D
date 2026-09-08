# Plan de certification API — hotfix TanothLegends3D v54

Statut : **en attente du nouveau build testable**. Aucun manifeste n’est relevé à v54 et aucune compatibilité v54 n’est annoncée avant le test croisé.

## Portes de version à tester dans le build

| Version annoncée par le jeu | `minGameVersion` du manifeste de test | Résultat attendu |
|---:|---:|---|
| 54.0.0 | 54.0.0 | PASS — activation acceptée |
| 54.0.0 | 55.0.0 | PASS — refus clair « jeu 55 minimum » |
| 54.0.0 | 41.0 | PASS — rétrocompatibilité acceptée |

Ces trois contrôles doivent être exécutés dans le pont réellement empaqueté. Un test unitaire du comparateur seul ne suffit pas.

## Matrice de certification des neuf add-ons historiques

| Add-on | Installation | Activation | Dépendances | Coexistence | Persistance/redémarrage | Désactivation | Sandbox | Console | Statut hotfix |
|---|---|---|---|---|---|---|---|---|---|
| atlas-navigator | À rejouer | À rejouer | — | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| atlas-route-guide | À rejouer | À rejouer | atlas-navigator | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| dark-fantasy-hud | À rejouer | À rejouer | timekeeper-hud | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| dark-fantasy-world | À rejouer | À rejouer | — | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| exemple-hud | À rejouer | À rejouer | — | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| kikimeter | À rejouer | À rejouer | — | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| quest-helper | À rejouer | À rejouer | atlas-route-guide | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| rift-death-hud | À rejouer | À rejouer | atlas-navigator | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |
| timekeeper-hud | À rejouer | À rejouer | — | À rejouer | À rejouer | À rejouer | À rejouer | À rejouer | PENDING |

L’audit du build v54 précédent reste consultable dans [COMPATIBILITY-v54.0.0.md](COMPATIBILITY-v54.0.0.md), mais il ne remplace pas la certification du hotfix.

## Add-ons serveur encore limités

| Add-on | Client local | Capacités serveur | Statut attendu après hotfix |
|---|---|---|---|
| tanoth-sentinel | Signaux et rapports locaux testés | Télémétrie autoritaire, transport, reçus, Discord serveur | DEV/LIMITÉ tant que les capacités manquent |
| tanoth-staff-support | KB locale, tickets locaux et aperçus verrouillés | Session Support, RBAC, tickets, IA, PostgreSQL, audit | DEV/LIMITÉ tant que les capacités manquent |

## Recette croisée obligatoire

1. Vérifier nom, taille et SHA-256 du build transmis.
2. Vérifier `package.json`, `TanothAddons.gameVersion` et le registre des capacités.
3. Exécuter les trois portes de version.
4. Installer les add-ons dans un dossier neuf et comparer les fichiers attendus.
5. Activer chaque add-on seul puis selon le graphe de dépendances.
6. Activer les neuf simultanément, puis Sentinel et Support en mode DEV.
7. Recharger chaque add-on et vérifier l’absence de doublons.
8. Modifier un réglage, fermer complètement, relancer et vérifier la persistance.
9. Désactiver en ordre inverse et vérifier le nettoyage.
10. Vérifier que l’iframe conserve `sandbox="allow-scripts"` et `connect-src 'none'` pour les add-ons sans transport officiel.
11. Capturer erreurs console, erreurs du gestionnaire et absence de secrets.
12. Produire les captures à personnage, zone et angle identiques.

## Règle de mise à jour

Après les PASS réels seulement :

- relever `minGameVersion` add-on par add-on ;
- documenter les capacités vraiment présentes ;
- conserver Sentinel et Support en DEV pour toute fonction backend absente ;
- publier le tableau final avec preuve du build et captures.

