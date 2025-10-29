
import fetch from 'node-fetch';
export async function normalizeCategoryBatch(headers, rows){
  try {
    const idx = (name)=> headers.indexOf(name);
    const iCat = idx('Category') >= 0 ? idx('Category') : idx('Industry');
    if (iCat < 0) return;
    const cats = [...new Set(rows.map(r => (r.values[iCat]||'').toString()).filter(Boolean))];
    if (!cats.length) return;
    const r = await fetch((process.env.PUBLIC_BASE_URL||'') + '/api/ai/normalize-category', {
      method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.API_KEY||''},
      body: JSON.stringify({ categories: cats.slice(0,20) })
    });
    await r.text();
  } catch {}
}
