
const $=id=>document.getElementById(id);

const state={
  user:null,
  view:'available',
  animals:[],
  archive:[],
  documents:[]
};

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const speciesNames={
  chats:'Chat',
  chiens:'Chien',
  rongeurs:'Rongeur',
  oiseaux:'Oiseau',
  reptiles:'Reptile'
};

const speciesEmoji={
  chats:'🐈',
  chiens:'🐕',
  rongeurs:'🐹',
  oiseaux:'🐦',
  reptiles:'🦎'
};

function notice(message,isError=false){
  $('statusMessage').textContent=message;
  $('statusMessage').style.color=isError?'#a12d24':'';
}


function uploadTus(file, signed, bucketName) {
  if (!window.tus?.Upload) {
    throw new Error('La bibliothèque de transfert TUS est indisponible.');
  }

  return new Promise((resolve, reject) => {


    const upload = new window.tus.Upload(file, {
      endpoint: signed.endpoint,
      headers: {
        'x-signature': signed.token
      },
      metadata: {
        bucketName,
        objectName: signed.path,
        contentType: file.type,
        cacheControl: '3600'
      },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,

      onError(error) {
        reject(error);
      },

      onSuccess() {
        resolve();
      }
    });

    upload.start();
  });
}


async function init(){
  try{
    const result=await StaffAuth.api('/api/auth/me');
    state.user=result.user;

    $('memberLabel').textContent=`Connecté·e : ${result.user.display_name||result.user.username}`;

    if(result.user.role==='admin'){
      document.querySelectorAll('.admin-only').forEach(el=>el.hidden=false);
    }

    await loadAnimals();

  }catch(error){
    location.replace('connexion.html');
  }
}

async function loadAnimals(){
  const [active,archived]=await Promise.all([
    StaffAuth.api('/api/animals'),
    StaffAuth.api('/api/animals/archive')
  ]);

  state.animals=active.animals||[];
  state.archive=archived.animals||[];

  $('availableCount').textContent=state.animals.length;
  $('archivedCount').textContent=state.archive.length;

  renderAnimals();
}

function renderAnimals(){
  const list=state.view==='archive'?state.archive:state.animals;

  $('animalList').hidden=state.view==='documents'||state.view==='members';
  $('documentsPanel').hidden=state.view!=='documents';
  $('membersPanel').hidden=state.view!=='members';

  if(state.view==='documents'){
    loadDocuments();
    return;
  }

  if(state.view==='members'){
    loadMembers();
    return;
  }

  $('animalList').innerHTML=list.length
    ?list.map(a=>`
      <article class="animal-row" data-id="${esc(a.id)}">
        ${a.photos?.[0]?.url
          ?`<img src="${esc(a.photos[0].url)}" alt="Photo de ${esc(a.name)}">`
          :`<div class="animal-placeholder">${speciesEmoji[a.species]||'🐾'}</div>`}

        <div>
          <h3>${esc(a.name)}</h3>
          <p>${esc(speciesNames[a.species]||a.species)} · ${esc(a.age_label||'Âge non renseigné')} · ${esc(a.character||'Caractère non renseigné')}</p>
          <span class="status-pill">${state.view==='archive'?'Adopté · archivé':'En adoption'}</span>
        </div>

        <div class="row-actions">
          <button data-action="edit">Modifier</button>
          ${state.view==='archive'
            ?'<button data-action="restore">Republier</button>'
            :'<button data-action="archive">Adopté · archiver</button>'}
          <button class="danger" data-action="delete">Supprimer</button>
        </div>
      </article>
    `).join('')
    :'<div class="empty-state">Aucune annonce dans cette rubrique pour le moment.</div>';
}

function setView(view){
  state.view=view;

  document.querySelectorAll('.tab').forEach(tab=>
    tab.classList.toggle('active',tab.dataset.view===view)
  );

  $('animalEditor').hidden=true;
  notice('');
  renderAnimals();
}

document.querySelectorAll('.tab').forEach(tab=>
  tab.addEventListener('click',()=>setView(tab.dataset.view))
);

$('newAnimalButton').addEventListener('click',()=>openEditor());

$('closeEditor').addEventListener('click',closeEditor);
$('cancelEditor').addEventListener('click',closeEditor);

