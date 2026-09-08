# Rapport honnête — Sentinel 1.0

## Détection client fonctionnelle

- ressources hors limites ;
- progression négative ou structurellement invalide ;
- quantité d’objet invalide et identifiants dupliqués ;
- solde négatif ;
- ressources du familier hors limites ;
- doublons dans une liste groupe/raid ;
- vitesse et téléportation extrêmes sur une même carte ;
- validation locale des futures enveloppes de télémétrie ;
- déduplication, résolution, limitation de taille et file locale ;
- consentement, rapport manuel et export copiable anonymisé.

Ces contrôles restent contournables par un client modifié et peuvent nécessiter un contexte serveur pour éviter un faux positif.

## Validation serveur non disponible

La v54 ne donne pas à l’add-on les preuves nécessaires pour confirmer :

- modification de fichiers ou de protections ;
- cooldown, cadence ou compétence réellement acceptés ;
- transaction CrownBlood ou mutation économique ;
- duplication, loot, craft ou récompense autoritaires ;
- paquet P2P malformé/rejoué ;
- rôle ou état social confirmé ;
- erreur native ou crash ;
- identité de session et royaume ;
- envoi authentifié au backend et Discord.

Conclusion : **Sentinel 1.0 est un prototype DEV/local, pas une protection LIVE**.

## Dégradation propre

- API Add-ons différente de 1 : activation refusée avec message clair ;
- état `player` absent : Sentinel s’arrête sans toucher aux autres add-ons ;
- consentement absent : aucune analyse persistante ;
- backend absent : aucun essai de réseau et aucun faux succès ;
- retrait du consentement : file locale effacée ;
- désactivation : timers et abonnements retirés.

