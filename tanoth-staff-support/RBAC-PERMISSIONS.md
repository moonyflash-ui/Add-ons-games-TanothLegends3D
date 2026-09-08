# RBAC et permissions

Les rôles sont des affirmations serveur à durée limitée, jamais des réglages client.

| Capacité | Joueur | GS | GM | Admin supérieur |
|---|:---:|:---:|:---:|:---:|
| Créer/lire ses tickets | Oui | — | — | — |
| Lire tickets selon langues/files | Non | Permission | Permission | Permission |
| Répondre/traduire/demander informations | Non | Permission | Permission | Permission |
| Affecter/fusionner/escalader | Non | Permission | Permission | Permission |
| Proposer resynchronisation/déblocage | Non | Permission | Permission | Permission |
| Observer royaume | Non | Non | `realm.read` | Permission |
| Rejoindre invisible | Non | Non | `realm.observe.hidden` | Permission |
| Téléporter/débloquer | Non | Non | `player.teleport` / `player.unstuck` | Permission |
| Mute/kick/suspendre | Non | Non | Permission fine | Permission fine |
| Enquête anti-triche | Non | Non | `security.investigate` | Permission |
| Maintenance royaume | Non | Non | `realm.maintenance` | Permission |
| Audit/incidents | Non | Selon mandat | Permission fine | Permission fine |
| CrownBlood/économie/objet | Non | Non | Non par défaut | Permission + MFA + double contrôle |
| Bannissement définitif/suppression | Non | Non | Non par défaut | Permission + MFA + double contrôle |

## Réclamations serveur minimales

```json
{
  "issuer": "tanoth-support-api",
  "verifiedByGame": true,
  "staffId": "staff-pseudonym",
  "role": "gs",
  "permissions": ["ticket.read.fr", "ticket.reply"],
  "languages": ["fr"],
  "realmScopes": ["realm-1"],
  "expiresAt": 1788853600000,
  "stepUpVerified": false
}
```

Même une réclamation reçue doit être revérifiée côté serveur lors de chaque commande. Le client ne vérifie pas seul une signature et ne possède pas de secret de validation.

