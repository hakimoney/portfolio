(function(){
  'use strict';
  const KEY='hakim-portfolio-content-v1';
  const admin=new URLSearchParams(location.search).get('admin')==='1';
  const managedSelector='body > nav, body > section, body > footer';
  const cardSelector='.cert,.proj-card,.edu-card,.lang-card';
  const schemas={
    'cert':[['Icône','.cert-ico'],['Certification','.cert-name'],['Organisme / statut','.cert-iss'],['Année','.cert-yr']],
    'proj-card':[['Numéro','.proj-n'],['Titre','.proj-title'],['Technologies','.proj-tech'],['Description','.proj-desc'],['Lien GitHub','.proj-card a','href']],
    'edu-card':[['Diplôme','.edu-deg'],['Mention','.edu-rank'],['École','.edu-school'],['Dates','.edu-date']],
    'exp-item':[['Poste','.exp-title'],['Dates','.exp-date'],['Organisation','.exp-org']],
    'lang-card':[['Langue','.lang-name'],['Niveau','.lang-level']],
    'sk-box':[['Catégorie','.sk-cat']]
  };
  let selected=null, history=[];

  function snapshot(){return [...document.querySelectorAll(managedSelector)].map(el=>{const clone=el.cloneNode(true);clone.querySelectorAll('[data-cms-selected]').forEach(n=>n.removeAttribute('data-cms-selected'));clone.removeAttribute('data-cms-selected');return clone.outerHTML})}
  function apply(parts){
    if(!Array.isArray(parts)||!parts.length)return;
    const current=[...document.querySelectorAll(managedSelector)];
    current.forEach((el,i)=>{if(parts[i])el.outerHTML=parts[i];else el.remove()});
    if(parts.length>current.length){
      const anchor=document.querySelector('body > script');
      parts.slice(current.length).forEach(html=>anchor.insertAdjacentHTML('beforebegin',html));
    }
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
  }
  function load(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&data.sections)apply(data.sections)}catch(e){console.warn('CMS: contenu ignoré',e)}}
  load();
  // Mise à jour ponctuelle du texte d'introduction, y compris lorsqu'une
  // ancienne copie du portfolio est déjà enregistrée dans le navigateur.
  const heroMigrationKey='hakim-portfolio-migration-hero-v2';
  if(!localStorage.getItem(heroMigrationKey)){
    const hero=document.querySelector('.hero-desc');
    if(hero){
      hero.innerHTML='Solutions IA robustes orientées <strong>données &amp; automatisation</strong>. Court terme : <strong>CDI ou CDD — Data Scientist · AI Engineer · Data Engineer</strong>. Moyen terme : <strong>Thèse CIFRE</strong> sur la détection d’anomalies, la cybersécurité, la XAI, l’aide à la décision ou le ML appliqué à la santé, à l’industrie et à la finance.';
      const saved=localStorage.getItem(KEY);
      if(saved)localStorage.setItem(KEY,JSON.stringify({version:2,updatedAt:new Date().toISOString(),sections:snapshot()}));
    }
    localStorage.setItem(heroMigrationKey,'1');
  }
  // Migration des cartes de certification qui ont perdu leur structure avec
  // l'ancienne version de l'éditeur.
  document.querySelectorAll('.cert').forEach(card=>{
    if(card.querySelector('.cert-name'))return;
    const raw=card.textContent.trim().replace(/\s+/g,' ');
    const name=raw.replace(/^[^\p{L}\p{N}]+/u,'')||'Nouvelle certification';
    const isMicrosoft=/microsoft|azure/i.test(name);
    card.innerHTML=`<div class="cert-ico">${isMicrosoft?'☁️':'🎓'}</div><div><div class="cert-name"></div><div class="cert-iss">${isMicrosoft?'Microsoft':'Organisme à renseigner'}</div></div><div class="cert-yr">2026</div>`;
    card.querySelector('.cert-name').textContent=name;
  });
  if(!admin)return;

  document.body.classList.add('cms-admin');
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
  const panel=document.createElement('aside');panel.className='cms-panel';panel.innerHTML=`
    <div class="cms-brand">PORTFOLIO STUDIO</div><div class="cms-sub">Cliquez sur un texte, une image, un lien ou une section pour le modifier.</div>
    <div class="cms-grid"><button class="cms-btn primary wide" data-act="save">Enregistrer</button><button class="cms-btn" data-act="undo">Annuler</button><button class="cms-btn" data-act="preview">Voir le site</button></div>
    <div class="cms-status" id="cms-status">● Modifications locales</div>
    <div class="cms-group"><div class="cms-group-title">ÉLÉMENT SÉLECTIONNÉ</div><div id="cms-fields" class="cms-empty">Aucun élément sélectionné</div><div class="cms-grid" id="cms-actions" hidden><button class="cms-btn" data-act="up">↑ Monter</button><button class="cms-btn" data-act="down">↓ Descendre</button><button class="cms-btn wide" data-act="duplicate">＋ Ajouter un élément similaire</button><button class="cms-btn danger" data-act="delete">Supprimer l’élément</button><button class="cms-btn danger" data-act="delete-block">Supprimer le bloc</button></div></div>
    <div class="cms-group"><div class="cms-group-title">AJOUTER</div><div class="cms-grid"><button class="cms-btn" data-add="text">Texte</button><button class="cms-btn" data-add="link">Lien</button><button class="cms-btn" data-add="image">Image</button><button class="cms-btn" data-add="section">Section</button></div></div>
    <div class="cms-group"><div class="cms-group-title">DONNÉES</div><div class="cms-grid"><button class="cms-btn" data-act="export">Exporter JSON</button><label class="cms-file-label">Importer JSON<input id="cms-import" type="file" accept="application/json"></label><button class="cms-btn danger wide" data-act="reset">Restaurer l’original</button></div><div class="cms-help">La sauvegarde est conservée dans ce navigateur. Exportez le JSON pour garder une copie ou transférer le contenu.</div></div>`;
  document.body.appendChild(panel);
  const toast=document.createElement('div');toast.className='cms-toast';document.body.appendChild(toast);
  const fields=panel.querySelector('#cms-fields'), actions=panel.querySelector('#cms-actions');
  function say(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
  function checkpoint(){history.push(snapshot());if(history.length>30)history.shift()}
  function schemaFor(el){const cls=Object.keys(schemas).find(c=>el.classList.contains(c));return cls?schemas[cls]:null}
  function richToMarkdown(el){
    const clone=el.cloneNode(true);
    clone.querySelectorAll('strong,b').forEach(node=>node.replaceWith(document.createTextNode(`**${node.textContent}**`)));
    clone.querySelectorAll('br').forEach(node=>node.replaceWith(document.createTextNode('\n')));
    return clone.textContent.trim();
  }
  function markdownToHtml(value){
    const safe=value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return safe.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  }
  function select(el){
    if(selected)selected.removeAttribute('data-cms-selected');
    selected=el;if(!el){fields.className='cms-empty';fields.textContent='Aucun élément sélectionné';actions.hidden=true;return}
    el.setAttribute('data-cms-selected','');actions.hidden=false;fields.className='';
    const tag=el.tagName.toLowerCase(), schema=schemaFor(el), isContainer=el.children.length>0;
    if(schema){
      fields.innerHTML=`<span class="cms-badge">${[...el.classList].find(c=>schemas[c])||tag}</span>`+schema.map(([label,selector,attr])=>`<label class="cms-field">${label}<textarea data-selector="${selector}" data-attr="${attr||''}"></textarea></label>`).join('');
      fields.querySelectorAll('[data-selector]').forEach(input=>{const target=el.matches(input.dataset.selector)?el:el.querySelector(input.dataset.selector);input.value=target?(input.dataset.attr?target.getAttribute(input.dataset.attr)||'':target.textContent.trim()):''});
    }else{
      const rich=tag==='p';
      fields.innerHTML=`<span class="cms-badge">${tag}${el.id?' #'+el.id:''}</span>${rich?'<label class="cms-field">Texte complet<textarea data-field="rich"></textarea></label><div class="cms-help">Encadrez un passage avec **deux étoiles** pour le mettre en gras.</div>':!isContainer&&tag!=='img'?'<label class="cms-field">Texte<textarea data-field="text"></textarea></label>':''}${tag==='a'?'<label class="cms-field">Adresse du lien<input data-field="href"></label>':''}${tag==='img'?'<label class="cms-field">Adresse de l’image<input data-field="src"></label><label class="cms-field">Texte alternatif<input data-field="alt"></label>':''}${['section','nav','footer'].includes(tag)?'<label class="cms-field">Identifiant<input data-field="id"></label>':''}${isContainer&&!rich&&!['section','nav','footer'].includes(tag)?'<div class="cms-help">Sélectionnez un texte précis dans ce bloc pour le modifier.</div>':''}`;
    }
    const text=fields.querySelector('[data-field="text"]');if(text)text.value=el.textContent.trim();
    const rich=fields.querySelector('[data-field="rich"]');if(rich)rich.value=richToMarkdown(el);
    fields.querySelectorAll('input').forEach(input=>input.value=el.getAttribute(input.dataset.field)||'');
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('.cms-panel'))return;
    const card=e.target.closest(cardSelector), paragraph=e.target.closest('p');
    const el=card||paragraph||e.target.closest('body > section *, body > section, body > nav *, body > nav, body > footer *, body > footer');
    if(!el)return;e.preventDefault();e.stopPropagation();select(el);
  },true);
  fields.addEventListener('focusin',checkpoint,{once:false});
  fields.addEventListener('input',e=>{if(!selected)return;const selector=e.target.dataset.selector;if(selector){const target=selected.matches(selector)?selected:selected.querySelector(selector);if(target){const attr=e.target.dataset.attr;if(attr)target.setAttribute(attr,e.target.value);else target.textContent=e.target.value}return}const f=e.target.dataset.field;if(f==='text')selected.textContent=e.target.value;else if(f==='rich')selected.innerHTML=markdownToHtml(e.target.value);else if(f)selected.setAttribute(f,e.target.value)});
  function sibling(dir){if(!selected)return;const target=dir<0?selected.previousElementSibling:selected.nextElementSibling;if(!target)return;checkpoint();if(dir<0)target.before(selected);else target.after(selected)}
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;const act=b.dataset.act,add=b.dataset.add;
    if(act==='save'){localStorage.setItem(KEY,JSON.stringify({version:1,updatedAt:new Date().toISOString(),sections:snapshot()}));history=[];say('Contenu enregistré')}
    if(act==='preview')window.open('index.html','_blank');
    if(act==='undo'&&history.length){apply(history.pop());select(null);say('Modification annulée')}
    if(act==='up')sibling(-1);if(act==='down')sibling(1);
    if(act==='duplicate'&&selected){checkpoint();const clone=selected.cloneNode(true);clone.removeAttribute('id');selected.after(clone);select(clone)}
    if(act==='delete'&&selected&&confirm('Supprimer cet élément ?')){checkpoint();const old=selected;select(null);old.remove()}
    if(act==='delete-block'&&selected){const block=selected.closest('.cert,.proj-card,.edu-card,.exp-item,.lang-card,.sk-box,p,li,section');if(block&&confirm('Supprimer tout ce bloc ?')){checkpoint();select(null);block.remove()}}
    if(act==='export'){const blob=new Blob([JSON.stringify({version:1,updatedAt:new Date().toISOString(),sections:snapshot()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='portfolio-content.json';a.click();URL.revokeObjectURL(a.href)}
    if(act==='reset'&&confirm('Supprimer toutes les modifications locales et restaurer le portfolio original ?')){localStorage.removeItem(KEY);location.reload()}
    if(add){checkpoint();let el;if(add==='section'){el=document.createElement('section');el.id='nouvelle-section';el.innerHTML='<div class="sec-label reveal visible">NOUVELLE SECTION</div><h2 class="sec-title reveal visible"><span class="hi">Titre</span><span class="lo">// SOUS-TITRE</span></h2><p class="about-p reveal visible">Votre contenu ici.</p>';document.querySelector('body > footer').before(el)}else{el=document.createElement(add==='text'?'p':add==='link'?'a':'img');if(add==='text'){el.className='about-p';el.textContent='Nouveau texte'}if(add==='link'){el.className='c-link';el.href='#';el.textContent='Nouveau lien'}if(add==='image'){el.src='https://placehold.co/800x500/080f20/00d4ff?text=Votre+image';el.alt='Nouvelle image';el.style.maxWidth='100%'}const host=selected?.closest('section')||document.querySelector('body > section:last-of-type');host.appendChild(el)}select(el);el.scrollIntoView({behavior:'smooth',block:'center'})}
  });
  panel.querySelector('#cms-import').addEventListener('change',async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.sections))throw Error();checkpoint();apply(data.sections);select(null);localStorage.setItem(KEY,JSON.stringify(data));say('Contenu importé')}catch{alert('Fichier JSON invalide.')}});
  window.addEventListener('beforeunload',e=>{if(history.length){e.preventDefault();e.returnValue=''}});
})();
