/* ---------------------------------------------------------------
   Navigation entre "pages"
--------------------------------------------------------------- */
function goToPage(key){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + key).classList.add('active');
  document.querySelectorAll('#mainnav button').forEach(b => b.classList.toggle('active', b.dataset.page === key));
  closeFiche();
  window.scrollTo({top:0, behavior:'instant'});
}
document.getElementById('mainnav').addEventListener('click', e => {
  const btn = e.target.closest('button[data-page]');
  if(btn) goToPage(btn.dataset.page);
});

/* Sliders : champ "img" optionnel pour une vraie photo (URL ou data:), sinon dégradé */
function makeSlider(el,slides){
  let n=0,t;
  slides.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='hero-slide'+(i?'':' active');
    const bg=s.img?`url(${s.img}) center/cover`:s.g;
    d.innerHTML=`<div class="scene" style="background:${bg}"></div><div class="veil"></div><div class="hero-content"><div class="hero-eyebrow">${s.e}</div><h1>${s.t}</h1><p>${s.p}</p>${s.c?`<div style="margin-top:22px"><button class="btn" onclick="goToPage('${s.c[1]}')">${s.c[0]}</button></div>`:''}</div>`;
    el.appendChild(d);
  });
  const dots=document.createElement('div');dots.className='hero-dots';
  slides.forEach((_,i)=>{const b=document.createElement('button');b.setAttribute('aria-label','Image '+(i+1));b.onclick=()=>go(i);dots.appendChild(b);});
  el.appendChild(dots);
  ['‹','›'].forEach((c,k)=>{const b=document.createElement('button');b.className='hero-arrow '+(k?'next':'prev');b.textContent=c;b.setAttribute('aria-label',k?'Suivant':'Précédent');b.onclick=()=>go(n+(k?1:-1));el.appendChild(b);});
  const S=el.querySelectorAll('.hero-slide');
  function go(i){n=(i+S.length)%S.length;S.forEach((x,k)=>x.classList.toggle('active',k===n));[...dots.children].forEach((x,k)=>x.classList.toggle('active',k===n));}
  go(0);
  const start=()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)t=setInterval(()=>go(n+1),6000);};
  start();el.onmouseenter=()=>clearInterval(t);el.onmouseleave=start;
}

/* ---------------------------------------------------------------
   Données des animaux
--------------------------------------------------------------- */
/* ---------------------------------------------------------------
   Rendu "Nos animaux"
--------------------------------------------------------------- */
let currentSpecies = 'chats';
const speciesNavEl = document.getElementById('speciesNav');
const charSelect = document.getElementById('f-caractere');
const gridEl = document.getElementById('animalGrid');
const countEl = document.getElementById('resultCount');

