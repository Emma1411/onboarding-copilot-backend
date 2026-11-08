---
title: Sécurité et confidentialité
tags: [securite, confidentialite]
summary: Mesures de protection de la clé, des coûts et des données, et limites connues.
---

# Sécurité et confidentialité

## Protection de la clé et des coûts

- La clé DeepSeek reste côté serveur, dans une variable d'environnement. Elle n'apparaît jamais dans le front ni dans Git.
- Une limite de 15 requêtes par heure et par adresse IP s'applique à la route de questions.
- Un plafond quotidien de tokens bascule l'app en mode sources seules quand il est atteint.
- Le compte DeepSeek est prépayé, sans recharge automatique : son solde est le plafond ultime.

## Protection de l'API

- Le CORS n'autorise que l'URL du front.
- Les corps de requête sont limités à 10 Ko.
- Helmet ajoute des en-têtes de sécurité HTTP.
- Les entrées sont validées avant tout traitement, et la question est tronquée à 300 caractères.

## Protection du prompt

La question du visiteur est placée entre des balises dédiées, et les consignes demandent d'ignorer toute instruction qu'elle contiendrait. L'IA n'a accès à aucun outil : elle ne peut ni lire de fichier ni appeler un service, elle ne fait que rédiger du texte à partir des extraits fournis. Le front doit afficher la réponse comme du texte, jamais comme du HTML brut.

## Confidentialité

Pour rédiger une réponse, la question et les passages trouvés sont envoyés à DeepSeek. Il ne faut donc saisir aucune information confidentielle. L'app n'utilise aucune base de données : les questions ne sont conservées que dans le cache mémoire.

## Limites connues

- Le CORS ne bloque pas les appels directs hors navigateur, ce qui est la raison d'être de la limite par IP et du budget.
- Le cache et le compteur de budget sont remis à zéro à chaque redémarrage.
- La limite par IP peut pénaliser des visiteurs partageant un même réseau.