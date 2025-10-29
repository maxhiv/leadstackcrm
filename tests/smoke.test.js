
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import ai from '../src/routes/ai.js';
const app = express(); app.use(express.json()); app.use('/api/ai', ai);
test('AI routes exist', async () => {
  const res = await request(app).post('/api/ai/guardrail').send({ text:'hello' });
  assert.equal([200,500].includes(res.status), true);
});
