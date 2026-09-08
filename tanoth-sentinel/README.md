# Tanoth Sentinel — Anti-Triche & Sécurité

Tanoth Sentinel est un **capteur client de développement**. Il repère des états techniquement incohérents, prépare des rapports anonymisés et aide à reproduire des bugs. Il ne bannit personne et ne remplace pas un serveur de jeu autoritaire.

## Ce qui fonctionne aujourd’hui

- consentement explicite avant l’analyse et le stockage local ;
- contrôle prudent des PV, PM, XP, prestige, monnaies, inventaire, familier et listes groupe/raid ;
- signaux de vitesse ou téléportation manifestement anormales sans changement de carte ;
- réception sécurisée de futurs événements officiels pour cooldowns, intégrité, économie, réseau et erreurs ;
- validation de taille, horodatage, séquence, rejeu et fréquence de ces événements ;
- file locale limitée à 32 rapports et environ 60 Kio ;
- déduplication, compteur de répétitions, résolution après retour à la normale et délais exponentiels ;
- création volontaire d’un rapport de bug ;
- export anonymisé affiché et copiable localement ;
- nettoyage complet à la désactivation.

## Limite essentielle

La v54 ne fournit ni transport réseau d’add-on, ni session serveur authentifiée, ni preuves économiques, ni accès autorisé aux fichiers critiques. La mention **DEV LOCAL** est donc volontaire. Rien n’est envoyé vers Discord ou Codex depuis le jeu.

Le futur chemin prévu est :

```text
Add-on client -> API officielle du jeu -> POST /v1/security/events
-> validation autoritaire -> journal d’audit -> résumé Discord côté serveur
```

Le webhook Discord et toutes les clés restent exclusivement sur le serveur.

## Utilisation

1. Activez l’add-on depuis le gestionnaire.
2. Lisez la section Données.
3. Cochez « Activer l’analyse locale » si vous acceptez le diagnostic local.
4. Consultez les événements ou ajoutez volontairement un rapport de bug.
5. Utilisez « Préparer l’export » pour obtenir un JSON anonymisé à copier.

Retirer le consentement efface immédiatement la file locale de Sentinel.

## Tests

Depuis la racine du dépôt :

```powershell
node --test .\tanoth-sentinel\tests\sentinel.test.cjs
node .\tools\validate-addons.mjs
```

Consultez aussi :

- [SECURITY-PRIVACY.md](SECURITY-PRIVACY.md)
- [GAME-SERVER-SECURITY-CONTRACT.md](GAME-SERVER-SECURITY-CONTRACT.md)
- [AUDIT-REPORT.md](AUDIT-REPORT.md)
- [security-event.v1.schema.json](schemas/security-event.v1.schema.json)

