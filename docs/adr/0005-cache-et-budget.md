---
id: 5
title: Cache, limites et budget quotidien
status: accepted
date: 2026-11-07
tags: [cout, securite, performance]
summary: Quatre couches limitent le coût de l'IA, validation, cache mémoire, limite par IP et plafond quotidien de tokens.
---

## Contexte

Chaque appel à l'IA coûte des tokens, et l'app est ouverte à tout le monde. Sans protection, une rafale de requêtes ou un script automatique peut épuiser le crédit en quelques minutes.

## Options considérées

- **Aucune limite** : simple, mais indéfendable pour une app publique.
- **Limite par IP seulement** : ne protège pas contre un attaquant qui change d'adresse.
- **Plusieurs couches, de la moins chère à la plus chère** : chaque couche arrête une partie des abus avant qu'ils atteignent l'IA.

## Décision

Une requête traverse ces couches dans l'ordre :

1. **Validation** : la question doit faire entre 5 et 300 caractères.
2. **Cache mémoire** : une question déjà posée est servie sans appel IA. La clé est la question normalisée (minuscules, sans accents ni ponctuation), la durée de vie est de 24 heures, avec au maximum 500 entrées.
3. **Limite par IP** : 15 requêtes par heure et par adresse IP.
4. **Plafond quotidien** : 300 000 tokens par jour, calculés à partir de l'usage renvoyé par l'API. La réponse est aussi bornée à 500 tokens. Le plafond atteint, l'app passe en mode sources seules.

Toutes les valeurs sont configurables par variables d'environnement.

## Conséquences

- Les questions d'exemple sont presque toujours en cache, donc quasi gratuites.
- Le cache et le compteur sont en mémoire : un redémarrage les remet à zéro. Le vrai plafond de dernier recours est le solde prépayé du compte DeepSeek.
- La limite par IP exige `trust proxy` derrière l'hébergeur, sinon toutes les requêtes semblent venir de la même adresse.