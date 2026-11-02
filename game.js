import {newGame,deploy,initiativeOf,order,shuffle} from './engine.js';
const other=t=>t==='Santi'?'Corrotti':'Santi';
export class Match{
 constructor(cards,human,choose,update,onAutoAction=async()=>{}){this.onAutoAction=onAutoAction;this.g=newGame(cards,human);this.choose=choose;this.update=update;this.cancel=new Set();this.protect=new Map();this.immune=new Set();this.muted=new Set();this.revealed=new Set();this.categoryPenalties=[];this.discount={Santi:0,Corrotti:0};this.lastPaid={Santi:0,Corrotti:0};this.phase='deploy';this.scored=[];this.nextSkip={Santi:0,Corrotti:0};this.lastActivation=null;this.suppressedMain=new Set();this.tieLast=new Map();}
 notify(s){this.g.log.unshift(s);this.update();}
 p(t){return this.g.parties[t];}
 card(x){return this.g.cards[x.id];}
 live(t){return this.p(t).board.filter(x=>!x.dead);}
 all(){return ['Santi','Corrotti'].flatMap(t=>this.live(t).map(x=>({x,t})));}
 id(x){return this.card(x).id;}
 eligible(t,pred=()=>true){return this.live(t).filter(pred);}
 async select(actor,items,label,optional=false){if(!items.length)return null;if(actor!==this.g.human)return items[Math.floor(this.g.random()*items.length)];return await this.choose(label,items.map((x,i)=>({id:String(i),label:x.label||this.card(x.x||x).name})),optional).then(i=>i===null?null:items[Number(i)]);}
 async target(actor,team,pred,label,optional=false){return this.select(actor,this.eligible(team,pred).map(x=>({x,label:`${x.faceUp||team===actor||this.revealed.has(x)&&actor===this.g.human?this.card(x).name:'Carta coperta'} · D ${x.dominion} · I ${initiativeOf(x)}`})),label,optional).then(v=>v?.x||null);}
 plus(x,n){if(!x||x.dead)return;x.dominion=Math.max(0,x.dominion+n);}
 token(x,n){if(!x||x.dead)return;x.tokens=Math.max(-x.initiative,(x.tokens||0)+n);}
 remove(x,t,by){if(!x||x.dead)return false;if(this.immune.has(x))return false;const guard=this.protect.get(x);if(guard&&!guard.dead){this.protect.delete(x);this.notify(`${this.card(guard).name} protegge ${this.card(x).name}.`);return false;}x.dead=true;this.notify(`${this.card(x).name} viene eliminato.`);if(this.id(x)==='charles-baudelaire')this.pendingBaudelaire=t;if(this.id(x)==='san-lorenzo'&&by&&by!==x)this.remove(by,other(t),x);return true;}
 refreshHand(t){let p=this.p(t),count=0;while(p.hand.length<4&&(p.deck.length||p.discard.length)&&count++<40){if(!p.deck.length){p.deck=shuffle(p.discard,this.g.random);p.discard=[];}p.hand.push(p.deck.pop());}}
 async applyFace(t,x){const id=this.id(x),enemy=other(t);const tar=(team,pred,txt,optional)=>this.target(t,team,pred,txt,optional);
 // Bonus universale della carta scoperta
 let own=await tar(t,y=>true,'Bonus scoperto: rimuovi 1 gettone iniziativa da quale tua carta?',true);if(own)this.token(own,-1);
 switch(id){
 case 'santa-barbara':{const last=this.p(enemy).board.at(-1),p=this.p(enemy);if(last&&p.hand.length){const choice=await this.select(enemy,p.hand.map(id=>({id,label:this.g.cards[id].name})), 'Santa Barbara: scegli la carta sostitutiva');if(choice){const idx=p.hand.indexOf(choice.id);p.hand[idx]=last.id;last.id=choice.id;last.dominion=this.card(last).dominion;this.notify('Santa Barbara costringe a sostituire l’ultima carta avversaria.');}}break;}
 case 'san-lorenzo':{let y=await tar(t,z=>(z.tokens||0)>-z.initiative,'Rimuovi 1 gettone iniziativa',true);if(y)this.token(y,-1);break;}
 case 'san-rocco':{let y=await tar(enemy,z=>true,'Aggiungi 1 gettone iniziativa avversario');if(y)this.token(y,1);break;}
 case 'san-benedetto':{let p=this.p(t);if(p.discard.length){let it=await this.select(t,p.discard.map(id=>({id,label:this.g.cards[id].name})), 'Recupera una carta dagli scarti',true);if(it){p.discard.splice(p.discard.indexOf(it.id),1);p.hand.push(it.id);}}break;}
 case 'santa-lucia':{let a=await tar(t,z=>true,'Prima carta per scambiare i gettoni',true),b=a&&await tar(t,z=>z!==a,'Seconda carta per scambiare i gettoni',true);if(b)[a.tokens,b.tokens]=[b.tokens,a.tokens];break;}
 case 'san-paolo':{let a=await tar(t,z=>(z.tokens||0)>-z.initiative,'Sposta un gettone: origine',true),b=a&&await tar(enemy,z=>true,'Sposta un gettone: destinazione',true);if(a&&b){this.token(a,-1);this.token(b,1);}break;}
 case 'karl-marx':this.discount[t]=1;break;
 case 'joseph-stalin':{let a=await tar(t,z=>(z.tokens||0)>-z.initiative,'Rimuovi un gettone iniziativa',true);if(a)this.token(a,-1);break;}
 case 'ozzy-osbourne':this.plus(x,1);break;
 case 'charles-baudelaire':{let a=await tar(enemy,z=>true,'Aggiungi un gettone iniziativa');if(a)this.token(a,1);break;}
 case 'giuliano-lapostata':this.notify('Giuliano annulla un bonus scoperto avversario, se ancora applicabile (effetti già consumati non vengono riavvolti).');break;
 case 'giordano-bruno':{let a=await tar(t,z=>z!==x&&this.card(z).category==='Comunisti','Sacrifica un Comunista',true);if(a&&this.remove(a,t,x))this.plus(x,3);break;}
 case 'galileo-galilei':{let a=await tar(enemy,z=>!z.faceUp,'Galileo guarda una carta coperta',true);if(a){this.revealed.add(a);this.notify(`Galileo osserva ${this.card(a).name}.`);let b=await tar(enemy,z=>!z.faceUp&&z!==a,'Scambia gettoni con un’altra carta coperta?',true);if(b)[a.tokens,b.tokens]=[b.tokens,a.tokens];}break;}
 }
 }
 async playHuman(id,face,pays){const t=this.g.human;const c=this.g.cards[id];const p=this.p(t);if(this.phase!=='deploy'||this.g.turn!==t)throw Error('Non è il tuo turno.');const actual=Math.max(0,c.cost-(c.category==='Comunisti'?this.discount[t]:0));if(pays.length!==actual||new Set(pays).size!==pays.length||pays.some(q=>q===id||!p.hand.includes(q)))throw Error(`Occorrono ${actual} carte per pagare.`);await this.place(t,id,face,pays);await this.autoProgress();}
 async place(t,id,face,pays){const g=this.g,c=g.cards[id],p=this.p(t);const actual=Math.max(0,c.cost-(c.category==='Comunisti'?this.discount[t]:0));if(c.category==='Comunisti')this.discount[t]=0;if(pays.length!==actual)throw Error('Pagamento errato');p.hand=p.hand.filter(q=>q!==id&&!pays.includes(q));p.discard.push(...pays);let x={id,faceUp:face,initiative:c.cost,dominion:c.dominion,activated:false,tokens:0,slot:p.board.length,dead:false,paid:actual};p.board.push(x);this.lastPaid[t]+=actual;g.plays++;this.notify(`${t} schiera ${face?c.name:'una carta coperta'} (I ${c.cost}).`);if(face)await this.applyFace(t,x);for(const penalty of this.categoryPenalties){if(penalty.team===t&&c.category===penalty.category&&face)this.plus(x,-1);}this.refreshHand(t);if(g.plays===8){this.phase='activation';g.phase='activation';this.notify('Schieramento concluso: inizia l’attivazione.');}else g.turn=other(t);this.update();}
 async autoProgress(){const g=this.g,bot=other(g.human);while(this.phase==='deploy'&&g.turn===bot){const p=this.p(bot);const allowed=p.hand.filter(id=>Math.max(0,g.cards[id].cost-(g.cards[id].category==='Comunisti'?this.discount[bot]:0))<=p.hand.length-1);if(!allowed.length)throw Error('Automa senza mosse legali');allowed.sort((a,b)=>g.cards[b].dominion-g.cards[a].dominion);const id=allowed[Math.floor(g.random()*Math.min(3,allowed.length))];const n=Math.max(0,g.cards[id].cost-(g.cards[id].category==='Comunisti'?this.discount[bot]:0));await this.place(bot,id,g.random()>.35,p.hand.filter(q=>q!==id).slice(0,n));}if(this.phase==='activation')await this.resolve();}
 async main(t,x,depth=0){if(depth>4||x.dead)return;const id=x._copyId||this.id(x),enemy=other(t),tar=(team,pred,txt,optional)=>this.target(t,team,pred,txt,optional);let a,b;
 switch(id){
 case 'san-giorgio':a=await tar(enemy,z=>!z.faceUp,'San Giorgio: elimina una carta coperta',true);if(a)this.remove(a,enemy,x);break;
 case 'san-sebastiano':this.immune.add(x);break;
 case 'santa-barbara':a=await tar(enemy,z=>z.faceUp&&z.dominion<=(this.live(t).some(q=>q.activated&&this.card(q).category==='Mistici')?3:2),'Santa Barbara: elimina un nemico scoperto',true);if(a)this.remove(a,enemy,x);break;
 case 'san-lorenzo':break;
 case 'san-gennaro':break;
 case 'san-rocco':a=await tar(t,z=>z!==x&&this.card(z).category!==this.card(x).category,'San Rocco: proteggi un alleato',true);if(a){this.protect.set(a,x);this.plus(x,-1);}break;
 case 'san-pantaleone':{const p=this.p(t),canE=p.hand.length>=2;a=await tar(enemy,z=>this.card(z).category==='Comunisti'||(canE&&this.card(z).category==='Demoni ed eretici'),'San Pantaleone: elimina Comunista o Eretico',true);if(a)this.remove(a,enemy,x);break;}
 case 'santa-rita':{let opts=this.live(t).filter(z=>z!==x&&z.activated&&this.card(z).main);a=await this.select(t,opts.map(x=>({x})), 'Santa Rita: copia un Santo già attivato',true);if(a){if(this.id(a.x)==='santa-rita')break;x._copyId=a.x.id;await this.main(t,x,depth+1);delete x._copyId;if(this.id(a.x)==='san-giorgio'){b=await tar(t,z=>z.dominion>=2,'Penalità Rita: elimina un Santo',true);if(b)this.remove(b,t,x);}}break;}
 case 'san-pietro':{const dead=this.p(t).board.filter(z=>z.dead);a=await this.select(t,dead.map(x=>({x})), 'San Pietro: riporta in gioco un eliminato',true);if(a){a.x.dead=false;a.x.activated=true;this.notify(`${this.card(a.x).name} torna in gioco.`);}break;}
 case 'san-benedetto':this.cancel.add(enemy);break;
 case 'santa-lucia':a=await tar(enemy,z=>!z.faceUp,'Santa Lucia: guarda una carta coperta',true);if(a){this.revealed.add(a);this.notify(`Santa Lucia vede ${this.card(a).name}.`);}break;
 case 'san-paolo':a=await tar(enemy,z=>z.faceUp,'San Paolo: -2 Dominio',true);if(a)this.plus(a,-2);break;
 case 'padre-pio':a=await tar(enemy,z=>z.faceUp&&this.card(z).category==='Artista','Padre Pio: un Artista perde 2 Dominio',true);if(a)this.plus(a,-2);break;
 case 'mario-adinolfi':a=await tar(t,z=>z!==x,'Adinolfi: +1 Dominio a un altro Santo',true);if(a)this.plus(a,1);break;
 case 'claudia-koll':a=await tar(t,z=>true,'Claudia Koll: primo Santo +1',true);if(a){this.plus(a,1);b=await tar(t,z=>z!==a,'Claudia Koll: secondo Santo +1',true);if(b)this.plus(b,1);}break;
 case 'paolo-brosio':{const p=this.p(t),pending=this.live(t).filter(z=>!z.activated&&z!==x);a=await tar(t,z=>pending.includes(z),'Paolo Brosio: sostituisci una carta non attivata',true);if(a&&p.hand.length){b=await this.select(t,p.hand.map(id=>({id,label:this.g.cards[id].name})), 'Scegli una carta dalla mano',true);if(b){p.discard.push(a.id);a.id=b.id;a.dominion=this.card(a).dominion;a.faceUp=false;p.hand.splice(p.hand.indexOf(b.id),1);this.refreshHand(t);}}break;}
 case 'karl-marx':this.live(t).filter(z=>z!==x&&z.faceUp&&this.card(z).category==='Comunisti').forEach(z=>this.plus(z,1));break;
 case 'vladimir-lenin':if(this.live(t).some(z=>z!==x&&z.faceUp&&this.card(z).category==='Comunisti')){a=await tar(enemy,z=>z.faceUp,'Lenin: elimina un avversario scoperto',true);if(a)this.remove(a,enemy,x);}break;
 case 'joseph-stalin':a=await tar(t,z=>z!==x&&z.faceUp&&this.card(z).category==='Comunisti','Stalin: sacrifica un altro Comunista',true);if(a){b=await tar(enemy,z=>z.faceUp,'Stalin: elimina un Santo scoperto',true);if(b){this.remove(a,t,x);this.remove(b,enemy,x);}}break;
 case 'friedrich-engels':a=await tar(t,z=>true,'Engels: primo destinatario (+1 o +2)',true);if(a){b=await tar(t,z=>z!==a,'Engels: secondo destinatario',true);if(b){const amt=await this.select(t,[{label:'Primo +1, secondo +2',n:1},{label:'Primo +2, secondo +1',n:2}],'Distribuisci 3 Dominio');this.plus(a,amt?.n||1);this.plus(b,3-(amt?.n||1));}}break;
 case 'ozzy-osbourne':{let cats=[...new Set(this.live(enemy).map(z=>this.card(z).category))];a=await this.select(t,cats.map(category=>({category,label:category})), 'Ozzy: categoria da penalizzare',true);if(a){this.categoryPenalties.push({team:enemy,category:a.category});this.live(enemy).filter(z=>z.faceUp&&this.card(z).category===a.category).forEach(z=>this.plus(z,-1));}break;}
 case 'rocco-siffredi':if(!this.live(t).some(z=>z!==x&&!z.activated))this.plus(x,2);break;
 case 'charles-baudelaire':break;
 case 'salvador-dali':{let pool=this.all().filter(({x})=>x.faceUp);a=await this.select(t,pool.map(z=>({...z,label:`${this.card(z.x).name} (${z.x.dominion})`})), 'Dalí: prima carta',true);if(a){b=await this.select(t,pool.filter(z=>z.x!==a.x).map(z=>({...z,label:`${this.card(z.x).name} (${z.x.dominion})`})), 'Dalí: seconda carta',true);if(b)[a.x.dominion,b.x.dominion]=[b.x.dominion,a.x.dominion];}break;}
 case 'diocleziano':a=await tar(enemy,z=>!z.faceUp,'Diocleziano: elimina una carta coperta',true);if(a)this.remove(a,enemy,x);break;
 case 'nerone':{if(this.live(t).some(z=>z.activated&&this.card(z).category==='Demoni ed eretici')){let opts=this.live(t).filter(z=>z!==x&&z.activated&&this.card(z).main&&this.id(z)!=='nerone');a=await this.select(t,opts.map(x=>({x})), 'Nerone: copia un Corrotto attivo',true);if(a)x._copyId=a.x.id;await this.main(t,x,depth+1);delete x._copyId;}break;}
 case 'giuliano-lapostata':if(this.live(t).some(z=>z.faceUp&&this.card(z).category==='Artista')){a=await tar(enemy,z=>true,'Giuliano: -2 Dominio a un Santo',true);if(a)this.plus(a,-2);}break;
 case 'martin-lutero':a=await tar(t,z=>!z.activated&&z!==x,'Lutero: annulla il secondario di una tua carta',true);if(a)this.muted.add(a);break;
 case 'lucifero':a=await tar(enemy,z=>z.faceUp,'Lucifero: elimina un Santo scoperto',true);if(a)this.remove(a,enemy,x);if(this.live(t).some(z=>z.activated&&this.card(z).category==='Persecutori')){b=await tar(enemy,z=>z!==a,'Lucifero: -1 Dominio a un altro Santo',true);if(b)this.plus(b,-1);}break;
 case 'belzebu':a=await tar(enemy,z=>z.faceUp&&z.dominion<=2,'Belzebù: elimina una carta con Dominio ≤2',true);if(a)this.remove(a,enemy,x);break;
 case 'giordano-bruno':break;
 case 'galileo-galilei':break;
 }
 }
 async secondary(t,x){const id=this.id(x),enemy=other(t),tar=(team,pred,txt,optional)=>this.target(t,team,pred,txt,optional);let a;
 switch(id){
 case 'san-giorgio':{const pending=this.live(t).filter(z=>!z.activated&&z!==x);if(pending.length){this.nextSkip[t]++;}else{a=await tar(t,z=>z!==x,'San Giorgio: elimina un tuo Santo',true);if(a)this.remove(a,t,x);}break;}
 case 'san-sebastiano':if(this.live(enemy).filter(z=>z.activated).length>this.live(t).filter(z=>z.activated).length)this.plus(x,1-x.dominion);break;
 case 'san-gennaro':{const before=this.p(t).board[x.slot-1];if(before&&!before.dead){if(before.faceUp)before.dominion=0;else this.suppressedMain.add(before);}break;}
 case 'san-pantaleone':{let pool=this.all().filter(({x})=>x.tokens> -x.initiative);a=await this.select(enemy,pool.map(q=>({...q,label:this.card(q.x).name})), 'San Pantaleone: sposta un gettone',true);if(a){let b=await this.select(enemy,this.all().filter(q=>q.x!==a.x).map(q=>({...q,label:this.card(q.x).name})), 'Scegli destinazione',true);if(b){this.token(a.x,-1);this.token(b.x,1);}}break;}
 case 'san-pietro':{a=await tar(enemy,z=>true,'San Pietro: raddoppia un effetto avversario',true);if(a&&a.activated&&this.card(a).main)await this.main(enemy,a,1);break;}
 case 'padre-pio':a=await tar(enemy,z=>z.faceUp&&this.card(z).category==='Persecutori','Padre Pio: +1 Dominio a un Persecutore',true);if(a)this.plus(a,1);break;
 case 'mario-adinolfi':if(this.live(t).filter(z=>z!==x&&z.faceUp).length>=2)this.plus(x,1);break;
 case 'claudia-koll':{for(let i=0;i<2;i++){a=await tar(enemy,z=>z.tokens> -z.initiative,'Claudia Koll: avversario rimuove un gettone',true);if(a)this.token(a,-1);}break;}
 case 'charles-baudelaire':break;
 case 'lucifero':{let p=this.p(enemy),pool=[];for(let i=0;i<2;i++){if(!p.deck.length&&p.discard.length){p.deck=shuffle(p.discard,this.g.random);p.discard=[];}if(p.deck.length)pool.push(p.deck.pop());}if(pool.length){let sorted=[...pool].sort((a,b)=>this.g.cards[a].cost-this.g.cards[b].cost);let min=this.g.cards[sorted[0]].cost;let options=pool.filter(q=>this.g.cards[q].cost===min);let picked=options.length===1?options[0]:(await this.select(enemy,options.map(id=>({id,label:this.g.cards[id].name})), 'Lucifero: scegli la carta meno costosa'))?.id||options[0];const temp={id:picked,dominion:this.g.cards[picked].dominion,faceUp:true,activated:true,tokens:0,initiative:this.g.cards[picked].cost,dead:false};await this.main(enemy,temp,1);p.discard.push(...pool);}break;}
 }
 }
 async resolve(){const g=this.g;while(this.phase==='activation'){
 const remaining=this.all().filter(({x})=>!x.activated);if(!remaining.length)break;
 const min=Math.min(...remaining.map(z=>initiativeOf(z.x)));const tied=remaining.filter(z=>initiativeOf(z.x)===min);
 const exposed=t=>this.live(t).filter(x=>x.faceUp).length,paid=t=>this.lastPaid[t];let first=exposed('Santi')!==exposed('Corrotti')?(exposed('Santi')>exposed('Corrotti')?'Santi':'Corrotti'):paid('Santi')!==paid('Corrotti')?(paid('Santi')<paid('Corrotti')?'Santi':'Corrotti'):g.starter;
 if(this.tieLast.has(min)&&tied.some(z=>z.t===other(this.tieLast.get(min))))first=other(this.tieLast.get(min));if(!tied.some(z=>z.t===first))first=other(first);
 let opts=tied.filter(z=>z.t===first);let chosen=await this.select(first,opts.map(z=>({...z,label:`${this.card(z.x).name} · slot ${z.x.slot+1}`})), 'Scegli la prossima carta da attivare');let {x,t}=chosen||opts[0];this.tieLast.set(min,t);x.activated=true;if(!x.faceUp){x.faceUp=true;this.notify(`${t} rivela ${this.card(x).name}.`);}this.notify(`${this.card(x).name} si attiva (iniziativa ${min}).`);
 const logBeforeEffects=this.g.log.length;
 const before=this.all().map(({x,t})=>({x,t,name:this.card(x).name,faceUp:x.faceUp,dominion:x.dominion,tokens:x.tokens,dead:x.dead}));
 if(this.nextSkip[t]>0){this.nextSkip[t]--; this.notify(`Effetto principale di ${this.card(x).name} annullato da San Giorgio.`);}else if(this.suppressedMain.has(x)){this.notify(`Effetto principale di ${this.card(x).name} annullato da San Gennaro.`);}else if(this.cancel.has(t)){this.cancel.delete(t);this.notify(`Effetto principale di ${this.card(x).name} annullato da San Benedetto.`);}else await this.main(t,x);
 if(!x.dead&&!this.muted.has(x))await this.secondary(t,x);
 this.update();
 if(t!==g.human){
  const events=this.g.log.slice(0,Math.max(0,this.g.log.length-logBeforeEffects)).reverse();
  for(const state of before){
   const y=state.x;
   if(y.dead&&!state.dead)continue; // L'eliminazione è già nel registro.
   const name=state.faceUp||state.t===g.human?state.name:'Carta coperta';
   if(y.dominion!==state.dominion)events.push(`${name}: Dominio ${state.dominion} → ${y.dominion}.`);
   if(y.tokens!==state.tokens)events.push(`${name}: iniziativa ${initiativeOf({initiative:y.initiative,tokens:state.tokens})} → ${initiativeOf(y)}.`);
  }
  await this.onAutoAction({name:this.card(x).name,initiative:min,events,
   main:this.card(x).main||'',secondary:this.card(x).secondary||'',dead:x.dead});
 }
 }
 await this.endRound();}
 async endRound(){const g=this.g;for(const t of ['Santi','Corrotti']){const sum=this.live(t).reduce((s,x)=>s+x.dominion,0);this.p(t).score+=sum;this.scored.push({team:t,sum});this.notify(`${t}: ${sum} Dominio nel round ${g.round} (totale ${this.p(t).score}).`);}this.phase='between';g.phase='between';this.update();if(g.round===2){this.phase='finished';g.phase='finished';const a=this.p('Santi').score,b=this.p('Corrotti').score;let winner=a>b?'Santi':b>a?'Corrotti':null;if(!winner){const ca=this.p('Santi').board.reduce((n,x)=>n+this.card(x).cost,0),cb=this.p('Corrotti').board.reduce((n,x)=>n+this.card(x).cost,0);if(ca!==cb)winner=ca<cb?'Santi':'Corrotti';}this.notify(winner?`PARTITA FINITA: vince ${winner} (${a}–${b}).`:`PARTITA FINITA: pareggio (${a}–${b}).`);return;}
 // Le due fazioni decidono senza conoscere la scelta dell'altra.
 const removalChoices={};
 for(const t of ['Santi','Corrotti']){
  const enemy=other(t),alive=this.live(enemy);
  if(!alive.length){removalChoices[t]=[];continue;}
  const selected=await this.target(t,enemy,z=>true,`${t}: scegli una carta avversaria sopravvissuta da eliminare definitivamente`,false);
  removalChoices[t]=selected?[selected.id]:[];
 }
 for(const t of ['Santi','Corrotti']){
  const enemy=other(t);
  for(const id of removalChoices[t]){
   if(!this.p(enemy).removed.includes(id))this.p(enemy).removed.push(id);
  }
 }
 const eliminated=Object.entries(removalChoices).flatMap(([t,ids])=>ids.map(id=>`${t} elimina definitivamente ${this.g.cards[id].name}`));
 this.notify(eliminated.length?`Scelte rivelate: ${eliminated.join(' · ')}.`:'Nessuna carta sopravvissuta da eliminare.');
 for(const t of ['Santi','Corrotti']){const p=this.p(t),ids=[...p.deck,...p.hand,...p.discard,...p.board.map(x=>x.id)].filter(id=>!p.removed.includes(id));p.deck=shuffle(ids,g.random);p.hand=[];p.discard=[];p.board=[];this.refreshHand(t);}g.round=2;g.starter='Corrotti';g.turn='Corrotti';g.plays=0;this.lastPaid={Santi:0,Corrotti:0};this.cancel.clear();this.protect.clear();this.immune.clear();this.muted.clear();this.categoryPenalties=[];this.discount={Santi:0,Corrotti:0};this.phase='deploy';g.phase='deploy';this.nextSkip={Santi:0,Corrotti:0};this.suppressedMain.clear();this.tieLast.clear();this.notify('Round 2: iniziano i Corrotti.');await this.autoProgress();}
}
