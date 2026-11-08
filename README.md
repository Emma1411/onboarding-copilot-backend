# Onboarding Copilot — Backend API

## Description
API REST qui répond aux questions d'un nouvel arrivant sur un projet logiciel, **avec citations vers les sources**. Elle retrouve d'abord les passages pertinents dans la documentation (décisions d'architecture et guides) avec une recherche locale, puis demande à l'IA de rédiger une réponse **uniquement à partir de ces passages**. Si rien de pertinent n'est trouvé, elle le dit au lieu d'inventer.

La démo répond aux questions sur **le projet lui-même** : ses propres ADR et ses guides sont le corpus indexé.

🔗 API : ------

## Fonctionnalités
- **Recherche locale (BM25)** : index construit au démarrage, sans service externe ni coût par requête
- **Réponses citées** : l'IA cite ses sources avec `[1]`, `[2]`, où `[n]` correspond à `sources[n-1]`
- **Refus honnête** : sous un score de pertinence minimal, l'API répond « rien trouvé » sans appeler l'IA
- **Mode dégradé** : budget épuisé ou IA en panne, l'API renvoie les passages trouvés sans réponse rédigée
- **Garde-fous de coût et d'abus** : validation, cache, limite par IP, plafond quotidien de tokens
- **Consultation des décisions** : liste et détail des ADR du projet
- **Aucune authentification, aucune base de données**

## Stack technique
| Composant | Technologie |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Recherche | MiniSearch (BM25) |
| Lecture des documents | gray-matter (frontmatter YAML) |
| IA | API DeepSeek (compatible OpenAI) |
| Sécurité HTTP | helmet, cors, express-rate-limit |
| Tests | node:test + supertest |
| Déploiement | Render (gratuit) |
| Conteneurisation | Docker |

## Architecture
Une question traverse des couches de la moins chère à la plus chère : chacune arrête une partie des cas avant d'atteindre l'IA.

```
                  POST /api/ask
                        │
                ┌───────▼────────┐
                │ Limite par IP  │  20 requêtes / heure
                └───────┬────────┘
                ┌───────▼────────┐
                │   Validation   │  5 à 300 caractères
                └───────┬────────┘
                ┌───────▼────────┐
                │ Cache mémoire  │──── hit ──▶ réponse immédiate
                └───────┬────────┘
                ┌───────▼────────┐
                │ Recherche BM25 │──── score < seuil ──▶ no_answer
                └───────┬────────┘
                ┌───────▼────────┐
                │ Budget de      │──── épuisé ou erreur ──▶ sources_only
                │ tokens + IA    │
                └───────┬────────┘
                        ▼
                  mode "ai" + citations
```


## Endpoints API
| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/ask` | Pose une question, renvoie une réponse avec ses sources |
| GET | `/api/docs` | Liste des décisions d'architecture |
| GET | `/api/docs/:id` | Détail d'une décision (contenu Markdown) |
| GET | `/api/health` | État du serveur et disponibilité de l'IA |


### Modes de réponse
| `mode` | Quand | Appel IA |
|---|---|---|
| `ai` | Passages pertinents trouvés, budget disponible | Oui |
| `sources_only` | Budget épuisé, IA désactivée ou erreur DeepSeek | Non |
| `no_answer` | Aucun passage n'atteint le score minimal | Non |

Une réponse servie par le cache porte en plus `"cached": true`. Les erreurs possibles sont `400` (question invalide ou trop courte) et `429` (limite par IP).

## Installation
Prérequis : Node.js 20 ou plus.

```bash
cd backend
npm install
cp .env.example .env        # puis renseigner DEEPSEEK_API_KEY
npm run dev                 # http://localhost:3000
```
Sans clé DeepSeek, l'API fonctionne en mode `sources_only`.

### Variables d'environnement
| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port d'écoute |
| `DEEPSEEK_API_KEY` | — | Clé API, **jamais** commitée |
| `DEEPSEEK_MODEL` | `deepseek-v4-pro` | Modèle utilisé |
| `AI_ENABLED` | `true` | Interrupteur d'urgence de l'IA |
| `RATE_LIMIT_PER_HOUR` | `40` | Requêtes par heure et par IP |
| `MIN_SCORE` | `6.5` | Score minimal de pertinence  |
| `TOP_K` | `5` | Nombre maximal de passages envoyés à l'IA |

### Calibrer `MIN_SCORE`
Les scores BM25 ne sont pas normalisés : le seuil doit se régler sur le corpus. Hors production, `/api/ask` renvoie un champ `debug.topScore`. Le script `scripts/check-questions.js` envoie des questions pertinentes et hors-sujet, puis affiche le tableau des scores : fixe `MIN_SCORE` entre le score le plus haut des hors-sujet et le plus bas des pertinentes. À refaire quand on ajoute des documents.

## Tests
```bash
npm test
```
Les tests couvrent le découpage des documents, le cache (normalisation, expiration, taille maximale), les modes de réponse, le repli en cas d'erreur de l'IA, le budget quotidien et la limite par IP. **L'appel à DeepSeek est simulé : aucun test ne consomme de token.**
