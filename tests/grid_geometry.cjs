const assert=require('node:assert/strict');
const G=require('../grid.js');
const demo={width:2320,height:2240,vertical:[580,1160,1740],horizontal:[{x1:0,x2:2320,y:500},{x1:0,x2:2320,y:2140}]};
let cells=G.fromLegacy(demo);
assert.equal(cells.length,12);assert(G.validate(cells,2320,2240));
const a=G.at(cells,{x:100,y:200}),b=G.at(cells,{x:700,y:200});
let merged=G.merge(cells,[a,b]);assert.equal(merged.length,11);assert(G.validate(merged,2320,2240));
assert(!G.lines(merged,2320,2240).some(l=>l.axis==='x'&&l.value===580&&l.a===0));
assert(G.lines(merged,2320,2240).some(l=>l.axis==='x'&&l.value===580&&l.a===500));
assert.throws(()=>G.merge(cells,[a,G.at(cells,{x:1400,y:1000})]),/長方形/);
let split=G.split(merged,[G.at(merged,{x:100,y:200})],'x',3);assert(G.validate(split,2320,2240));
let moved=G.move(split,'x',1160,1200,2320,2240);assert(G.validate(moved.cells,2320,2240));
assert.throws(()=>G.move(split,'x',1160,1800,2320,2240),/範圍/);
let taller=G.move(cells,'y',2240,2400,2320,2240);assert.equal(taller.height,2400);assert(G.validate(taller.cells,2320,2400));
assert(!G.validate([...cells,cells[0]],2320,2240));assert(!G.validate(cells.slice(1),2320,2240));
assert.throws(()=>G.split(cells,[0],'y',100),/2–24/);
// Nonuniform local subdivisions must keep a complete partition after resizing.
for(let n=2;n<=24;n++){
 const next=G.split([{x1:0,y1:0,x2:2320,y2:2240}],[0],'x',n);
 assert(G.validate(next,2320,2240));
 const first=next[0].x2;
 const result=G.move(next,'x',first,first+1,2320,2240);
 assert(G.validate(result.cells,2320,2240));
}
console.log('PASS: legacy conversion, local merge, invalid merges, splits, boundaries, coverage and overlap');
const local=G.segment(cells,'x',580,250);assert.equal(local.a,0);assert.equal(local.b,500);
const localMoved=G.moveLocal(cells,local,620,2320,2240).cells;
assert(localMoved.some(c=>c.x2===620&&c.y1===0));assert(localMoved.some(c=>c.x2===580&&c.y1===500));assert(G.validate(localMoved,2320,2240));
const localDeleted=G.removeLocal(cells,local,2320,2240);assert.equal(localDeleted.length,11);assert(G.validate(localDeleted,2320,2240));
assert.throws(()=>G.moveLocal(cells,local,1160,2320,2240),/1 mm/);
console.log('PASS: independent line segments and local deletion');
