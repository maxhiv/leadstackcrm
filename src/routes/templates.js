
import express from 'express';
import { readSheetRange } from '../googleSheets.js';

const router = express.Router();

router.get('/', async (req,res)=>{
  try {
    const sheet = process.env.TEMPLATES_SHEET || 'Templates';
    const rows = await readSheetRange(sheet, 'A:D');
    if (!rows || rows.length < 2) {
      return res.json({ templates: [
        { key:'BUMP', label:'Bump', content:'Quick nudge about high‑impact GBP fixes', category:'' }
      ]});
    }
    const headers = rows[0].map(s=>(s||'').toString().toLowerCase());
    const idxKey=headers.indexOf('key'), idxLabel=headers.indexOf('label'), idxContent=headers.indexOf('content'), idxCategory=headers.indexOf('category');
    const out=[];
    for(let i=1;i<rows.length;i++){ const r=rows[i]||[]; const key=(r[idxKey]||'').toString().trim(); const label=(r[idxLabel]||'').toString().trim(); const content=(r[idxContent]||'').toString(); const category=idxCategory>-1?(r[idxCategory]||'').toString().trim():''; if(key&&label&&content) out.push({key,label,content,category}); }
    res.json({ templates: out });
  } catch (e) { res.status(200).json({ templates: [] }); }
});

export default router;
