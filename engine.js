export const clamp = n => Math.max(0,n);
export const shuffle = (array,rand=Math.random) => {
 const out=[...array];for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
};
export function newGame(cards, human='Santi',random=Math.random){
 const parties={};for(const team of ['Santi','Corrotti']){
  parties[team]={deck:shuffle(cards.filter(c=>c.team===team).map(c=>c.id),random),hand:[],discard:[],removed:[],board:[],score:0};
 }
 const g={cards:Object.fromEntries(cards.map(c=>[c.id,c])),parties,round:1,starter:'Santi',turn:'Santi',phase:'deploy',plays:0,log:[],human,warnings:[],random};
 for(const team of ['Santi','Corrotti'])drawToFour(g,team);
 say(g,'Round 1: iniziano i Santi. Versione alfa: abilità automatizzate in fase di verifica.');return g;
}
function say(g,s){g.log.unshift(s);}
function drawOne(g,team){let p=g.parties[team];if(!p.deck.length&&p.discard.length){p.deck=shuffle(p.discard,g.random);p.discard=[];say(g,`${team}: rimescolati gli scarti.`);}if(p.deck.length)p.hand.push(p.deck.pop());}
function drawToFour(g,team){while(g.parties[team].hand.length<4&&(g.parties[team].deck.length||g.parties[team].discard.length))drawOne(g,team);}
export function choices(g,team){const p=g.parties[team];return p.hand.filter(id=>g.cards[id].cost<=p.hand.length-1).map(id=>({id,name:g.cards[id].name,cost:g.cards[id].cost}));}
export function deploy(g,team,id,faceUp,payIds){
 if(g.phase!=='deploy'||g.turn!==team)throw Error('Non è il turno di schieramento di questa fazione.');
 const p=g.parties[team],card=g.cards[id];if(!card||card.team!==team||!p.hand.includes(id))throw Error('Carta non presente nella mano.');
 if(p.board.length>=4)throw Error('Quattro carte già schierate.');
 const candidates=p.hand.filter(x=>x!==id);
 if(!Array.isArray(payIds)||payIds.length!==card.cost||new Set(payIds).size!==payIds.length||!payIds.every(x=>candidates.includes(x)))throw Error(`Seleziona esattamente ${card.cost} carte diverse per pagare.`);
 p.hand=p.hand.filter(x=>x!==id&&!payIds.includes(x));p.discard.push(...payIds);
 p.board.push({id,faceUp:!!faceUp,initiative:card.cost,dominion:card.dominion,activated:false,tokens:0,slot:p.board.length});
 say(g,`${team} schiera ${faceUp?card.name:'una carta coperta'}; paga ${card.cost} carte.`);
 if(faceUp&&card.faceUp)say(g,`EFFETTO SCOPERTO NON ANCORA IMPLEMENTATO: ${card.name}: ${card.faceUp}`);
 drawToFour(g,team);g.plays++;
 if(g.plays===8){g.phase='activation';say(g,'Schieramento completato. Ordine di iniziativa calcolato; effetti non ancora automatizzati.');}
 else g.turn=team==='Santi'?'Corrotti':'Santi';
 return g;
}
export function initiativeOf(x){return clamp(x.initiative + (x.tokens || 0));}
export function order(g){
 const up=team=>g.parties[team].board.filter(x=>x.faceUp).length;
 const spent=team=>g.parties[team].board.reduce((n,x)=>n+g.cards[x.id].cost,0);
 const precedence=up('Santi')!==up('Corrotti')?(up('Santi')>up('Corrotti')?'Santi':'Corrotti'):spent('Santi')!==spent('Corrotti')?(spent('Santi')<spent('Corrotti')?'Santi':'Corrotti'):g.starter;
 const all=['Santi','Corrotti'].flatMap(team=>g.parties[team].board.map(x=>({...x,team,effectiveInitiative:initiativeOf(x)})));
 const groups=new Map();for(const x of all){if(!groups.has(x.effectiveInitiative))groups.set(x.effectiveInitiative,[]);groups.get(x.effectiveInitiative).push(x);}
 const output=[];
 for(const initiative of [...groups.keys()].sort((a,b)=>a-b)){
  const group=groups.get(initiative),queue={Santi:group.filter(x=>x.team==='Santi').sort((a,b)=>a.slot-b.slot),Corrotti:group.filter(x=>x.team==='Corrotti').sort((a,b)=>a.slot-b.slot)};
  let team=precedence;
  while(queue.Santi.length||queue.Corrotti.length){
   if(!queue[team].length)team=team==='Santi'?'Corrotti':'Santi';
   output.push(queue[team].shift());team=team==='Santi'?'Corrotti':'Santi';
  }
 }
 return output;
}
export function preview(g){
 if(g.phase!=='activation')throw Error('Prima completa lo schieramento.');
 return order(g).map(c=>({team:c.team,name:c.faceUp?g.cards[c.id].name:null,initiative:c.effectiveInitiative,faceUp:c.faceUp,slot:c.slot}));
}
export function resetForSecondRound(g){
 throw Error('Il passaggio al secondo round sarà abilitato soltanto quando eliminazioni, effetti e punteggio saranno implementati.');
}
