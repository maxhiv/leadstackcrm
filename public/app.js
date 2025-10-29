
let _headers = []; let _rows = []; let _currentRow = null;

function qs(id){return document.getElementById(id);}
function idxOf(h){return _headers.indexOf(h);}

async function loadLeads(){
  const r = await fetch('/api/leads'); const d = await r.json();
  _headers = d.headers || []; _rows = d.rows || [];
  const tb = qs('leadRows'); tb.innerHTML = '';
  for (const r of _rows){
    const v = r.values; const name = (v[idxOf('Name')]||v[idxOf('Business Name')]||'').toString();
    const city = (v[idxOf('City')]||'').toString();
    const cat = (v[idxOf('Category')]||v[idxOf('Industry')]||'').toString();
    const lde = v[idxOf('LDE Score')]||''; const pr = v[idxOf('Priority Score')]||'';
    const tr=document.createElement('tr');
    tr.innerHTML = `<td class="px-3 py-2">${r.rowIndex}</td><td class="px-3 py-2">${name}</td><td class="px-3 py-2">${city}</td><td class="px-3 py-2">${cat}</td><td class="px-3 py-2">${lde}</td><td class="px-3 py-2">${pr}</td><td class="px-3 py-2"><span id="ais-${r.rowIndex}" class="inline-block text-xs px-2 py-0.5 rounded bg-slate-100">—</span></td><td class="px-3 py-2 text-right"><button class="px-2 py-1 rounded bg-slate-100" onclick="openDrawer(${r.rowIndex})">Open</button></td>`;
    tb.appendChild(tr);
    aiScoreBadge(r);
  }
}

async function aiScoreBadge(row){
  try{
    const v=row.values;
    const payload={ metrics:{
      rowIndex: row.rowIndex, leadName: (v[idxOf('Name')]||v[idxOf('Business Name')]||'').toString(),
      lde: Number(v[idxOf('LDE Score')]||0), reviews: Number(v[idxOf('Google Reviews')]||0), photos: Number(v[idxOf('GBP Photos')]||0),
      engDef: Number(v[idxOf('Engagement Deficiency')]||0), revWeak: Number(v[idxOf('Review Weakness')]||0), convRead: Number(v[idxOf('Conversion Readiness')]||0)
    }};
    const r = await fetch('/api/ai/score',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const j = await r.json(); const el = qs(`ais-${row.rowIndex}`); if (el && j.score!=null) el.textContent = j.score;
  }catch{}
}

async function loadFeed(rowIndex){
  const r=await fetch(`/api/activities/by-lead?row=${rowIndex}`); const d=await r.json();
  const idx=(h)=>d.headers.indexOf(h); const wrap=qs('messages'); wrap.innerHTML='';
  if (!d.rows.length){ wrap.innerHTML='<div class="text-xs text-slate-500">No activity yet.</div>'; return; }
  for (const it of d.rows){ const v=it.values;
    const ts=v[idx('Timestamp')]||''; const ch=v[idx('Channel')]||''; const dir=v[idx('Direction')]||''; const from=v[idx('From')]||''; const to=v[idx('To')]||''; const notes=(v[idx('Notes')]||'').toString(); const tag=v[idx('Thread/Tag')]||'';
    const div=document.createElement('div'); div.className='mb-2 rounded border border-slate-200 bg-white p-2';
    div.innerHTML = `<div class="text-[11px] text-slate-500">${ts} • ${ch} • ${dir}${tag?' • '+tag:''}</div><div class="text-[12px] font-medium">${from} → ${to}</div><div class="text-[13px] whitespace-pre-wrap mt-1">${notes}</div>`;
    wrap.appendChild(div);
  }
}

function openDrawer(rowIndex){
  _currentRow=rowIndex; const r=_rows.find(x=>x.rowIndex===rowIndex); const v=r?.values||[];
  const name=(v[idxOf('Business Name')]||v[idxOf('Name')]||'Lead'); const phone=(v[idxOf('Phone')]||'').toString(); const email=(v[idxOf('Primary Email')]||'').toString();
  qs('drawer').classList.remove('closed'); qs('leadHeader').textContent=`${name} ${phone?'• '+phone:''} ${email?'• '+email:''}`;
  qs('leadTags').textContent=[(v[idxOf('Category')]||v[idxOf('Industry')]||''),(v[idxOf('City')]||'')].filter(Boolean).join(' • ');
  const call = qs('callBtn'); call.href = phone?('tel:'+phone.replace(/[^+\d]/g,'')):'#'; call.classList.toggle('opacity-50',!phone);
  qs('toField').value = (qs('channel').value === 'SMS') ? (phone||'') : (email||'');
  loadFeed(rowIndex);
}

async function sendMessage(){
  const to = qs('toField').value.trim(); const channel=qs('channel').value; const body=qs('composer').value.trim(); const subject=qs('subjectField').value.trim()||'(no subject)';
  if (!to || !body) return alert('To and message required');
  if (channel==='Email'){
    const r=await fetch('/api/chat/email',{method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({rowIndex:_currentRow, leadName:qs('leadHeader').textContent, to, subject, body})});
    if(!r.ok) return alert('Email failed');
  } else {
    const r=await fetch('/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({rowIndex:_currentRow, leadName:qs('leadHeader').textContent, to, body})});
    if(!r.ok) return alert('SMS failed');
  }
  qs('composer').value=''; loadFeed(_currentRow);
}

async function aiPersonalize(){
  const r=_rows.find(x=>x.rowIndex===_currentRow); const v=r?.values||[];
  const profile={ rowIndex:_currentRow, company:(v[idxOf('Business Name')]||v[idxOf('Name')]||'').toString(), city:(v[idxOf('City')]||'').toString(), lde:Number(v[idxOf('LDE Score')]||0), reviews:Number(v[idxOf('Google Reviews')]||0), photos:Number(v[idxOf('GBP Photos')]||0) };
  const resp=await fetch('/api/ai/personalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ profile, signals: [] })});
  const j=await resp.json(); if (j.text) qs('composer').value=(qs('composer').value?qs('composer').value+'\n\n':'')+j.text;
}

async function aiSubjectLines(){
  const resp=await fetch('/api/ai/subjectlines',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ context:'GBP quick wins outreach' })});
  const j=await resp.json(); alert(j.lines||'No lines');
}

async function aiOpeners(){
  const resp=await fetch('/api/ai/openers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ context:'Local service business, propose 60-day map pack plan' })});
  const j=await resp.json(); if (j.lines) qs('composer').value=(qs('composer').value?qs('composer').value+'\n\n':'')+j.lines;
}

window.addEventListener('load', loadLeads);