SPECIES.forEach(s => {
  const b = document.createElement('button');
  b.dataset.species = s.key;
  if(s.key === currentSpecies) b.classList.add('active');
  b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${s.icon}</svg><span>${s.label}</span>`;
  b.addEventListener('click', () => { currentSpecies = s.key; refreshSpeciesNav(); closeFiche(); renderAnimals(); });
  speciesNavEl.appendChild(b);
});
function refreshSpeciesNav(){
  speciesNavEl.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.species === currentSpecies));
}

CHARACTERS.forEach(c => {
  const opt = document.createElement('option');
  opt.value = c; opt.textContent = c.charAt(0).toUpperCase()+c.slice(1);
  charSelect.appendChild(opt);
});
charSelect.insertAdjacentHTML('afterbegin', '<option value="tous">Tous</option>');
charSelect.value = 'tous';

document.getElementById('f-age').addEventListener('change', renderAnimals);
document.getElementById('f-caractere').addEventListener('change', renderAnimals);
document.getElementById('f-socia').addEventListener('change', renderAnimals);

function resetFilters(){
  document.getElementById('f-age').value = 'tous';
  document.getElementById('f-caractere').value = 'tous';
  document.getElementById('f-socia').value = 'tous';
  renderAnimals();
}

function escapeHtml(value){return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function ageLabelFr(cat){ return {jeune:'Jeune', adulte:'Adulte', senior:'Senior'}[cat] || cat; }
function sociaLabelFr(v){ return {seul:"Préfère vivre seul", groupe:"À l'aise en groupe", enfants:"Compatible enfants"}[v] || v; }

function pawSvg(){
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 10.2c1 0 1.9-1.1 1.9-2.5S5.5 5.2 4.5 5.2s-1.9 1.1-1.9 2.5 .8 2.5 1.9 2.5zm5-1.7c1 0 1.9-1.2 1.9-2.7S10.5 3 9.5 3 7.6 4.2 7.6 5.8s.9 2.7 1.9 2.7zm5 0c1 0 1.9-1.2 1.9-2.7S15.5 3 14.5 3s-1.9 1.2-1.9 2.7 .9 2.7 1.9 2.7zm4.5 1.7c1.1 0 1.9-1.1 1.9-2.5S20.1 5.2 19 5.2s-1.9 1.1-1.9 2.5 .8 2.5 1.9 2.5zM12 11.6c-2.7 0-6.5 3.3-6.5 6.1 0 1.5 1.2 2.3 2.6 2.3.9 0 1.7-.4 2.6-.7.5-.2 1-.3 1.3-.3s.8.1 1.3.3c.9.3 1.7.7 2.6.7 1.4 0 2.6-.8 2.6-2.3 0-2.8-3.8-6.1-6.5-6.1z"/></svg>';
}

function renderAnimals(){
  const age = document.getElementById('f-age').value;
  const car = document.getElementById('f-caractere').value;
  const socia = document.getElementById('f-socia').value;
  const speciesInfo = SPECIES.find(s => s.key === currentSpecies);

  const list = ANIMALS.filter(a => a.species === currentSpecies)
    .filter(a => age === 'tous' || a.ageCat === age)
    .filter(a => car === 'tous' || a.character === car)
    .filter(a => socia === 'tous' || a.socia === socia);

  countEl.textContent = list.length + (list.length > 1 ? ' animaux trouvés' : ' animal trouvé');

  if(list.length === 0){
    gridEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        ${pawSvg()}
        <h3>Aucun animal ne correspond à ces filtres</h3>
        <p>Essayez d'élargir votre recherche ou réinitialisez les filtres.</p>
      </div>`;
    return;
  }

  gridEl.innerHTML = list.map((a,i) => `
    <div class="animal-card">
      <div class="animal-photo ${a.photos?.[0]?.url ? 'has-photo' : ''}" style="background:${speciesInfo.color}${a.photos?.[0]?.url ? `;background-image:url('${escapeHtml(a.photos[0].url)}')` : ''}">
        ${a.photos?.[0]?.url ? '' : `<svg viewBox="0 0 24 24" fill="none" stroke="#F6F1E4" stroke-width="1.4">${speciesInfo.icon}</svg>`}
      </div>
      <div class="animal-body">
        <h3>${escapeHtml(a.name)}</h3>
        <div class="animal-age">${escapeHtml(ageLabelFr(a.ageCat))} — ${escapeHtml(a.ageLabel)}</div>
        <div class="tag-row">
          <span class="tag">${escapeHtml(a.character)}</span>
          <span class="tag">${escapeHtml(sociaLabelFr(a.socia))}</span>
        </div>
        <button class="btn small ghost" style="color:var(--clay); border-color:var(--clay);" onclick="openAnimal('${a.id}')">Voir la fiche</button>
      </div>
    </div>
  `).join('');
}
function toggleDesc(id, btn){
  const el = document.getElementById('desc-' + id);
  el.classList.toggle('open');
  btn.textContent = el.classList.contains('open') ? 'Réduire' : 'En savoir plus';
}

renderAnimals();
loadAnimalsFromApi();

