---
id: 3
title: Recherche par mots-clés (BM25) plutôt que base vectorielle
status: accepted
date: 2026-11-07
tags: [recherche, ia, architecture]
summary: L'app retrouve les passages pertinents avec un index BM25 local (MiniSearch) au lieu d'une base vectorielle.
---

## Contexte

L'app doit retrouver, parmi les ADR et la documentation, les passages qui répondent à la question d'un nouvel arrivant, avant d'appeler l'IA. Le corpus est petit (quelques dizaines de pages Markdown) et l'hébergement est gratuit, sans base de données.

## Options considérées

- **Base vectorielle (embeddings)** : comprend les synonymes, mais demande un service d'embeddings, une base dédiée et un coût par document indexé. C'est trop lourd pour ce corpus.
- **Recherche plein texte BM25 en mémoire (MiniSearch)** : aucun service externe, indexation en quelques millisecondes au démarrage, résultats explicables par score.

## Décision

Utiliser MiniSearch (BM25) avec normalisation des accents, retrait des mots vides et pluriels simplifiés. L'index est construit au démarrage du serveur.

## Conséquences

- Zéro coût d'indexation et zéro dépendance externe.
- La recherche ne comprend pas les synonymes : "login" ne trouve pas "connexion".
- Un seuil de score minimal évite d'appeler l'IA quand rien de pertinent n'est trouvé.
- Si le corpus grossit fortement, une couche d'embeddings pourra être ajoutée sans changer le reste de l'app.