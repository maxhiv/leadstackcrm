
import express from 'express';
import fetch from 'node-fetch';
import { appendToSheet } from '../googleSheets.js';
const router = express.Router();
const threadTag = (kind, rowIndex) => `${kind}:lead-${String(rowIndex||'').trim()}`;

router.post('/email', async (req,res)=>{
  try {
    const { rowIndex='', leadName='', to, subject, body, fromEmail = process.env.FROM_EMAIL || 'team@mail.leadstackmarketing.com', fromName = process.env.FROM_NAME || 'Leadstack Team' } = req.body || {};
    if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body required' });
    const key = process.env.SENDGRID_API_KEY || '';
    if (!key) return res.status(500).json({ error: 'SENDGRID_API_KEY missing' });
    const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/plain', value: body }],
        headers: { 'X-Leadstack-Thread': threadTag('email', rowIndex) }
      })
    });
    if (!sgResp.ok) return res.status(502).json({ error: 'SendGrid error', details: await sgResp.text() });
    await appendToSheet(process.env.ACTIVITIES_SHEET || 'Activities', [new Date().toISOString(),'message',String(rowIndex),String(leadName),'Email','out',fromEmail,to,`${subject}\n${body}`,threadTag('email',rowIndex),'','']);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
export default router;
