---
id: 2
title: Pas d'authentification
status: accepted
date: 2026-11-07
tags: [securite, architecture, ux]
summary: L'app est en accès libre, protégée par des limites d'usage plutôt que par des comptes.
---

## Contexte

L'app est partagée publiquement, notamment depuis LinkedIn. Un visiteur doit pouvoir poser une question en quelques secondes. L'app ne gère aucune donnée personnelle ni action sensible : elle lit de la documentation publique.

## Options considérées

- **Comptes avec JWT ou connexion OAuth** : identifie chaque utilisateur, mais ajoute une friction qui fait fuir les visiteurs et demande une base d'utilisateurs.
- **Clé d'accès partagée** : simple, mais à diffuser, donc facile à fuiter.
- **Accès libre avec limites d'usage** : aucune friction, le risque d'abus est borné par des garde-fous techniques.

## Décision

Pas d'authentification. La protection repose sur une limite de requêtes par adresse IP, un plafond quotidien de tokens IA, une validation stricte des entrées et le mode sources seules (voir les ADR 5 et 6).

## Conséquences

- Aucune friction pour tester l'app.
- Pas de suivi par utilisateur.
- La limite par IP peut pénaliser plusieurs visiteurs derrière un même réseau (bureau, université).
- Un abus reste possible mais son coût est plafonné par le budget quotidien.
- L'app ne doit exposer aucune donnée sensible, puisque tout le monde peut l'appeler.