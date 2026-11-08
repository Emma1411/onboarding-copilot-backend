---
title: Architecture de l'application
tags: [architecture, backend]
summary: Vue d'ensemble du backend, de l'indexation et du parcours d'une question.
---

# Architecture de l'application

## Parcours d'une question

Une question passe par quatre étapes, de la moins chère à la plus chère :

1. Validation : la question fait entre 5 et 300 caractères.
2. Cache : une question déjà posée est servie sans coût.
3. Recherche locale : un index BM25 retrouve les passages pertinents dans la documentation, sans IA. Si aucun passage n'est assez pertinent, l'app répond qu'elle n'a rien trouvé.
4. IA : DeepSeek rédige une réponse uniquement à partir des passages trouvés, avec des citations numérotées.

## Organisation du backend

Le backend est une API Node.js avec Express, organisée en couches :

- `routes` : valide l'entrée et orchestre le parcours d'une question.
- `guards` : protège le coût et limite les abus (cache, limite par IP, budget).
- `llm` : seul endroit qui connaît DeepSeek, y compris la construction du prompt.
- `search` : charge, découpe et indexe les documents Markdown, puis effectue les recherches.
- `config` : seul endroit qui lit les variables d'environnement.

Changer de fournisseur d'IA ne touche que `llm`. Changer de moteur de recherche ne touche que `search`.

## Indexation

Au démarrage, le serveur lit tous les fichiers Markdown du dossier `docs`. Chaque document est découpé par titres, et une section de plus de 1200 caractères est coupée par paragraphes. Les passages sont indexés avec MiniSearch. Les accents, les majuscules, les mots vides et les pluriels simples sont normalisés pour que "clé" et "cles" donnent le même résultat. Le titre du document, le titre de section et les tags comptent davantage que le texte courant.

## Points d'accès

- `POST /api/ask` : pose une question.
- `GET /api/docs` : liste les décisions d'architecture.
- `GET /api/docs/:id` : détail d'une décision.
- `GET /api/health` : état du serveur et disponibilité de l'IA.

## Modes de réponse

L'endpoint de questions renvoie `ai`, `sources_only` ou `no_answer` selon la situation, comme décrit dans la décision sur le mode sources seules.