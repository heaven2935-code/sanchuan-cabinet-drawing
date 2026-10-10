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
  focus() {context.document.activeElement=this;}
  select() {}
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
vm.runInContext(fs.readFileSync(path.join(root,'parts.js'),'utf8'),context);
vm.runInContext(script, context);
const api=win.__CAD_TEST__,before=()=>JSON.stringify(api.getDoc()),get=id=>ids.get(id);
const initial=before(),view=JSON.stringify(api.getView());
// Name a real structural divider without modifying geometry or viewport.
api.selectAt({x:580,y:1000});assert.equal(api.getSelection().kind,'gridLine');api.openPartEditor();
assert.equal(get('partType').value,'vertical');assert(get('partWidth').readOnly);
get('partName').value='中立板 <測試>';get('partThickness').value='18';get('partDepth').value='580';get('partMaterial').value='木心板';get('partApply').click();
assert.equal(api.getDoc().boardTags.length,1);assert.equal(api.allParts()[0].code,'V01');assert.equal(api.allParts()[0].thickness,18);assert.equal(JSON.stringify(api.getView()),view);
assert(api.exportSVGString().includes('中立板 &lt;測試&gt;'));api.undo();assert.equal(before(),initial);api.redo();
// Metadata follows actual divider movement, including cancel/undo and total scaling.
const named=before();api.selectPart('g0');get('partCancel').click();const line=api.getSelection();
api.moveGridLine(line.axis,line.value,700);assert.equal(api.getDoc().boardTags[0].value,700);assert.equal(api.allParts()[0].name,'中立板 <測試>');api.undo();assert.equal(before(),named);
api.applySize(2701,2453,600);assert.equal(api.getDoc().boardTags.length,1);assert.equal(api.getDoc().boardTags[0].value,675.25);api.undo();assert.equal(before(),named);
api.selectPart('g0');get('partMove').click();api.setCursor(800,1000);get('cursorCancel').click();assert.equal(before(),named);
api.selectPart('g0');get('partDelete').click();assert.equal(api.getDoc().boardTags.length,0);api.undo();assert.equal(before(),named);
api.selectAt({x:0,y:1000});api.openPartEditor();assert.equal(get('partType').value,'left');get('partApply').click();assert.equal(api.getDoc().boardTags.length,2);api.selectPart('g1');assert(get('partMove').disabled);get('partDelete').click();assert.equal(api.getDoc().boardTags.length,1);assert.equal(api.getDoc().width,2320);api.undo();assert.equal(api.getDoc().boardTags.length,2);api.undo();assert.equal(before(),named);
// Free board, drawer components, invalid edits and cancellation do not leak into saved document.
api.openPartEditor(true);get('partType').value='drawer';get('partType').onchange();get('partWidth').value='500';get('partHeight').value='200';get('partX').value='100';get('partY').value='100';get('drawerWidth').value='450';get('drawerHeight').value='160';get('drawerThickness').value='12';
get('drawerChild').value='5';get('drawerChild').onchange();get('drawerWidth').value='450';get('drawerHeight').value='520';get('drawerThickness').value='5';get('partApply').click();
let shape=api.getDoc().shapes.at(-1);assert.equal(shape.part.code,'DR01');assert.equal(shape.part.children.length,6);assert.equal(shape.part.children[0].width,450);assert.equal(shape.part.children[5].height,520);
const drawer=before();api.openPartEditor();get('partWidth').value='-5';get('partApply').click();assert.equal(before(),drawer);get('partCancel').click();
api.openPartEditor();get('partType').value='door';get('partType').onchange();get('partType').value='drawer';get('partType').onchange();assert.equal(get('partCode').textContent,'DR01');get('partCancel').click();assert.equal(before(),drawer);
api.openPartEditor();get('partDuplicate').click();shape=api.getDoc().shapes.at(-1);assert.equal(shape.part.code,'DR02');assert.equal(shape.x1,150);assert.equal(shape.part.children[5].height,520);api.undo();assert.equal(before(),drawer);
api.selectPart('s0');get('partDelete').click();assert.equal(api.getDoc().shapes.length,0);api.undo();assert.equal(before(),drawer);
// Persistence reload retains structured metadata, values and escaped drawing labels.
api.save();vm.runInContext(script,context);assert.deepEqual(JSON.parse(JSON.stringify(win.__CAD_TEST__.getDoc())),JSON.parse(drawer));assert.equal(win.__CAD_TEST__.allParts().length,2);
// All 11 catalog types normalize and assign distinct stable codes.
const Parts=win.CabinetParts;assert.equal(Parts.types.length,11);for(const [type,prefix] of Parts.types){const p=Parts.normalize({type,code:prefix+'01',name:'test'});assert.equal(Parts.next(type,[p]),prefix+'02');assert.equal(p.type,type)}
assert.equal(Parts.normalize({type:'invalid'}),null);assert.equal(Parts.normalize({type:'door',thickness:-1}).thickness,null);
console.log('PASS board naming, structural movement/scaling, drawer children, validation, cancellation, duplication, deletion, undo, viewport and persistence');