async function loadAnimalsFromApi(){
  const base=window.APP_CONFIG?.API_BASE_URL;if(!base)return;
  try{
    const response=await fetch(`${base}/api/animals`);if(!response.ok)throw new Error('API indisponible');
    const payload=await response.json();
    ANIMALS=(payload.animals||[]).map(row=>{
      const item={id:row.id,name:row.name,species:row.species,ageCat:row.age_category||'adulte',ageLabel:row.age_label||'',character:row.character||'',socia:row.social_compatibility||'',desc:row.description||'',photos:row.photos||[]};
      DETAILS[item.name]={...(DETAILS[item.name]||{}),race:row.breed||'',sexe:row.sex||'',poids:row.weight||'',maladie:row.health_notes||'',photos:item.photos.map(p=>p.url).filter(Boolean)};
      return item;
    });
    renderAnimals();
  }catch(error){console.warn('Catalogue Supabase non chargé :',error.message);}
}

/* ---------- Fiches détaillées (données d'exemple à remplacer) ---------- */
/* Ajoutez "photos:['data:image/...']" dans DETAILS pour afficher de vraies photos */
let galIdx=0,galPh=[];
function tile(i,sp){return galPh[i]?`<div class="tile"><img src="${escapeHtml(galPh[i])}" alt="Photo ${i+1}"></div>`:`<div class="tile" style="background:${sp.color}">Photo ${i+1}</div>`;}
function setPhoto(i){galIdx=i;const sp=window._sp;document.getElementById('galMain').innerHTML=tile(i,sp);document.querySelectorAll('.gal-thumbs button').forEach((b,k)=>b.classList.toggle('on',k===i));}
function openAnimal(id){
  const a=ANIMALS.find(x=>x.id===id);if(!a)return;const sp=SPECIES.find(s=>s.key===a.species)||SPECIES[0],d=DETAILS[a.name]||{};
  currentSpecies=a.species;refreshSpeciesNav();goToPage('animaux');
  window._sp=sp;galPh=d.photos||[null,null,null,null];
  document.getElementById('listView').hidden=true;
  const f=document.getElementById('fiche');f.hidden=false;
  f.innerHTML=`<button class="back" onclick="closeFiche()">← Retour aux ${sp.label.toLowerCase()}</button>
  <div class="fiche"><div><div class="gal-main" id="galMain"></div>
    <div class="gal-thumbs">${galPh.map((_,i)=>`<button onclick="setPhoto(${i})" aria-label="Photo ${i+1}">${tile(i,sp)}</button>`).join('')}</div></div>
  <div><h1>${escapeHtml(a.name)}</h1><p>${escapeHtml(d.race||'')} · ${escapeHtml(ageLabelFr(a.ageCat))}, ${escapeHtml(a.ageLabel)}</p>
    <div class="tag-row"><span class="tag">${escapeHtml(a.character)}</span><span class="tag">${escapeHtml(sociaLabelFr(a.socia))}</span></div>
    <p>${escapeHtml(a.desc)}</p>
    <dl class="facts"><dt>Espèce</dt><dd>${escapeHtml(sp.label)}</dd><dt>Race</dt><dd>${escapeHtml(d.race||'—')}</dd><dt>Sexe</dt><dd>${escapeHtml(d.sexe||'—')}</dd><dt>Âge</dt><dd>${escapeHtml(a.ageLabel)}</dd><dt>Poids</dt><dd>${escapeHtml(d.poids||'—')}</dd></dl>
    ${d.maladie?`<div class="health warn"><strong>Santé : suivi particulier</strong>${escapeHtml(d.maladie)}</div>`:`<div class="health"><strong>Santé</strong>Aucune maladie connue à ce jour. Examen vétérinaire réalisé avant le départ.</div>`}
    <button class="btn" onclick="goToPage('adopter')">Je veux adopter ${a.name}</button></div></div>`;
  setPhoto(0);window.scrollTo({top:0,behavior:'instant'});
}
function closeFiche(){const f=document.getElementById('fiche');if(f)f.hidden=true;const l=document.getElementById('listView');if(l)l.hidden=false;}