function closeEditor(){
  $('animalEditor').hidden=true;
  $('animalForm').reset();
  $('animalId').value='';
  $('photoPreview').innerHTML='';
}

function openEditor(animal=null){
  $('animalForm').reset();
  $('photoPreview').innerHTML='';
  $('animalId').value=animal?.id||'';
  $('editorTitle').textContent=animal?'Modifier une fiche':'Ajouter un animal';

  const map={
    animalName:'name',
    animalSpecies:'species',
    animalBreed:'breed',
    animalSex:'sex',
    animalAge:'age_label',
    animalAgeCategory:'age_category',
    animalCharacter:'character',
    animalSocial:'social_compatibility',
    animalWeight:'weight',
    animalDescription:'description',
    animalHealth:'health_notes'
  };

  for(const [id,key] of Object.entries(map)){
    $(id).value=animal?.[key]||(id==='animalAgeCategory'?'adulte':'');
  }

  if(animal?.photos?.length){
    $('photoPreview').innerHTML=animal.photos.map(p=>
      `<img src="${esc(p.url)}" alt="Photo existante">`
    ).join('');
  }

  $('animalEditor').hidden=false;
  $('animalEditor').scrollIntoView({behavior:'smooth',block:'start'});
}

$('animalPhotos').addEventListener('change',()=>{
  $('photoPreview').innerHTML=[...$('animalPhotos').files]
    .map(file=>`<span>${esc(file.name)}</span>`)
    .join('');
});

$('animalForm').addEventListener('submit',async event=>{
  event.preventDefault();

  const id=$('animalId').value;

  const body={
    name:$('animalName').value,
    species:$('animalSpecies').value,
    breed:$('animalBreed').value,
    sex:$('animalSex').value,
    age_label:$('animalAge').value,
    age_category:$('animalAgeCategory').value,
    character:$('animalCharacter').value,
    social_compatibility:$('animalSocial').value,
    weight:$('animalWeight').value,
    description:$('animalDescription').value,
    health_notes:$('animalHealth').value
  };

  const button=$('saveAnimal');
  button.disabled=true;
  button.textContent='Enregistrement…';

  try{
    const result=await StaffAuth.api(
      id?`/api/animals/${id}`:'/api/animals',
      {
        method:id?'PATCH':'POST',
        body:JSON.stringify(body)
      }
    );

    const animalId=result.animal.id;
    const files=[...$('animalPhotos').files];

    if(files.length){
      const signed=await StaffAuth.api(
        `/api/uploads/animals/${animalId}/photos/sign`,
        {
          method:'POST',
          body:JSON.stringify({
            files:files.map(file=>({
              name:file.name,
              type:file.type,
              size:file.size
            }))
          })
        }
      );

      for(let i=0;i<files.length;i++){
        await uploadTus(
  files[i],
  {...signed.uploads[i],endpoint:signed.endpoint},
  'animal-photos'
);
      }

      await StaffAuth.api(
        `/api/uploads/animals/${animalId}/photos/confirm`,
        {
          method:'POST',
          body:JSON.stringify({
            files:signed.uploads.map(file=>({
              uploadId:file.uploadId,
              path:file.path,
              name:file.name,
              type:file.type
            }))
          })
        }
      );
    }


    closeEditor();
    await loadAnimals();
    notice('Fiche enregistrée.');

  }catch(error){
    notice(error.message,true);

  }finally{
    button.disabled=false;
    button.textContent='Enregistrer la fiche';
  }
});

$('animalList').addEventListener('click',async event=>{
  const button=event.target.closest('button[data-action]');
  if(!button)return;

  const row=button.closest('[data-id]');
  const id=row.dataset.id;

  const animal=[...state.animals,...state.archive].find(a=>a.id===id);
  const action=button.dataset.action;

  try{
    if(action==='edit')return openEditor(animal);

    if(action==='delete'&&!confirm(`Supprimer définitivement l'annonce de ${animal.name} ?`)){
      return;
    }

    if(action==='archive'&&!confirm(`Marquer ${animal.name} comme adopté et déplacer son annonce dans les archives ?`)){
      return;
    }

    const routes={
      archive:`/api/animals/${id}/archive`,
      restore:`/api/animals/${id}/restore`,
      delete:`/api/animals/${id}`
    };

    await StaffAuth.api(routes[action],{
      method:action==='delete'?'DELETE':'PATCH'
    });

    await loadAnimals();

    notice(
      action==='delete'
        ?'Annonce supprimée.'
        :action==='archive'
          ?'Animal marqué comme adopté et archivé.'
          :'Annonce republiée.'
    );

  }catch(error){
    notice(error.message,true);
  }
});

