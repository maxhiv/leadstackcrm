
import fetch from 'node-fetch';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const TEMP = Number(process.env.AI_TEMPERATURE || '0.6');
export async function aiChat({ system, user, temperature = TEMP, model = MODEL }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model, temperature, messages:[{role:'system',content:system},{role:'user',content:user}] })
  });
  if (!r.ok) throw new Error('OpenAI error: '+(await r.text()));
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}
