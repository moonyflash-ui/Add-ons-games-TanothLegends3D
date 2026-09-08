# Sécurité et confidentialité

## Frontière de confiance

Un tricheur contrôle son client et peut modifier ou désactiver un add-on. Sentinel produit donc des **signaux**, jamais des verdicts. Une sanction exige une confirmation par les données autoritaires du serveur et une politique administrative explicite.

Aucun bannissement, retrait de monnaie, suppression, mute, kick ou quarantaine n’est exécuté par cet add-on.

## Données minimales

Avec consentement, Sentinel peut conserver localement :

- version d’API et schéma public du jeu ;
- code de règle, sévérité, dates et compteurs ;
- valeurs techniques strictement liées à l’anomalie ;
- identifiant de personnage transformé en pseudonyme ;
- résumé et quatre étapes maximum volontairement saisis par le joueur.

Il ne collecte jamais :

- mot de passe, jeton de session, clé, secret ou webhook ;
- contenu complet du chat ou conversations privées ;
- frappes clavier ;
- fichiers personnels ou inventaire du PC ;
- adresse personnelle ;
- capture d’écran automatique.

## Stockage et rétention

- file limitée à 32 éléments et environ 60 Kio ;
- un signal identique augmente un compteur au lieu de créer une nouvelle ligne ;
- suppression manuelle disponible ;
- retrait du consentement = suppression immédiate de la file locale ;
- aucune conservation serveur n’existe dans cette version DEV.

Le futur backend devra définir une rétention par catégorie, une procédure de suppression et un journal append-only séparé des données personnelles.

## Secrets et transport

La sandbox officielle impose `connect-src 'none'`. Sentinel n’essaie pas de la contourner. Aucun `fetch`, socket, webhook Discord ou secret n’est présent dans l’add-on.

Le futur transport doit être une capacité officielle du jeu. Il devra joindre une session authentifiée côté serveur, limiter la fréquence, refuser les rejeux et ne jamais retourner le webhook au client.

## Signalement responsable

Les rapports exportés sont anonymisés mais peuvent contenir le texte volontairement saisi. Le joueur doit éviter d’y placer des informations personnelles ou des secrets. Les administrateurs doivent recouper chaque signal avec les journaux serveur avant toute réponse à incident.

