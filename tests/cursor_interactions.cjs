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
const api=win.__CAD_TEST__,doc=()=>JSON.stringify(api.getDoc()),baseline=doc();
assert.equal(ids.get('cursorToggle').attrs['aria-expanded'],'true');api.setCursor(290,250);ids.get('cursorSelect').click();assert.equal(api.getCellSelection().length,0);
ids.get('cursorActions').click();assert(!ids.get('cursorMenu').classList.contains('hidden'));
ids.get('closeCursorMenu').click();ids.get('contextCutX').click();assert.equal(api.getCursorDraft().type,'cut');assert.equal(doc(),baseline);
assert(!ids.get('cursorDock').classList.contains('hidden'));assert(!ids.get('cursorFinish').disabled);
ids.get('cursorDraftValue').value='201';ids.get('cursorDraftValue').dispatch('input');assert.equal(api.getCursorDraft().value,201);assert.equal(doc(),baseline);
assert(!api.exportSVGString().includes('stroke-dasharray="'+8/api.getView().scale));
ids.get('cursorFinish').click();assert.equal(api.getCells().length,13);assert.equal(api.getCursorDraft(),null);assert(api.getCells().some(c=>c.x2===201&&c.y2===500));
api.undo();assert.equal(doc(),baseline);
api.setCursor(290,250);ids.get('cursorSelect').click();api.startCursorTool('cutY');api.setCursor(290,333);assert.equal(api.getCursorDraft().value,333);
api.save();assert.equal(JSON.stringify(JSON.parse(storage.get('sanchuan_cabinet_cad_v1'))),baseline,'saving a preview must save the committed drawing only');
ids.get('cursorCancel').click();assert.equal(doc(),baseline);assert.equal(api.getCursorDraft(),null);
// Every drawing/annotation tool uses the same cursor preview and finish workflow.
for(const tool of ['line','rect','ellipse','dimension']){
 const before=doc();api.setCursor(100,100);api.startCursorTool(tool);api.setCursor(400,500);assert.equal(doc(),before);
 assert.equal(api.getCursorDraft().end.x,400);ids.get('cursorFinish').click();
 const shape=api.getDoc().shapes.at(-1);assert.equal(shape.type,tool);assert.equal(shape.x1,100);assert.equal(shape.x2,400);
 api.undo();assert.equal(doc(),before);
}
api.setCursor(123,456);api.startCursorTool('text');ids.get('cursorDraftText').value='測試 <標記>';ids.get('cursorDraftText').dispatch('input');
api.setCursor(222,555);assert.equal(doc(),baseline);ids.get('cursorFinish').click();assert.equal(api.getDoc().shapes.at(-1).text,'測試 <標記>');assert.equal(api.getDoc().shapes.at(-1).x1,222);
api.undo();assert.equal(doc(),baseline);
// Local move and deletion affect only the touched row, not equal coordinates elsewhere.
api.setCursor(580,1200);ids.get('cursorSelect').click();assert(api.getSelection().local);
ids.get('contextMove').click();assert.equal(api.getCursorDraft().type,'moveLine');api.setCursor(620,1200);assert.equal(doc(),baseline);ids.get('cursorFinish').click();
assert(api.getCells().some(c=>c.x2===620&&c.y1===500));assert(api.getCells().some(c=>c.x2===580&&c.y1===0));assert(api.validateDoc(api.getDoc()));
const moved=doc();ids.get('deleteTool').click();assert.equal(api.getCells().length,11);api.undo();assert.equal(doc(),moved);api.undo();assert.equal(doc(),baseline);
// Move a free shape with the same preview/finish controls.
api.setCursor(100,100);api.startCursorTool('line');api.setCursor(400,450);api.finishCursorAction();
const withLine=doc();api.setCursor(250,275);api.pickWithCursor();assert.equal(api.getSelection().kind,'shape');api.startCursorMove();api.setCursor(350,375);
assert.equal(doc(),withLine);api.finishCursorAction();assert.equal(api.getDoc().shapes[0].x2,500);api.undo();assert.equal(doc(),withLine);
api.startCursorTool('line');api.cancelCursorAction();assert.equal(doc(),withLine);
// A relative trackpad never jumps to where a new finger touches it.
const pad=ids.get('cursorPad');api.setCursor(290,1200);const before=api.getCursor();
function pointer(type,id,x,y){pad.dispatch(type,{pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y})}
pointer('pointerdown',20,100,100);pointer('pointermove',20,110,105);pointer('pointerup',20,110,105);let after=api.getCursor();assert(after.x>before.x);
pointer('pointerdown',21,20,80);assert.deepEqual(api.getCursor(),after);pointer('pointermove',21,25,80);pointer('pointerup',21,25,80);assert(api.getCursor().x>after.x);assert.equal(doc(),withLine);
// On-canvas touching may reposition a cursor preview, but never commits it.
api.setCursor(290,250);api.pickWithCursor();api.startCursorTool('cutX');const drawing=ids.get('drawing'),v=api.getView();
function canvasEvent(type,id,x,y){drawing.dispatch(type,{pointerId:id,pointerType:'touch',button:0,clientX:70+v.x+x*v.scale,clientY:80+v.y+y*v.scale})}
canvasEvent('pointerdown',30,350,250);canvasEvent('pointermove',30,370,250);canvasEvent('pointerup',30,370,250);
assert.equal(doc(),withLine);assert(api.getCursorDraft());api.cancelCursorAction();
// Endpoint preview preserves the opposite endpoint and commits one undo step.
api.selectAt({x:250,y:275});api.openCursorMenu();assert(!ids.get('cursorAdjustStart').disabled);
ids.get('cursorAdjustStart').click();assert.equal(api.getCursorDraft().type,'endpoint');
ids.get('cursorEndpointX').value='120';ids.get('cursorEndpointY').value='140';ids.get('cursorEndpointX').dispatch('input');
assert.equal(doc(),withLine);assert.equal(api.getCursorDraft().previewShape.x2,400);
api.finishCursorAction();assert.equal(api.getDoc().shapes[0].x1,120);assert.equal(api.getDoc().shapes[0].y1,140);assert.equal(api.getDoc().shapes[0].y2,450);
api.undo();assert.equal(doc(),withLine);api.selectAt({x:250,y:275});api.startCursorEndpoint('end');api.setCursor(500,600);api.cancelCursorAction();assert.equal(doc(),withLine);
assert(!api.exportSVGString().includes('data-shape-endpoint'));
// Visible dimension line is selectable; either original measuring endpoint can move.
api.setCursor(100,100);api.startCursorTool('dimension');api.setCursor(400,100);api.finishCursorAction();const withDimension=doc();
api.selectAt({x:250,y:210});assert.equal(api.getSelection().idx,1);api.startCursorEndpoint('end');api.setCursor(450,130);api.finishCursorAction();
assert.equal(api.getDoc().shapes[1].x1,100);assert.equal(api.getDoc().shapes[1].x2,450);api.undo();assert.equal(doc(),withDimension);
// Actual on-canvas endpoint handles use the same pointer editing/undo machinery.
function endpointDrag(which,x,y,cancel=false){
 const target=new Element('circle',{'data-shape-endpoint':which,'data-shape-index':'1'});
 target.closest=selector=>selector==='[data-shape-endpoint]'?target:null;
 const shape=api.getDoc().shapes[1],sx=which==='start'?shape.x1:shape.x2,sy=which==='start'?shape.y1:shape.y2;
 const view=api.getView(),evt=(wx,wy)=>({pointerId:99,pointerType:'touch',button:0,clientX:70+view.x+wx*view.scale,clientY:80+view.y+wy*view.scale});
 drawing.dispatch('pointerdown',{...evt(sx,sy),target});drawing.dispatch('pointermove',evt(x,y));drawing.dispatch(cancel?'pointercancel':'pointerup',evt(x,y));
}
endpointDrag('start',600,600);assert.equal(api.getDoc().shapes[1].x1,600);assert.equal(api.getDoc().shapes[1].y1,600);assert.equal(api.getDoc().shapes[1].x2,400);
api.undo();assert.equal(doc(),withDimension);endpointDrag('end',900,900,true);assert.equal(doc(),withDimension);
endpointDrag('start',400,100);assert.equal(doc(),withDimension,'overlapping endpoints must be rejected');
// Selection, opening/closing the floating controller, and keyboard resize keep view scale.
const stableView=api.getView();api.setMode('cells');api.setCursor(290,250);api.confirm();assert.deepEqual(api.getView(),stableView);
ids.get('cursorToggle').click();ids.get('cursorToggle').click();assert.deepEqual(api.getView(),stableView);
ids.get('drawing').clientHeight=180;for(const fn of win.listeners.resize||[])fn();for(const timer of [...timers.values()])if(timer.delay===150)timer.fn();
assert.deepEqual(api.getView(),stableView,'keyboard-sized viewport must never auto-fit the cabinet');
assert(!ids.get('cursorGraphic').innerHTML.includes('<text'),'crosshair has no coordinate label');
// Opening Actions, starting a preview, and Back never recenter or scale the viewport.
ids.get('drawing').clientHeight=300;const beforeActions=api.getView();api.setCursor(290,250);api.pickWithCursor();api.openCursorMenu();assert.deepEqual(api.getView(),beforeActions);
api.startCursorTool('cutX');assert.deepEqual(api.getView(),beforeActions);const beforeReturn=doc();ids.get('cursorCancel').click();assert.equal(api.getCursorDraft(),null);assert.equal(doc(),beforeReturn);assert.deepEqual(api.getView(),beforeActions);
// Bottom row Undo really reverts the drawing, Redo reapplies, and Delete shares selection.
const commonBase=doc(),commonView=api.getView();api.setCursor(100,100);api.startCursorTool('line');api.setCursor(700,800);api.finishCursorAction();const commonDrawn=doc();
ids.get('undo').click();assert.equal(doc(),commonBase);assert.deepEqual(api.getView(),commonView);ids.get('redo').click();assert.equal(doc(),commonDrawn);
api.setCursor(700,800);ids.get('cursorSelect').click();assert.equal(api.getSelection().kind,'shape');assert.equal(api.getSelection().idx,2);ids.get('shapeDelete').click();assert.equal(doc(),commonBase);assert.deepEqual(api.getView(),commonView);
ids.get('undo').click();assert.equal(doc(),commonDrawn);ids.get('commonPan').click();assert(ids.get('commonPan').classList.contains('active'));assert.deepEqual(api.getView(),commonView);
// Direct creation stays direct; Add never opens the cursor controller or resets view.
api.cancelCursorAction();if(ids.get('cursorToggle').attrs['aria-expanded']==='true')ids.get('cursorToggle').click();api.setMode('cells');const directView=api.getView();
ids.get('cursorActions').click();assert.equal(ids.get('cursorToggle').attrs['aria-expanded'],'false');query('[data-cursor-tool="line"]')[0].click();assert.equal(api.getCursorDraft(),null);
const beforeDirect=doc();api.setCursor(900,1500);api.confirm();api.setCursor(1000,1700);api.confirm();assert.equal(api.getDoc().shapes.at(-1).type,'line');api.undo();assert.equal(doc(),beforeDirect);assert.deepEqual(api.getView(),directView);
// Line tools remain available, but spreadsheet selection and tools are gone.
api.setMode('select');api.setCursor(900,1800);api.confirm();assert.equal(api.getCellSelection().length,0);assert(!ids.get('cellActions').classList.contains('hidden'));assert(!ids.get('contextCutX').classList.contains('hidden'));assert(ids.get('mergeCells').classList.contains('hidden'));
api.selectAt({x:250,y:275});assert(!ids.get('contextStart').classList.contains('hidden'));assert(ids.get('contextCutX').classList.contains('hidden'));ids.get('contextStart').click();assert.equal(api.getCursorDraft().type,'endpoint');api.cancelCursorAction();
// Text edits use the inline field and one reversible change, without a popup.
api.setCursor(900,1800);api.startCursorTool('text');api.finishCursorAction();api.selectAt({x:900,y:1800});const beforeText=doc();assert(!ids.get('contextTextInput').classList.contains('hidden'));ids.get('contextTextInput').value='層板';ids.get('contextTextApply').click();assert.equal(api.getDoc().shapes.at(-1).text,'層板');api.undo();assert.equal(doc(),beforeText);
const settingsView=api.getView();api.setInspector(true);api.setInspector(false);assert.deepEqual(api.getView(),settingsView);assert(ids.get('cellActions').classList.contains('hidden'));
console.log('PASS: unified direct/cursor workflows, contextual tools, inline text, settings, undo/redo and preserved viewport');

