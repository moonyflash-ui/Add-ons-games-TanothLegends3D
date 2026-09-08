# Guide staff — prototype DEV

## GS

Le rôle Game Support traite uniquement les tickets correspondant à ses langues, files et permissions serveur. Les fonctions prévues sont répondre, traduire, demander des informations, fusionner, affecter, transmettre une procédure et proposer une resynchronisation ou un déblocage.

Un GS n’obtient automatiquement aucun droit sur CrownBlood, inventaire, bannissement ou suppression de personnage.

## GM

Les fonctions prévues sont :

- observer un royaume ;
- rejoindre invisiblement si la politique l’autorise ;
- téléporter ou débloquer avec confirmation ;
- mute temporaire ;
- expulsion ou suspension de session ;
- enquête anti-triche ;
- maintenance d’un royaume ;
- consultation d’incidents et du journal d’audit.

Chaque commande doit porter raison, durée, cible, auteur, horodatage, nonce et identifiant. Le serveur revérifie le rôle et la permission au moment exact de l’exécution.

## Double contrôle

Restauration économique, CrownBlood, suppression de personnage et bannissement définitif exigent :

1. permission supérieure explicite ;
2. MFA/step-up récent ;
3. double confirmation ;
4. second approbateur humain distinct ;
5. écriture append-only avant exécution ;
6. procédure de compensation plutôt qu’effacement d’historique.

## Sentinel

Seul un incident Sentinel `HIGH` ou `CRITICAL` confirmé par le serveur peut apparaître dans la console GM. GS-IA peut le résumer à partir de données autorisées mais ne peut jamais sanctionner. Ticket, événement de sécurité et audit partagent des identifiants pour éviter les alertes Discord en double.

