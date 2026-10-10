// Runs real application event handlers with a DOM stub, not a browser layout test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let promptAnswer='2';
class Element {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attrs = {...attrs};
    this.id = attrs.id;
    this.value = attrs.value || '';
    this.dataset = {};
    this.listeners = {};
    this.style = {setProperty(k,v){this[k]=v}};
    this.innerHTML = '';
    this.textContent = '';
    this.clientWidth = 600;
    this.clientHeight = 300;
    const classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      add: c => classes.add(c), remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, value) => { const on = value ?? !classes.has(c); on ? classes.add(c) : classes.delete(c); return on; }
    };
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, x) => x.toUpperCase())] = value;
    }
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(k, fn) { (this.listeners[k] ||= []).push(fn); }
  dispatch(k, event = {}) {
    for (const fn of this.listeners[k] || []) fn({target: this, preventDefault() {}, ...event});
  }
  click() { if (!this.disabled) { this.onclick?.({target: this}); this.dispatch('click'); } }
  closest() {return null;}
  setPointerCapture() {}
  getBoundingClientRect() { return {left: 70, top: 80, width: this.clientWidth, height: this.clientHeight}; }
  remove() { this.removed = true; }
  append() {}
}
const elements = [];
const ids = new Map();
const markup = html.split('<script')[0];
for (const match of markup.matchAll(/<([a-z][\w-]*)(\s[^<>]*?)?>/g)) {
  const attrs = {};
  for (const attr of (match[2] || '').matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
  const el = new Element(match[1], attrs);
  elements.push(el);
  if (el.id) { assert(!ids.has(el.id), `duplicate ID: ${el.id}`); ids.set(el.id, el); }
}
function query(selector) {
  return elements.filter(el => selector.split(',').some(part => {
    part = part.trim();
    if (part.startsWith('.')) return el.classList.contains(part.slice(1));
    const attr = part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return attr && Object.hasOwn(el.attrs, attr[1]) && (attr[2] === undefined || el.attrs[attr[1]] === attr[2]);
  }));
}
const timers = new Map();
let timerId = 0;
const storage = new Map();
const win = {innerHeight:852,matchMedia: () => ({matches:true}), listeners: {}, addEventListener(k, fn) { (this.listeners[k] ||= []).push(fn); }};
const context = vm.createContext({
  window: win,
  document: {
    documentElement: new Element('html'),
    getElementById(id) {
      if (!ids.has(id) && elements.some(el => el.innerHTML.includes(`id="${id}"`))) ids.set(id, new Element('g', {id}));
      assert(ids.has(id), `missing ID: ${id}`); return ids.get(id);
    },
    querySelectorAll: query, querySelector: s => query(s)[0],
    createElement: tag => new Element(tag), body: new Element('body'), activeElement: null,
  },
  localStorage: {getItem: key => storage.get(key) || null, setItem: (k, v) => storage.set(k, v)},
  setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, {fn, delay}); return id; },
  clearTimeout: id => timers.delete(id), requestAnimationFrame: fn => fn(),
  navigator:{standalone:true},sessionStorage:{getItem:()=>null,setItem(){}},structuredClone, Blob, URL, confirm: () => true, prompt: () => promptAnswer,
});
vm.runInContext(fs.readFileSync(path.join(root,'grid.js'),'utf8'),context);
vm.runInContext(script, context);
const api=win.__CAD_TEST__,drawing=ids.get('drawing'),baseline=JSON.stringify(api.getDoc());
assert(api&&ids.get('bootNotice').removed);
assert(ids.get('app').classList.contains('panel-closed'));
const point=(x,y)=>{const v=api.getView();return {x:v.x+x*v.scale,y:v.y+y*v.scale}};
function event(type,id,p,target=drawing){drawing.dispatch(type,{target,pointerId:id,pointerType:'touch',button:0,clientX:p.x+70,clientY:p.y+80})}
function tap(x,y){const p=point(x,y);event('pointerdown',1,p);event('pointerup',1,p)}
function drag(x,y,dx,dy,id=2){const p=point(x,y);event('pointerdown',id,p);event('pointermove',id,{x:p.x+dx,y:p.y+dy});event('pointerup',id,{x:p.x+dx,y:p.y+dy})}
assert.equal(api.getCells().length,12);
tap(290,250);tap(870,250);assert.equal(api.getCellSelection().length,2);
ids.get('mergeCells').click();assert.equal(api.getCells().length,11);
assert(win.CabinetGrid.lines(api.getCells(),2320,2240).some(l=>l.axis==='x'&&l.value===580&&l.a===500));
api.undo();assert.equal(JSON.stringify(api.getDoc()),baseline);api.redo();assert.equal(api.getCells().length,11);
tap(290,250);promptAnswer='3';ids.get('splitColumns').click();assert.equal(api.getCells().length,13);api.undo();
api.changeSpan('x',0,580);assert(api.getCells().some(c=>c.x2===3));api.undo();
let prior=JSON.stringify(api.getDoc());drag(1160,1200,30,0);assert.notEqual(JSON.stringify(api.getDoc()),prior);assert(api.validateDoc(api.getDoc()));api.undo();assert.equal(JSON.stringify(api.getDoc()),prior);
tap(1160,1200);assert.equal(api.getSelection().kind,'gridLine');ids.get('linePosition').value='1201';ids.get('applyLinePosition').click();assert(api.getCells().some(c=>c.x1===1201));api.undo();
// Cancellation rolls geometry back and does not add an undo entry.
let p=point(1160,1200);prior=JSON.stringify(api.getDoc());event('pointerdown',3,p);event('pointermove',3,{x:p.x+20,y:p.y});event('pointercancel',3,{x:p.x+20,y:p.y});assert.equal(JSON.stringify(api.getDoc()),prior);
// A second finger cancels the edit preview before the pinch starts.
event('pointerdown',4,p);event('pointermove',4,{x:p.x+20,y:p.y});event('pointerdown',5,{x:p.x+100,y:p.y});event('pointermove',4,{x:p.x-10,y:p.y});event('pointerup',4,p);event('pointerup',5,{x:p.x+100,y:p.y});assert.equal(JSON.stringify(api.getDoc()),prior);
api.setMode('line');api.setCursor(100,100);api.confirm();api.setCursor(400,450);api.confirm();assert.equal(api.getDoc().shapes.at(-1).x2,400);
api.setMode('select');drag(250,275,30,20);assert.notEqual(api.getDoc().shapes.at(-1).x2,400);api.undo();assert.equal(api.getDoc().shapes.at(-1).x2,400);
api.applySize(4640,4480,600);assert(api.validateDoc(api.getDoc()));assert.equal(api.getDoc().shapes.at(-1).x2,800);
api.save();const saved=JSON.parse(storage.get('sanchuan_cabinet_cad_v1'));assert(saved.gridCells);assert(api.validateDoc(saved));
const svg=api.exportSVGString();assert(!svg.includes('data-grid-axis'));assert(!svg.includes('#418c8733'));
ids.get('toggleInspector').click();assert(!ids.get('app').classList.contains('panel-closed'));ids.get('closeInspector').click();assert(ids.get('app').classList.contains('panel-closed'));
console.log('PASS: real application handlers for cell taps, local merge/split, resize, drag, cancellation, pinch, shapes, undo/redo, scaling, save and clean export');
const oldDoc={version:1,name:'舊圖面相容測試',width:1200,height:2000,depth:600,vertical:[400,800],horizontal:[{x1:0,x2:400,y:800}],shapes:[{type:'line',x1:100,y1:100,x2:200,y2:200,text:'',color:'#ab624c'}]};
storage.set('sanchuan_cabinet_cad_v1',JSON.stringify(oldDoc));vm.runInContext(script,context);
let loaded=win.__CAD_TEST__;assert.equal(loaded.getDoc().name,oldDoc.name);assert.equal(loaded.getCells().length,4);assert.equal(loaded.getDoc().shapes[0].x2,200);
loaded.toggleCellAt({x:100,y:200});loaded.splitCells('y',2);loaded.save();const savedCells=JSON.stringify(loaded.getCells());
vm.runInContext(script,context);loaded=win.__CAD_TEST__;assert.equal(JSON.stringify(loaded.getCells()),savedCells);assert.equal(loaded.getDoc().shapes[0].x2,200);
console.log('PASS: old localStorage recovery and new gridCells round-trip');
