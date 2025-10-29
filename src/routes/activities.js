
import express from 'express';
import { readSheet, updateRow } from '../googleSheets.js';

const router = express.Router();

router.get('/', async (req,res)=>{
  try {
    const sheet = process.env.ACTIVITIES_SHEET || 'Activities';
    const rows = await readSheet(`${sheet}!A:ZZ`);
    if (!rows.length) return res.json({ headers: [], rows: [] });
    const headers = rows[0].map(s => (s||'').toString());
    const idxOwner = headers.indexOf('Owner');
    const idxStatus = headers.indexOf('Status');
    let out = [];
    for (let i=1;i<rows.length;i++) out.push({ rowNumber: i+1, values: rows[i] || [] });
    const { owner, status } = req.query;
    if (owner) out = out.filter(x => ((x.values[idxOwner]||'').toString().toLowerCase()) === owner.toLowerCase());
    if (status) out = out.filter(x => ((x.values[idxStatus]||'').toString().toLowerCase()) === status.toLowerCase());
    res.json({ headers, rows: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/by-lead', async (req,res)=>{
  try {
    const row = (req.query.row || '').toString();
    const sheet = process.env.ACTIVITIES_SHEET || 'Activities';
    const rows = await readSheet(`${sheet}!A:ZZ`);
    if (!rows.length) return res.json({ headers: [], rows: [] });
    const headers = rows[0].map(s => (s||'').toString());
    const idxRow = headers.indexOf('Row Index');
    let out = [];
    for (let i=1;i<rows.length;i++){
      const r = rows[i] || [];
      if (!row || (r[idxRow]||'').toString() === row) out.push({ rowNumber: i+1, values: r });
    }
    res.json({ headers, rows: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/update', async (req,res)=>{
  try {
    const { rowNumber, owner, status } = req.body || {};
    if (!rowNumber) return res.status(400).json({ error: 'rowNumber required' });
    const sheet = process.env.ACTIVITIES_SHEET || 'Activities';
    const rows = await readSheet(`${sheet}!A:ZZ`);
    if (!rows.length || rowNumber <= 1 || rowNumber > rows.length) return res.status(404).json({ error: 'row not found' });
    const headers = rows[0].map(s => (s||'').toString());
    const idxOwner = headers.indexOf('Owner');
    const idxStatus = headers.indexOf('Status');
    const row = (rows[rowNumber-1] || []).slice();
    if (owner != null && idxOwner >=0) row[idxOwner] = owner;
    if (status != null && idxStatus >=0) row[idxStatus] = status;
    await updateRow(rowNumber, row);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
