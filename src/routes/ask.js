const express = require("express");
const config = require("../config");
const { perIp } = require("../guards/limits");
const budget = require("../guards/budget");
const cache = require("../guards/cache");
const { ask } = require("../llm/deepseek");
const { SYSTEM, buildPrompt } = require("../llm/prompt");
const { search } = require("../search");

const router = express.Router();

router.post("/", perIp, async (req, res) => {
  if (typeof req.body?.question !== "string") {
    return res.status(400).json({ error: "invalid_question" });
  }
  const question = req.body.question.trim().slice(0, config.limits.questionMax);
  if (question.length < config.limits.questionMin) {
    return res.status(400).json({ error: "question_too_short" });
  }

  const cached = cache.get(question);
  if (cached) return res.json({ ...cached, cached: true });

  const hits = search(question);
  const topScore = hits[0]?.score ?? 0;
  console.log(`[ask] top score = ${topScore.toFixed(2)}`);

  // Champ de calibration, jamais renvoyé en production
  const debug =
    process.env.NODE_ENV === "production"
      ? {}
      : { debug: { topScore, terms: hits[0]?.terms ?? [] } };

  if (hits.length === 0 || topScore < config.search.minScore) {
    return res.json({
      mode: "no_answer",
      answer:
        "Je n'ai pas trouvé d'information à ce sujet dans la documentation.",
      sources: [],
      ...debug,
    });
  }

  const sources = hits.map(({ file, heading, text }) => ({
    file,
    heading,
    text,
  }));

  if (!budget.available()) {
    return res.json({ mode: "sources_only", answer: null, sources, ...debug });
  }

  try {
    const { answer, usage } = await ask({
      system: SYSTEM,
      user: buildPrompt(question, hits),
    });
    budget.record(usage?.total_tokens);
    const payload = { mode: "ai", answer, sources };
    cache.set(question, payload);
    return res.json({ ...payload, ...debug });
  } catch (err) {
    console.error("[llm]", err.message);
    return res.json({ mode: "sources_only", answer: null, sources, ...debug });
  }
});

module.exports = router;
