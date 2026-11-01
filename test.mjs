import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newGame,deploy,choices,preview,initiativeOf,resetForSecondRound} from './engine.js';
let cards=JSON.parse(fs.readFileSync('cards.json','utf8'));
assert.equal(cards.length,32);assert.equal(cards.filter(c=>c.team==='Santi').length,16);assert.equal(cards.filter(c=>c.team==='Corrotti').length,16);
let g=newGame(cards,'Santi',()=>0.31);
assert.equal(g.parties.Santi.hand.length,4);assert.equal(g.parties.Corrotti.hand.length,4);
for(let i=0;i<8;i++){
 let team=g.turn,p=g.parties[team],opts=choices(g,team);assert.ok(opts.length);
 let c=opts[0];deploy(g,team,c.id,i%2===0,p.hand.filter(id=>id!==c.id).slice(0,c.cost));
 assert.equal(p.board.length,Math.ceil((i+1)/2));assert.equal(p.hand.length,4);
}
assert.equal(g.phase,'activation');assert.equal(preview(g).length,8);
assert.throws(()=>resetForSecondRound(g));
console.log('OK: 32 carte, mani, schieramento, pagamenti, pescata, 8 carte e iniziativa provvisoria.');

// Le carte coperte non rivelano la propria identità nell'anteprima pubblica.
assert.ok(preview(g).filter(x=>!x.faceUp).every(x=>x.name===null));
assert.equal(initiativeOf({initiative:3,tokens:-8}),0);
assert.equal(initiativeOf({initiative:2,tokens:1}),3);
