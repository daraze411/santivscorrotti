import {Match} from './game.js';
let cards=[],m,selected=null,pay=new Set(),locked=false;
const $=s=>document.querySelector(s), other=t=>t==='Santi'?'Corrotti':'Santi';
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function info(c){return `<p><b>Principale:</b> ${esc(c.main||'Nessuno')}</p><p><b>Schieramento scoperto:</b> ${esc(c.faceUp||'Solo bonus universale: rimuovi 1 gettone iniziativa')}</p><p><b>Secondario:</b> ${esc(c.secondary||'Nessuno')}</p>`;}
function showDetail(c){hideTooltip();$('#detailTitle').textContent=c.name;$('#detailBody').innerHTML=info(c);$('#details').showModal();}
function choose(label,options,optional=false){return new Promise(resolve=>{const box=$('#choiceButtons');$('#choiceTitle').textContent=label;box.replaceChildren();for(const o of options){const b=document.createElement('button');b.textContent=o.label;b.onclick=()=>{$('#choice').close();resolve(o.id)};box.append(b);}if(optional){const b=document.createElement('button');b.textContent='Non applicare / salta';b.onclick=()=>{$('#choice').close();resolve(null)};box.append(b);}$('#choice').showModal();});}
function showBotAction(action){return new Promise(resolve=>{
 const dlg=$('#botAction');
 $('#botName').textContent=`${action.name} si attiva · iniziativa ${action.initiative}`;
 const lines=action.events.length?action.events:['Nessuna conseguenza aggiuntiva registrata.'];
 $('#botEvents').replaceChildren(...lines.map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));
 $('#botEffect').textContent=action.main?`Effetto principale: ${action.main}`:'Nessun effetto principale.';
 const button=$('#botContinue');
 button.onclick=()=>{dlg.close();resolve();};
 dlg.showModal();button.focus();
 });}
// Un solo pannello esterno alle carte: non puo essere tagliato dai contenitori del tavolo.
let hoverTooltip;
function getTooltip(){
 if(!hoverTooltip){
  hoverTooltip=document.createElement('div');
  hoverTooltip.className='floating-card-tooltip';
  hoverTooltip.setAttribute('role','tooltip');
  hoverTooltip.hidden=true;
  document.body.append(hoverTooltip);
 }
 return hoverTooltip;
}
function hideTooltip(){if(hoverTooltip)hoverTooltip.hidden=true;}
function showTooltip(el,c){
 if(window.matchMedia('(hover: none)').matches)return;
 const tip=getTooltip();
 tip.innerHTML=`<h3>${esc(c.name)}</h3>${info(c)}`;
 tip.hidden=false;
 const rect=el.getBoundingClientRect();
 const pad=12;
 const width=Math.min(380,window.innerWidth-pad*2);
 tip.style.width=width+'px';
 const x=Math.min(Math.max(pad,rect.left),window.innerWidth-width-pad);
 tip.style.left=x+'px';
 // Preferisci lo spazio sotto la carta; se manca, usa quello sopra.
 const desired=Math.min(tip.scrollHeight,Math.max(120,window.innerHeight-pad*2));
 let y=rect.bottom+8;
 if(y+desired>window.innerHeight-pad && rect.top-desired-8>=pad)y=rect.top-desired-8;
 if(y+desired>window.innerHeight-pad)y=window.innerHeight-desired-pad;
 tip.style.top=Math.max(pad,y)+'px';
}
function init(){fetch('./cards.json').then(r=>r.json()).then(data=>{cards=data;fixCards();$('#start').onclick=start;$('#play').onclick=play;$('#detailClose').onclick=()=>$('#details').close();start();}).catch(e=>{$('#status').textContent=e.message});}
function fixCards(){const fix={
 'mario-adinolfi':{main:'Un altro Santo ottiene +1 Dominio.',secondary:'Se hai altre due carte scoperte, Mario Adinolfi guadagna +1 Dominio.'},
 'martin-lutero':{main:'Scegli una tua carta che non si è ancora attivata. Il suo effetto secondario è annullato.'},
 'galileo-galilei':{main:'Guarda una carta coperta e, se vuoi, scambia i gettoni iniziativa di quella carta con un’altra carta coperta.',faceUp:''},
 'lucifero':{faceUp:''}
 };cards.forEach(c=>Object.assign(c,fix[c.id]||{}));}
