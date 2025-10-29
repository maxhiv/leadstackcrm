
import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appendToSheet } from '../googleSheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OPT_PATH = path.join(__dirname, '..', '..', 'uploads', 'optouts.json');

function readOptouts(){ try { return JSON.parse(fs.readFileSync(OPT_PATH,'utf8') || '[]'); } catch { return []; } }
function writeOptouts(list){ try { fs.writeFileSync(OPT_PATH, JSON.stringify(list,null,2)); } catch {} }
function isOptedOut(n){ return readOptouts().includes((n||'').toString()); }
function addOptout(n){ const l=readOptouts(); n=(n||'').toString(); if(!l.includes(n)){ l.push(n); writeOptouts(l);} }
function removeOptout(n){ const l=readOptouts(); n=(n||'').toString(); writeOptouts(l.filter(x=>x!==n)); }
const threadTag = (kind, rowIndex) => `${kind}:lead-${String(rowIndex||'').trim()}`;

const router = express.Router();

router.post('/send', async (req,res)=>{
  try {
    const { to, body, rowIndex='', leadName='' } = req.body || {};
    const from = req.body.from || process.env.TWILIO_FROM || '';
    if (!to || !body) return res.status(400).json({ error: 'to, body required' });
    if (isOptedOut(to)) return res.status(403).json({ error: 'recipient opted out' });

    const sid = process.env.TWILIO_ACCOUNT_SID || '';
    const token = process.env.TWILIO_AUTH_TOKEN || '';
    if (!sid || !token) return res.status(500).json({ error: 'Twilio credentials missing' });

    const form = new URLSearchParams();
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) form.append('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
    else form.append('From', from);
    form.append('To', to);
    form.append('Body', body);

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
      body: form
    });
    const data = await resp.json();

    await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'message',String(rowIndex),String(leadName),'SMS','out',from,to,body,threadTag('sms',rowIndex),'','']);
    res.json({ ok: true, twilio: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/incoming', async (req,res)=>{
  try {
    const from = (req.body.From || '').toString();
    const to = (req.body.To || '').toString();
    const body = (req.body.Body || '').toString().trim();

    const stopWords = ['stop','stopall','unsubscribe','cancel','end','quit'];
    const startWords = ['start','unstop'];
    let reply = 'Thanks for your message.';

    if (stopWords.includes(body.toLowerCase())) {
      addOptout(from); reply = 'You have been opted out. Reply START to opt back in.';
    } else if (startWords.includes(body.toLowerCase())) {
      removeOptout(from); reply = 'You have been opted back in. You will receive messages again.';
    } else {
      await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'message','','','SMS','in',from,to,body,'sms:lead-','', '']);
      try {
        const r = await fetch((process.env.PUBLIC_BASE_URL||'') + '/api/ai/reply', { method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.API_KEY||''}, body: JSON.stringify({ text: body, channel:'SMS', rowIndex:'', from, to }) });
        await r.text();
      } catch {}
    }

    res.set('Content-Type','text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (e) {
    res.set('Content-Type','text/xml');
    res.status(200).send('<Response><Message>Error processing message.</Message></Response>');
  }
});

export default router;