/* ---------- Quizz ---------- */
const qg=document.getElementById('qgrid');
QUIZ.forEach((q,i)=>{qg.insertAdjacentHTML('beforeend',`<div class="qban"><div class="top" style="background:${q.g}">${q.t}</div><div class="bd"><p>${q.d}</p><p style="color:var(--ink-soft)">${q.qs.length} questions</p><button class="btn small" onclick="startQuiz(${i})">Commencer</button></div></div>`);});
let qz=null;
function miniCard(a,note){const sp=SPECIES.find(s=>s.key===a.species);return `<div class="rcard"><h4>${a.name}</h4><span>${sp.label} · ${a.ageLabel}</span><span class="tag" style="align-self:flex-start">${a.character}</span>${note?`<span>${note}</span>`:''}<button class="btn small ghost" style="color:var(--clay);border-color:var(--clay);margin-top:auto" onclick="openAnimal('${a.id}')">Voir la fiche</button></div>`;}
function startQuiz(i){qz={q:QUIZ[i],i:0,acc:QUIZ[i].mode==='m'?[]:{}};document.getElementById('quizHome').hidden=true;const r=document.getElementById('quizRun');r.hidden=false;window.scrollTo({top:0,behavior:'instant'});showQ();}
function quitQuiz(){document.getElementById('quizRun').hidden=true;document.getElementById('quizHome').hidden=false;}
function showQ(){const q=qz.q.qs[qz.i];document.getElementById('quizRun').innerHTML=`<button class="back" style="padding-top:0" onclick="quitQuiz()">← Tous les quizz</button><div class="qprog">Question ${qz.i+1} sur ${qz.q.qs.length}</div><h2>${q[0]}</h2>${q[1].map((o,k)=>`<button class="qopt" onclick="answerQ(${k})">${o[0]}</button>`).join('')}`;}
function answerQ(k){const w=qz.q.qs[qz.i][1][k][1];if(qz.q.mode==='m')qz.acc.push(w);else for(const x in w)qz.acc[x]=(qz.acc[x]||0)+w[x];qz.i++;qz.i<qz.q.qs.length?showQ():showResult();}
function showResult(){
  const r=document.getElementById('quizRun'),m=qz.q.mode;let h='';
  const top=Object.entries(qz.acc).sort((a,b)=>b[1]-a[1])[0];
  if(m==='sp'){const sp=SPECIES.find(s=>s.key===top[0]);h=`<h2>Votre profil : ${sp.label.toLowerCase()}</h2><p>D'après vos réponses, c'est l'espèce qui s'accorde le mieux à votre quotidien.</p><button class="btn" onclick="currentSpecies='${sp.key}';refreshSpeciesNav();goToPage('animaux');renderAnimals()">Voir les ${sp.label.toLowerCase()}</button>`;}
  else if(m==='ch'){const l=ANIMALS.filter(a=>a.character===top[0]).slice(0,3);h=`<h2>Votre animal idéal : ${top[0]}</h2><p>${TRAIT_TXT[top[0]]}</p><div class="rgrid">${l.map(a=>miniCard(a)).join('')}</div>`;}
  else{const c=qz.acc.filter(w=>Object.keys(w).length),sc=a=>c.filter(w=>(w.sp?w.sp===a.species:w.ag?w.ag===a.ageCat:w.ch?w.ch===a.character:w.so===a.socia)).length;
    const l=ANIMALS.map(a=>[a,sc(a)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3);
    h=l.length?`<h2>Ils pourraient vous correspondre</h2><div class="rgrid">${l.map(x=>miniCard(x[0],Math.round(x[1]/c.length*100)+'% de correspondance')).join('')}</div>`:`<h2>Aucun animal ne correspond</h2><p>Essayez avec des critères moins précis.</p>`;}
  r.innerHTML=`<button class="back" style="padding-top:0" onclick="quitQuiz()">← Tous les quizz</button>${h}<p style="margin-top:20px"><button class="btn small ghost" style="color:var(--clay);border-color:var(--clay)" onclick="startQuiz(${QUIZ.indexOf(qz.q)})">Refaire ce quizz</button></p>`;
}

Object.keys(SLIDERS).forEach(k=>makeSlider(document.getElementById(k),SLIDERS[k]));