// Déposer un document PDF

$('documentForm').addEventListener('submit',async event=>{
  event.preventDefault();

  const file=$('documentFile').files[0];
  if(!file)return;

  const button=$('documentForm').querySelector('button[type="submit"]');
  if(button)button.disabled=true;

  try{
    const signed=await StaffAuth.api('/api/uploads/documents/sign',{
  method:'POST',
  body:JSON.stringify({
    name:file.name,
    type:file.type,
    size:file.size
  })
});

await uploadTus(file,signed,'association-documents');

await StaffAuth.api('/api/uploads/documents/confirm',{
  method:'POST',
  body:JSON.stringify({
    uploadId:signed.uploadId,
    path:signed.path,
    name:signed.name,
    type:signed.type
  })
});

    $('documentForm').reset();

    await loadDocuments();
    notice('Document ajouté.');

  }catch(error){
    notice(error.message,true);

  }finally{
    if(button)button.disabled=false;
  }
});


// Charger et afficher les documents avec leurs boutons
async function loadDocuments(){
  try{
    const result=await StaffAuth.api('/api/documents');
    state.documents=result.documents||[];

    $('documentList').innerHTML=state.documents.length
      ?state.documents.map(d=>`
        <div class="document-item">
          <span>📄 ${esc(d.file_name)}</span>
          <div class="row-actions">
            <button data-doc-id="${esc(d.id)}">Télécharger</button>
            <button class="danger" data-delete-doc-id="${esc(d.id)}">Supprimer</button>
          </div>
        </div>
      `).join('')
      :'<p class="muted">Aucun document déposé.</p>';

  }catch(error){
    notice(error.message,true);
  }
}

// Télécharger ou supprimer un document
$('documentList').addEventListener('click',async event=>{
  const deleteButton=event.target.closest('[data-delete-doc-id]');

  if(deleteButton){
    const id=deleteButton.dataset.deleteDocId;
    const document=state.documents.find(d=>d.id===id);

    if(!document)return;

    if(!confirm(`Supprimer définitivement le document "${document.file_name}" ?`)){
      return;
    }

    deleteButton.disabled=true;

    try{
      await StaffAuth.api(`/api/documents/${id}`,{
        method:'DELETE'
      });

      await loadDocuments();
      notice('Document supprimé avec succès.');

    }catch(error){
      notice(error.message,true);
      deleteButton.disabled=false;
    }

    return;
  }

  const button=event.target.closest('[data-doc-id]');
  if(!button)return;

  try{
    const result=await StaffAuth.api(
      `/api/documents/${button.dataset.docId}`
    );

    window.open(result.url,'_blank','noopener');

  }catch(error){
    notice(error.message,true);
  }
});

// Créer un compte membre
$('memberForm').addEventListener('submit',async event=>{
  event.preventDefault();

  const body={
    username:$('memberUsername').value,
    email:$('memberEmail').value,
    display_name:$('memberDisplayName').value,
    password:$('memberPassword').value
  };

  try{
    await StaffAuth.api('/api/auth/members',{
      method:'POST',
      body:JSON.stringify(body)
    });

    $('memberForm').reset();

    await loadMembers();
    notice('Compte membre créé.');

  }catch(error){
    notice(error.message,true);
  }
});

// Afficher les membres
async function loadMembers(){
  try{
    const result=await StaffAuth.api('/api/auth/members');

    $('memberList').innerHTML=(result.members||[])
      .map(m=>`
        <div class="member-item">
          <span>
            <strong>${esc(m.username)}</strong> · ${esc(m.display_name||'')}
          </span>
          <span class="status-pill">${esc(m.role)}</span>
        </div>
      `).join('');

  }catch(error){
    notice(error.message,true);
  }
}

// Déconnexion
$('logoutButton').addEventListener('click',()=>{
  StaffAuth.clear();
  location.replace('connexion.html');
});

init();