function start(){hideTooltip();selected=null;pay.clear();locked=false;m=new Match(cards,$('#faction').value,choose,render,showBotAction);render();if(m.g.turn!==m.g.human)m.autoProgress().catch(err=>alert(err.message));}
async function play(){if(locked)return;locked=true;try{await m.playHuman(selected,$('#face').checked,[...pay]);selected=null;pay.clear();}catch(e){alert('Errore: '+e.message);console.error(e);}finally{locked=false;render();}}
function cardEl(x,team,hide=false,hand=false){const c=m.g.cards[hand?x:x.id];const hidden=hide&&!x.faceUp;const el=document.createElement('div');el.className='card'+(hidden?' hidden':'')+(x.dead?' dead':'')+(x.activated?' activated':'');if(hand&&selected===x)el.classList.add('selected');if(hand&&pay.has(x))el.classList.add('pay');
 if(hidden){el.innerHTML='<strong>CARTA COPERTA</strong>';}else{const summary=(c.main||'').slice(0,94);el.innerHTML=`<strong>${esc(c.name)}</strong><small>${esc(c.category)}</small><div class="stats">Costo ${c.cost} · Dominio ${hand?c.dominion:x.dominion}</div><span class="summary">${esc(summary)}${c.main.length>94?'…':''}</span><button class="detail-btn" type="button" aria-label="Mostra effetti di ${esc(c.name)}">ⓘ</button>`;el.querySelector('.detail-btn').onclick=e=>{e.stopPropagation();showDetail(c)};
 el.addEventListener('mouseenter',()=>showTooltip(el,c));
 el.addEventListener('mouseleave',hideTooltip);}
 if(!hand){const i=document.createElement('div');i.className='initiative';i.innerHTML=`<span>INIZIATIVA</span><b>${Math.max(0,x.initiative+(x.tokens||0))}</b>`;el.append(i);if(x.dead)el.title='Eliminata';}
 if(hand){el.onclick=()=>{if(locked||m.phase!=='deploy'||m.g.turn!==m.g.human)return;if(selected===x){selected=null;pay.clear();}else if(selected===null){selected=x;pay.clear();}else if(x!==selected){if(pay.has(x))pay.delete(x);else pay.add(x);}render();};}
 return el;}
function render(){hideTooltip();if(!m)return;const g=m.g,h=g.human,e=other(h),p=m.p(h);$('#enemy h2').textContent=`${e} · avversario`;$('#player h2').textContent=`${h} · tu`;$('#enemyBoard').replaceChildren(...m.p(e).board.map(x=>cardEl(x,e,true)));$('#myBoard').replaceChildren(...p.board.map(x=>cardEl(x,h)));$('#handCards').replaceChildren(...p.hand.map(id=>cardEl(id,h,false,true)));$('#scores').innerHTML=`<span>Round ${g.round}/2</span><span>Santi: ${m.p('Santi').score}</span><span>Corrotti: ${m.p('Corrotti').score}</span>`;$('#status').textContent=m.phase==='deploy'?`Schieramento ${g.plays+1}/8 · ${g.turn}`:m.phase==='finished'?'Partita terminata':m.phase==='activation'?'Risoluzione in corso': 'Tra i round';let c=g.cards[selected],cost=c?Math.max(0,c.cost-(c.category==='Comunisti'?m.discount[h]:0)):100;$('#play').disabled=locked||m.phase!=='deploy'||g.turn!==h||!c||pay.size!==cost;$('#play').textContent=c?`Schiera · scarta ${cost}`:'Schiera carta';$('#events').replaceChildren(...g.log.map(s=>{const el=document.createElement('div');el.textContent=s;return el;}));}
init();
