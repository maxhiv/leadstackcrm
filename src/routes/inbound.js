
import express from 'express';
import fetch from 'node-fetch';
import { appendToSheet } from '../googleSheets.js';

const router = express.Router();

router.post('/sendgrid', async (req,res)=>{
  try {
    const key = req.headers['x-webhook-key'];
    if ((process.env.SENDGRID_WEBHOOK_KEY || '') && key !== process.env.SENDGRID_WEBHOOK_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const sheet = process.env.ACTIVITIES_SHEET || 'Activities';
    const from = (req.body.from || '').toString();
    const to = (req.body.to || '').toString();
    const subject = (req.body.subject || '').toString();
    const text = (req.body.text || req.body.html || '').toString();
    const headers = (req.body.headers || '').toString();
    const hdrLine = headers.split('\n').find(l=>l.toLowerCase().startsWith('x-leadstack-thread:')) || '';
    const tag = hdrLine ? hdrLine.split(':').slice(1).join(':').trim() : '';
    const rowIndex = (req.body.lead_row || req.query.row || (tag.match(/lead-(\d+)/)?.[1]) || '').toString();
    const ts = new Date().toISOString();
    const note = `Email from ${from} — ${subject}\n${text.slice(0,2000)}`;
    await appendToSheet(sheet, [ts,'message',rowIndex,'','Email','in',from,to,note,tag||('email:lead-'+rowIndex),'','']);

    try {
      const r = await fetch((process.env.PUBLIC_BASE_URL||'') + '/api/ai/reply', { method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.API_KEY||''}, body: JSON.stringify({ text, channel:'Email', rowIndex, from, to, subject }) });
      await r.text();
    } catch {}

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
