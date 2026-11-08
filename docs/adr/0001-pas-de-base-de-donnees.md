---
id: 1
title: Pas de base de données
status: accepted
date: 2026-11-07
tags: [architecture, persistance, hebergement]
summary: Les données de l'app sont des fichiers Markdown chargés en mémoire au démarrage, sans base de données.
---

## Contexte

L'app est une démonstration publique hébergée gratuitement. Les hébergeurs gratuits ont un disque éphémère : tout fichier écrit à l'exécution disparaît au redémarrage. Les seules données de l'app sont des documents en lecture seule (ADR et guides) et des compteurs temporaires (cache, budget).

## Options considérées

- **SQLite ou PostgreSQL** : robuste, mais inutile pour des documents en lecture seule, et SQLite perdrait son fichier sur un disque éphémère.
- **Fichier JSON écrit à l'exécution** : même problème de disque éphémère.
- **Aucun stockage** : les documents Markdown sont versionnés avec le code, et tout le reste vit en mémoire.

## Décision

Pas de base de données. Les documents sont dans `backend/docs/`, versionnés dans Git avec le code. L'index de recherche est construit au démarrage du serveur. Le cache et le compteur de budget sont en mémoire.

## Conséquences

- Déploiement trivial : aucun service à configurer, aucune migration.
- Un redémarrage du serveur remet à zéro le cache et le compteur de budget.
- Aucun historique des questions n'est conservé.
- Si un historique devient nécessaire, un stockage pourra être ajouté derrière une couche dédiée sans toucher à la recherche.