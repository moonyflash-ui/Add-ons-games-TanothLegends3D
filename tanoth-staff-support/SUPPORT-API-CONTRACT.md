# Contrat API Support et Staff 1.0

Statut : requis côté VPS/backend ; indisponible dans le prototype v54.

## Architecture

```text
Client add-on -> pont officiel du jeu -> API Support HTTPS/WSS
-> service tickets -> PostgreSQL
-> service IA serveur -> console staff
```

Le pont du jeu détient la session. L’add-on ne reçoit aucune clé, aucun jeton d’administration, aucune connexion PostgreSQL et aucun webhook.

## Routes joueur

- `POST /v1/support/tickets`
- `GET /v1/support/tickets/:id`
- `POST /v1/support/tickets/:id/messages`
- `POST /v1/support/tickets/:id/close`
- `POST /v1/support/tickets/:id/rating`
- `POST /v1/support/ai/chat`
- `GET /v1/support/knowledge/search`

## Routes GS

Sous `/v1/staff/*` : files filtrées par langues et permissions, lecture, réponse, traduction, demande d’informations, affectation, fusion, escalade, procédures et proposition de resynchronisation/déblocage.

## Routes GM

Sous `/v1/admin/*` : état royaume, observation, présence invisible, téléportation/déblocage, mute, kick/suspension, enquête, maintenance, incidents et audit.

Chaque route administrative exige RBAC fin. Les actions sensibles exigent MFA/step-up et double contrôle humain.

## Identité et rejeu

Chaque requête est rattachée côté serveur à : `accountId`, `characterId`, `realmId`, `sessionId` et rôle vérifié. Le visible `Nom#Numéro` n’est jamais une clé de sécurité.

Les commandes portent `commandId`, `nonce`, timestamp, cible, raison et durée. Le serveur refuse les rejeux, timestamps hors fenêtre, tailles excessives et fréquences abusives.

## Capacités jeu requises

```json
{
  "supportSession": 1,
  "supportTransport": 1,
  "supportRealtime": 1,
  "supportKnowledge": 1,
  "supportGlobalHotkey": 1,
  "supportWindowPlacement": 1,
  "staffRbac": 1,
  "adminStepUp": 1,
  "auditAppendOnly": 1,
  "sentinelIncidentLink": 1
}
```

Événements prévus : `support:session`, `support:ticket`, `support:connection`, `support:server-time`, `support:security-incident`, `support:transport-ack` et `support:transport-error`.

## Base de connaissances

Chaque article possède identifiant, titre, version, propriétaire, validation, environnements, versions du jeu, mots-clés, statut et contenu. Seuls les articles approuvés sont indexés par l’IA.

## PostgreSQL

Tables ou agrégats recommandés : tickets, messages, affectations, articles, versions d’article, décisions IA, actions staff, incidents, liens ticket-incident et journal append-only. L’IA et le client n’accèdent jamais directement à PostgreSQL.

## File locale et reprise

Le jeu remet les brouillons au serveur par lots bornés et idempotents. Aucun ticket n’est marqué envoyé avant accusé serveur. Reprise exponentielle, déduplication et rate limiting sont obligatoires.

## Privacy et rétention

Consentement avant diagnostic, minimisation, pseudonymisation, rétention par catégorie, suppression selon politique et export d’audit sans données personnelles inutiles. Aucune conversation privée hors ticket n’est collectée.

## Hooks absents dans la v54 actuelle

- session Support authentifiée et rôles serveur ;
- transport HTTPS/WSS officiel ;
- temps serveur et royaume normalisés ;
- raccourci global F1 ;
- position/échelle/opacité de la fenêtre hôte ;
- tickets, messages et états serveur ;
- recherche KB serveur ;
- service IA et citations autoritaires ;
- routes GS/GM, permissions, MFA et confirmations ;
- journal append-only ;
- lien Sentinel validé par serveur.

