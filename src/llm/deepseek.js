const config = require('../config');

async function ask({ system, user, maxTokens = config.ai.maxTokens }) {
  if (!config.ai.apiKey) throw new Error('DEEPSEEK_API_KEY manquante');

  const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return { answer: data.choices[0].message.content, usage: data.usage };
}

module.exports = { ask };