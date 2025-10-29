
import express from 'express';
import { readSheet } from '../googleSheets.js';
import { normalizeCategoryBatch } from './utils.js';

const router = express.Router();

router.get('/', async (req,res)=>{
  try {
    const sheet = process.env.SHEET_NAME || 'Leads';
    const rows = await readSheet(`${sheet}!A:ZZ`);
    if (!rows.length) {
      return res.json({
        headers: ['Row','Name','City','Category','Phone','Primary Email','LDE Score','Priority Score','Google Reviews','GBP Photos','Engagement Deficiency','Review Weakness','Conversion Readiness'],
        rows: [{ rowIndex: 2, values: [2,'Sample Lead','Fairhope','Plumber','(251)000-0000','owner@example.com', 35, 52, 6, 8, 15, 13.7, 5] }]
      });
    }
    const headers = rows[0];
    const out = [];
    for (let i=1;i<rows.length;i++) out.push({ rowIndex: i+1, values: rows[i] || [] });
    await normalizeCategoryBatch(headers, out);
    res.json({ headers, rows: out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