// Footer ordering and tool grouping: auxiliary drawing tools cannot appear in the common row.
const commonMarkup=html.match(/<nav id="commonActions"[\s\S]*?<\/nav>/)[0];assert.deepEqual([...commonMarkup.matchAll(/<button id="([^"]+)"/g)].map(m=>m[1]),['undo','cursorSelect','commonPan']);
const footerMarkup=html.match(/<section id="drawingControls"[\s\S]*?<div class="subbar">/)[0];for(const id of ['contextPart','contextStart','contextEnd','cursorActions','partList'])assert(!footerMarkup.includes('id="'+id+'"'));assert(footerMarkup.indexOf('id="commonActions"')<footerMarkup.indexOf('id="cursorPad"'));
api.cancelCursorAction();if(ids.get('cursorToggle').attrs['aria-expanded']!=='true')ids.get('toggleCursorDock').click();const cursorStart=api.getCursor(),padView=api.getView();ids.get('cursorPad').dispatch('pointerdown',{pointerId:71,pointerType:'touch',clientX:100,clientY:100});ids.get('cursorPad').dispatch('pointermove',{pointerId:71,clientX:120,clientY:100});ids.get('cursorPad').dispatch('pointerup',{pointerId:71});assert(api.getCursor().x!==cursorStart.x);assert.deepEqual(api.getView(),padView);
ids.get('commonPan').click();const panBefore=api.getView(),panCursor=api.getCursor();ids.get('cursorPad').dispatch('pointerdown',{pointerId:72,pointerType:'touch',clientX:100,clientY:100});ids.get('cursorPad').dispatch('pointermove',{pointerId:72,clientX:120,clientY:110});ids.get('cursorPad').dispatch('pointerup',{pointerId:72});assert.equal(api.getView().x,panBefore.x+16);assert.equal(api.getView().y,panBefore.y+8);assert.equal(api.getView().scale,panBefore.scale);assert.deepEqual(api.getCursor(),panCursor);
console.log('PASS three-button footer, top auxiliary tools, rectangular cursor touchpad and pan mode');
