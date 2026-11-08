const express = require('express');
const config = require('../config');
const { perIp } = require('../guards/limits');
const budget = require('../guards/budget');
const cache = require('../guards/cache');
const { ask } = require('../llm/deepseek');
const { SYSTEM, buildPrompt } = require('../llm/prompt');
const { search } = require('../search');

const router = express.Router();

// Données d'observabilité pour le stepper du front
function buildMeta({ startedAt, mode, passages, tokens = null, llmMs = null }) {
  return {
    passages,
    tokens,
    llmMs,
    durationMs: Date.now() - startedAt,
    model: mode === 'ai' ? config.ai.model : null,
  };
}

router.post('/', perIp, async (req, res) => {
  const startedAt = Date.now();

  if (typeof req.body?.question !== 'string') {
    return res.status(400).json({ error: 'invalid_question' });
  }
  const question = req.body.question.trim().slice(0, config.limits.questionMax);
  if (question.length < config.limits.questionMin) {
    return res.status(400).json({ error: 'question_too_short' });
  }

  const cached = cache.get(question);
  if (cached) {
    return res.json({
      ...cached,
      cached: true,
      meta: buildMeta({
        startedAt,
        mode: cached.mode,
        passages: cached.sources.length,
        tokens: 0,
      }),
    });
  }

  const hits = search(question);
  const topScore = hits[0]?.score ?? 0;
  console.log(`[ask] top score = ${topScore.toFixed(2)}`);

  // Champ de calibration, jamais renvoyé en production
  const debug =
    process.env.NODE_ENV === 'production'
      ? {}
      : { debug: { topScore, terms: hits[0]?.terms ?? [] } };

  if (hits.length === 0 || topScore < config.search.minScore) {
    return res.json({
      mode: 'no_answer',
      answer: "Je n'ai pas trouvé d'information à ce sujet dans la documentation.",
      sources: [],
      meta: buildMeta({ startedAt, mode: 'no_answer', passages: 0 }),
      ...debug,
    });
  }

  const sources = hits.map(({ file, heading, text }) => ({ file, heading, text }));

  if (!budget.available()) {
    return res.json({
      mode: 'sources_only',
      answer: null,
      sources,
      meta: buildMeta({ startedAt, mode: 'sources_only', passages: sources.length }),
      ...debug,
    });
  }

  try {
    const llmStart = Date.now();
    const { answer, usage } = await ask({ system: SYSTEM, user: buildPrompt(question, hits) });
    const llmMs = Date.now() - llmStart;

    budget.record(usage?.total_tokens);

    // Le cache garde la réponse seule, sans meta : meta est recalculé à chaque requête
    const payload = { mode: 'ai', answer, sources };
    cache.set(question, payload);

    return res.json({
      ...payload,
      meta: buildMeta({
        startedAt,
        mode: 'ai',
        passages: sources.length,
        tokens: usage?.total_tokens ?? null,
        llmMs,
      }),
      ...debug,
    });
  } catch (err) {
    console.error('[llm]', err.message);
    return res.json({
      mode: 'sources_only',
      answer: null,
      sources,
      meta: buildMeta({ startedAt, mode: 'sources_only', passages: sources.length }),
      ...debug,
    });
  }
});

module.exports = router;