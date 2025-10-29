
let A_HEADERS = []; let A_ROWS = [];
function qs(id){ return document.getElementById(id); }
async function loadActivities(){
  const res = await fetch('/api/activities');
  const data = await res.json();
  A_HEADERS = data.headers || []; A_ROWS = data.rows || [];
  const thead = qs('thead'); const tbody = qs('tbody');
  thead.innerHTML = '<tr>'+A_HEADERS.map(h=>`<th class="px-3 py-2 text-left">${h}</th>`).join('')+'</tr>';
  tbody.innerHTML = '';
  for (const r of A_ROWS){
    const tr = document.createElement('tr');
    tr.innerHTML = A_HEADERS.map((_,i)=>`<td class="px-3 py-2">${(r.values[i]||'').toString()}</td>`).join('');
    tbody.appendChild(tr);
  }
}
window.addEventListener('load', loadActivities);
