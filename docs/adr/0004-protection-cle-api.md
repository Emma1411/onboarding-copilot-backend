---
id: 4
title: Protection de la clé API DeepSeek
status: accepted
date: 2026-11-07
tags: [securite, ia, deploiement]
summary: La clé DeepSeek reste côté serveur dans une variable d'environnement, jamais dans Angular ni dans Git.
---

## Contexte

Les réponses rédigées sont produites par l'API DeepSeek, facturée à l'usage. L'app étant publique, la clé ne doit jamais être exposée, sinon n'importe qui peut consommer le crédit.

## Options considérées

- **Clé dans le front Angular** : elle serait lisible par tout visiteur dans le navigateur. Rejeté.
- **BYOK (le visiteur colle sa propre clé)** : coût nul pour moi, mais la plupart des visiteurs n'ont pas de clé DeepSeek.
- **Clé côté serveur avec garde-fous** : les visiteurs testent sans rien configurer, le risque est maîtrisé par des limites.

## Décision

La clé est stockée uniquement dans la variable d'environnement `DEEPSEEK_API_KEY` du backend : fichier `.env` en local (ignoré par Git), variables d'environnement de l'hébergeur en production. Seule la route `/api/ask` appelle DeepSeek. Le compte DeepSeek est prépayé, sans recharge automatique, pour que le solde serve de plafond ultime. Le CORS n'autorise que l'URL du front.

## Conséquences

- Les visiteurs n'ont rien à configurer.
- Le coût dépend des garde-fous décrits dans l'ADR 5.
- Le CORS ne protège que les appels depuis un navigateur : un script externe peut appeler l'API directement, d'où la limite par IP et le budget.
- En cas de fuite supposée, la clé se révoque depuis le tableau de bord DeepSeek et se remplace dans les variables d'environnement.