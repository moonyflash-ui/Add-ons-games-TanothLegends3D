# Tanoth Staff & Support — GM / GS / GS-IA

Cette version 1.0 est un **prototype DEV hors ligne** qui montre l’expérience joueur et les futures consoles staff sans accorder aucun rôle ni exécuter aucune action administrative.

## Vue joueur disponible

- recherche dans quatre articles approuvés et versionnés ;
- GS-IA locale limitée à cette base de connaissances ;
- refus des instructions suspectes et transfert humain en cas d’incertitude ;
- brouillons locaux de tickets avec catégorie, langue, urgence et description ;
- diagnostic technique minimal uniquement avec consentement ;
- réponses et évaluations locales ;
- file bornée, déduplication et état hors ligne honnête ;
- réglages de touche, échelle et opacité persistants.

La touche F1 fonctionne quand la fenêtre de l’add-on a le focus. Le raccourci global et le placement de la fenêtre nécessitent encore une capacité officielle du jeu.

## Aperçus GS et GM

Les onglets GS et GM sont marqués **RÔLE NON ACCORDÉ** et **NON AUTHENTIFIÉ**. Ils montrent l’organisation prévue des files, incidents, royaumes et actions, mais tous les boutons sensibles sont désactivés.

Un rôle stocké localement, un nom de personnage ou un paramètre client ne donne aucun droit. Une future session autoritaire doit être fournie par le jeu et chaque action reste contrôlée par le backend.

## Architecture cible

```text
Add-on client
  -> API Support officielle HTTPS/WSS
  -> service tickets
  -> PostgreSQL
  -> service IA serveur fondé sur la base approuvée
  -> console staff
```

Aucune clé IA, base de données, administration ou Discord ne se trouve dans l’add-on.

## Documentation

- [STAFF-GUIDE.md](STAFF-GUIDE.md)
- [RBAC-PERMISSIONS.md](RBAC-PERMISSIONS.md)
- [SUPPORT-API-CONTRACT.md](SUPPORT-API-CONTRACT.md)
- [AI-SAFETY.md](AI-SAFETY.md)
- [AUDIT-REPORT.md](AUDIT-REPORT.md)
- schémas versionnés dans [`schemas/`](schemas/)

## Tests

```powershell
node --test .\tanoth-staff-support\tests\support.test.cjs
node .\tools\validate-addons.mjs
```
