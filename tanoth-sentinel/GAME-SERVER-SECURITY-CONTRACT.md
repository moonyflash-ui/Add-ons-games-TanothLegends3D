# Contrat jeu et serveur — Tanoth Sentinel 1.0

Statut : contrat requis, non disponible dans TanothLegends3D v54.0.0.

## Capacités côté jeu

Le registre de capacités officiel doit annoncer ces versions :

```json
{
  "securityTelemetry": 1,
  "securityTransport": 1,
  "integrityAttestation": 1,
  "combatAudit": 1,
  "economyReceipts": 1,
  "networkDiagnostics": 1,
  "clientErrorDiagnostics": 1
}
```

### Événement `security:telemetry`

Enveloppe maximale : 4096 octets.

```json
{
  "source": "combat-core",
  "sequence": 42,
  "occurredAt": 1788850000000,
  "type": "combat-action",
  "data": {}
}
```

Types attendus :

- `combat-action` : compétence, cadence minimale, cooldown restant et décision du cœur ;
- `economy-mutation` : type de mutation et identifiant de reçu serveur, sans secret ;
- `network-message` : validité du schéma, taille, séquence/rejeu et fréquence, sans contenu de chat ;
- `integrity` : identifiant de composant autorisé et verdict de l’attestation du jeu ;
- `client-error` : nom, compteur et pile nettoyée ;
- `loot`, `craft`, `reward` : recette/table/récompense, résultat et reçu autoritaire ;
- `social-state` : cohérence serveur du groupe, raid et de la guilde.

L’add-on ne doit jamais recevoir un chemin de fichier personnel, un module arbitraire, une clé, un jeton, un paquet réseau brut ou un message privé.

### Transport officiel

L’add-on remet un lot au cœur via une action dédiée, par exemple :

```js
api.game.action('submitSecurityEvents', {
  schemaVersion: 1,
  events: [/* maximum 20, maximum 64 Kio */]
})
```

Le cœur ajoute la session authentifiée et transmet en HTTPS. L’add-on ne reçoit ni jeton ni URL secrète. Réponses :

- `security:transport-ack` avec les `eventIds` acceptés ;
- `security:transport-error` avec `eventId`, code public et délai minimum ;
- jamais de faux succès si le réseau ou le backend est indisponible.

## Route backend

```http
POST /v1/security/events
Content-Type: application/json
Authorization: session serveur gérée par le jeu
```

Le serveur doit :

1. authentifier la session et rattacher compte, personnage, royaume et build ;
2. valider le schéma et les tailles ;
3. vérifier timestamp, nonce, séquence et rejeu ;
4. appliquer rate limiting et déduplication ;
5. écrire un journal append-only ;
6. recouper avec le déplacement, combat, inventaire, économie et réseau autoritaires ;
7. classer l’incident comme signal non confirmé, confirmé ou faux positif ;
8. envoyer seulement un résumé minimisé au service Discord côté serveur.

Le webhook Discord est un secret serveur. Il n’est jamais enregistré ni retourné au client.

## Format Discord côté serveur

- environnement `DEV` ou `LIVE` ;
- sévérité `INFO`, `WARN`, `HIGH` ou `CRITICAL` ;
- code de règle ;
- royaume ;
- pseudonyme compte/personnage ;
- build ;
- résumé ;
- identifiant d’événement ;
- lien vers la console d’administration.

Les alertes faibles sont regroupées. Seules les alertes critiques **validées côté serveur** partent immédiatement. L’intégration Sentinel/Support utilise un `incidentId` commun afin d’éviter les doubles notifications.

## Réponse à incident

Le serveur peut journaliser, demander une resynchronisation, révoquer une session, placer temporairement en quarantaine ou demander une revue humaine. Aucun signal client seul ne déclenche de sanction irréversible.

## Hooks absents en v54

- version réelle du jeu dans l’API (`gameVersion` annonce encore `41.0`) ;
- registre versionné des capacités ;
- intégrité des modules autorisés ;
- cooldowns et cadence décidés par le cœur ;
- reçus CrownBlood, monnaies, loot, craft et récompenses ;
- diagnostic réseau P2P validé et sans contenu privé ;
- erreurs et crashs nettoyés ;
- identifiants serveur pseudonymisés de session et royaume ;
- transport authentifié et accusés de réception.

## Critères d’acceptation

- événements forgés, anciens, rejoués, trop grands et trop fréquents refusés ;
- lots bornés et idempotents ;
- indisponibilité du backend sans blocage du jeu ;
- reprise exponentielle et suppression uniquement après accusé ;
- webhook indisponible sans perte du journal d’audit ;
- aucune clé dans l’application, les add-ons ou leurs journaux ;
- faux positif client classé sans sanction ;
- incident HIGH/CRITICAL confirmé pouvant être lié à la console GM, sans décision automatique.

