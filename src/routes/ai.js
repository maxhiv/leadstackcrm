
import express from 'express';
import { aiChat } from '../ai/client.js';
import { appendToSheet } from '../googleSheets.js';
const router = express.Router();
const BOOK = process.env.BOOKING_LINK || '';

router.post('/personalize', async (req,res)=>{
  try{
    const { profile={}, signals=[] } = req.body || {};
    const system = "You are 251SEO’s outreach assistant. Tone: concise, expert, friendly.";
    const user = `Write a 3-sentence opener for ${profile.company||'the business'} in ${profile.city||'their city'}.
Data: LDE=${profile.lde||0}, Reviews=${profile.reviews||0}, Photos=${profile.photos||0}.
Quick-wins: ${(signals||[]).join(', ') || 'GBP basics'}.
End with a soft CTA to a 15-min call (${BOOK}).`;
    const text = await aiChat({ system, user });
    if (profile.rowIndex) await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'draft',String(profile.rowIndex),String(profile.company||''),'Email','out','','',text,'ai:personalize','','']);
    res.json({ text });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/reply', async (req,res)=>{
  try{
    const { text='', channel='Email', rowIndex='', from='', to='', subject='' } = req.body || {};
    const system = "You are 251SEO’s SDR assistant. Write concise, helpful replies and a one-line summary.";
    const user = `Inbound via ${channel}. From: ${from}. To: ${to}. Subject: ${subject}. Body:\n${text}\n---\n1) Reply (<=80 words).\n2) Summary (<=20 words).\n3) Next step (<=12 words).`;
    const out = await aiChat({ system, user, temperature:0.5 });
    await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'draft',String(rowIndex||''),'',channel,'out',to,from,out,'ai:reply','','']);
    res.json({ text: out });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/score', async (req,res)=>{
  try{
    const { metrics={} } = req.body || {};
    const system = "You score SMB leads 0–100 for likelihood to become a paying GBP optimization client. Provide JSON {score, rationale}.";
    const user = `Metrics: ${JSON.stringify(metrics)}`;
    const raw = await aiChat({ system, user, temperature:0.2 });
    let score=0, rationale=raw;
    try { const j = JSON.parse(raw); score=j.score; rationale=j.rationale; } catch {}
    if (metrics.rowIndex) await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'score',String(metrics.rowIndex),String(metrics.leadName||''),'AI','n/a','','',`AI Score: ${score}\n${rationale}`,'ai:score','','']);
    res.json({ score, rationale });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/normalize-category', async (req,res)=>{
  try{
    const { categories=[] } = req.body || {};
    const system = "Normalize local service categories to a canonical label and synonyms. Return JSON array of objects {input, canonical, synonyms[]}.";
    const user = JSON.stringify(categories);
    const raw = await aiChat({ system, user, temperature:0.3 });
    res.json({ results: raw });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/pick-template', async (req,res)=>{
  try{
    const { lead={}, templates=[] } = req.body || {};
    const system = "Rank templates for best outreach fit given the lead info. Return JSON array of template keys sorted best->worst.";
    const user = `Lead: ${JSON.stringify(lead)}\nTemplates: ${JSON.stringify(templates.map(t=>({key:t.key,label:t.label,category:t.category})))}\nReturn an array of keys only.`;
    const raw = await aiChat({ system, user, temperature:0.2 });
    res.json({ order: raw });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/subjectlines', async (req,res)=>{
  try{
    const { context='' } = req.body || {};
    const system = "Write 5 concise B2B subject lines under 45 characters, numbered 1-5.";
    const user = context;
    const text = await aiChat({ system, user, temperature:0.8 });
    res.json({ lines: text });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/openers', async (req,res)=>{
  try{
    const { context='' } = req.body || {};
    const system = "Write 3 first-line openers under 18 words, numbered 1-3. Friendly, expert tone.";
    const user = context;
    const text = await aiChat({ system, user, temperature:0.8 });
    res.json({ lines: text });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

router.post('/guardrail', async (req,res)=>{
  try{
    const { text='' } = req.body || {};
    const system = "Review the text for spam/compliance risk. If risky, rewrite with same intent. Return JSON {risk:'ok|warn|block', rewrite?}.";
    const user = text;
    const raw = await aiChat({ system, user, temperature:0.1 });
    res.json({ result: raw });
  }catch(e){ res.status(500).json({ error:e.message }); }
});

export default router;
