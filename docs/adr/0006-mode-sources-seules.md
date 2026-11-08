---
id: 6
title: Mode sources seules et réponse absente
status: accepted
date: 2026-11-07
tags: [ia, resilience, ux]
summary: Quand l'IA est indisponible ou le budget épuisé, l'app affiche les passages trouvés sans réponse rédigée.
---

## Contexte

L'IA peut devenir indisponible : budget quotidien épuisé, IA désactivée volontairement, panne ou délai dépassé chez DeepSeek. Une app de démonstration qui affiche une erreur le jour où elle est partagée donne une mauvaise impression.

## Options considérées

- **Renvoyer une erreur** : honnête mais inutile pour le visiteur.
- **Réponse générique de repli** : cache le problème sans rien apporter.
- **Dégrader proprement vers la recherche locale** : elle ne coûte rien et reste utile.

## Décision

L'endpoint `/api/ask` renvoie un champ `mode` :

- `ai` : réponse rédigée par l'IA, avec citations.
- `sources_only` : budget épuisé, IA désactivée ou erreur DeepSeek. L'app renvoie les passages pertinents sans réponse rédigée.
- `no_answer` : aucun passage n'atteint le score minimal. L'app répond qu'elle n'a rien trouvé, sans appeler l'IA, ce qui évite à la fois le coût et l'invention de réponse.

L'endpoint `/api/health` expose un champ `ai`, pour que le front affiche dès le chargement un bandeau "IA en pause".

## Conséquences

- L'app ne tombe jamais en panne visible, même sans IA.
- Le front doit gérer trois modes de réponse et le champ `ai` de l'état de santé.
- La valeur de l'app subsiste en mode dégradé, puisque la recherche locale est gratuite.