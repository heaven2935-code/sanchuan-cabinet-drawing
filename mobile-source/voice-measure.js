/* Deterministic mm commands and a continuous measurement session. No audio or DOM. */
const VoiceMeasure=(()=>{
  'use strict';
  const DIGITS='零一二三四五六七八九',FORMAL={'〇':'零','○':'零','兩':'二','两':'二','壹':'一','貳':'二','贰':'二','參':'三','叁':'三','肆':'四','伍':'五','陸':'六','陆':'六','柒':'七','捌':'八','玖':'九','拾':'十','佰':'百','仟':'千','万':'萬','点':'點'};
  const round=n=>Math.round(n*100)/100,fmt=n=>String(round(n));
  const fail=(code,message)=>({ok:false,code,message});
  function chinese(n){
    if(n===0)return'零';
    if(n>=10000){const rem=n%10000;return chinese(Math.floor(n/10000))+'萬'+(rem?(rem<1000?'零':'')+chinese(rem):'');}
    let out='',zero=false;
    for(const [unit,word] of [[1000,'千'],[100,'百'],[10,'十'],[1,'']]){
      const d=Math.floor(n/unit);n%=unit;
      if(d){if(zero)out+='零';out+=DIGITS[d]+word;zero=false;}else if(out&&n)zero=true;
    }
    return out.replace(/^一十/,'十');
  }
  function integer(s){
    if(/^\d+$/.test(s))return Number(s);
    if(/^[零一二三四五六七八九]+$/.test(s))return Number([...s].map(c=>DIGITS.indexOf(c)).join(''));
    if(!/^[零一二三四五六七八九十百千萬]+$/.test(s))return NaN;
    let total=0,section=0,digit=0;
    for(const c of s){const d=DIGITS.indexOf(c);if(d>=0){digit=d;continue;}
      const u={十:10,百:100,千:1000,萬:10000}[c];
      if(u===10000){total+=(section+digit)*u;section=0;}else section+=(digit||1)*u;digit=0;
    }
    const n=total+section+digit;
    // Reject shorthand such as 一千二 / 一百五 instead of guessing the missing place.
    return n<100000&&chinese(n)===s.replace(/^一十/,'十')?n:NaN;
  }
  function number(raw){
    let s=String(raw).normalize('NFKC').replace(/\s/g,'').replace(/[〇○兩两壹貳贰參叁肆伍陸陆柒捌玖拾佰仟万点]/g,c=>FORMAL[c]);
    if(/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(s))s=s.replace(/,/g,'');
    const a=s.split(/[.點]/);if(a.length>2||!a[0])return NaN;
    const n=integer(a[0]);if(!Number.isFinite(n))return NaN;
    if(a.length===1)return n;
    const dec=a[1].replace(/[零一二三四五六七八九]/g,c=>String(DIGITS.indexOf(c)));
    return /^\d{1,2}$/.test(dec)?round(n+Number('0.'+dec)):NaN;
  }
  function parse(raw){
    const text=String(raw??'').normalize('NFKC').trim().replace(/\s/g,'').replace(/[。.!！?？,，;；]+$/g,'');
    if(!text||text.length>100)return fail('syntax','請說方向與長度，例如「往上1200」。');
    const controls=[['confirm',/^(確認|确认|確定|确定|確認加入|加入)$/],['cancel',/^(取消|取消這段|取消这段)$/],['undo',/^(復原|复原|復原上一段|复原上一段|復原上段|撤銷|撤销)$/],['pause',/^(暫停|暂停|暫停丈量|暂停丈量)$/],['resume',/^(繼續|继续|繼續丈量|继续丈量)$/],['end',/^(結束|结束|結束丈量|结束丈量)$/]];
    for(const [type,re] of controls)if(re.test(text))return{ok:true,type,text};
    const combined=text.match(/^(.+?)[,，;；。]*(確認|确认|確定|确定)$/);
    if(combined){const first=parse(combined[1]);if(first.ok&&first.type==='segment')return{ok:true,type:'sequence',commands:[first,{ok:true,type:'confirm'}],text};}
    const m=text.match(/^(?:往|向)?(上|下|左|右)(?:方)?(?:走|移動|移动)?(.+)$/);
    if(!m)return fail('syntax','口令不明確。請說「往上1200」或「確認／取消／復原／暫停／繼續／結束」。');
    let value=m[2].replace(/(?:mm|毫米|公釐|公厘)$/i,'');
    if(/[a-zA-Z尺米吋寸厘釐]/.test(value))return fail('unit','本次固定 mm，請改說公釐數值，不換算其他單位。');
    const length=number(value);
    if(!Number.isFinite(length))return fail('number','數字不明確。請說完整數值，例如「一千二百」或「1200」；小數最多兩位。');
    if(length<=0)return fail('positive','長度必須大於 0 mm。');
    if(length>12000)return fail('length','長度超過 12000 mm，請核對數值及目前圖面範圍。');
    return{ok:true,type:'segment',direction:{上:'up',下:'down',左:'left',右:'right'}[m[1]],length,text};
  }
  const names={up:'上',down:'下',left:'左',right:'右'};
  function create(options){
    const p=options.start,b=options.bounds;
    if(!p||!b||![p.x,p.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0||p.x<0||p.y<0||p.x>b.width||p.y>b.height)throw new Error('丈量起點必須在目前圖面內');
    return{id:String(options.id),status:'ready',start:{x:round(p.x),y:round(p.y)},point:{x:round(p.x),y:round(p.y)},bounds:{...b},style:{lineType:['line','dashed','arrow','dim'].includes(options.lineType)?options.lineType:'line',color:/^#[0-9a-f]{6}$/i.test(options.color||'')?options.color:'#147c88',width:options.width||2,view:options.view||'out'},pending:null,segments:[],next:1,seen:[]};
  }
  function draft(state,command){
    if(!command.ok||command.type!=='segment')return command.ok?fail('syntax','請說方向與長度。'):command;
    if(!names[command.direction]||!Number.isFinite(command.length)||command.length<=0||command.length>12000)return fail('syntax','方向或數值無效，沒有建立線段。');
    if(state.status==='paused'||state.status==='ended')return fail('paused','丈量已暫停，請先說「繼續」。');
    const from={...state.point},to={...from},n=command.length;
    if(command.direction==='up')to.y=round(to.y-n);if(command.direction==='down')to.y=round(to.y+n);
    if(command.direction==='left')to.x=round(to.x-n);if(command.direction==='right')to.x=round(to.x+n);
    if(to.x<0||to.y<0||to.x>state.bounds.width||to.y>state.bounds.height)return fail('bounds','這段超出目前圖面。請修改長度，或結束後調整圖面與起點；不會截短線段。');
    return{ok:true,segment:{id:state.id+':'+state.next,from,to,direction:command.direction,length:n,...state.style}};
  }
  function preview(state,text){const p=parse(text);return draft(state,p.type==='sequence'?p.commands[0]:p);}
  function transition(current,input,eventId){
    if(eventId&&current.seen.includes(eventId))return{state:current,effect:null,duplicate:true};
    let state={...current,seen:eventId?[...current.seen,eventId].slice(-256):current.seen};
    const command=typeof input==='string'?parse(input):input;
    const result=(effect=null,message='',error=null)=>({state,effect,message,error});
    if(state.status==='ended')return result(null,'本次丈量已結束。','ended');
    if(!command.ok){state={...state,pending:null,status:state.status==='paused'?'paused':'ready'};return result(null,command.message,command.code);}
    if(command.type==='sequence'){
      // Explicit direction + 確認 is one atomic utterance; interim text cannot call this.
      let r=transition(state,command.commands[0]);if(r.error)return r;return transition(r.state,command.commands[1]);
    }
    if(command.type==='segment'){
      const d=draft(state,command);if(!d.ok){if(state.status!=='paused')state={...state,pending:null,status:'ready'};return result(null,d.message,d.code);}
      state={...state,pending:d.segment,status:'pending'};return result(null,'往'+names[d.segment.direction]+fmt(d.segment.length)+'公釐，請說確認或取消。');
    }
    if(command.type==='pause'){state={...state,status:'paused'};return result(null,'丈量已暫停，仍接收控制口令。');}
    if(command.type==='resume'){state={...state,status:state.pending?'pending':'ready'};return result(null,'已繼續丈量。');}
    if(command.type==='cancel'){state={...state,pending:null,status:state.status==='paused'?'paused':'ready'};return result(null,'已取消待確認線段。');}
    if(command.type==='end'){state={...state,pending:null,status:'ended'};return result(null,'丈量已結束，已確認的線段保留。');}
    if(command.type==='undo'){
      if(!state.segments.length)return result(null,'本次沒有可復原的線段。','empty');
      const last=state.segments.at(-1),segments=state.segments.slice(0,-1);
      state={...state,segments,pending:null,point:segments.length?{...segments.at(-1).to}:{...state.start},status:state.status==='paused'?'paused':'ready'};
      return result({type:'undo',segment:last},'已復原上一段。');
    }
    if(command.type==='confirm'){
      if(state.status==='paused')return result(null,'丈量已暫停，請先說繼續。','paused');
      if(!state.pending)return result(null,'目前沒有待確認線段。','empty');
      const segment=state.pending;
      state={...state,segments:[...state.segments,segment],point:{...segment.to},pending:null,next:state.next+1,status:'ready'};
      return result({type:'add',segment},'已加入往'+names[segment.direction]+fmt(segment.length)+'公釐，請說下一段。');
    }
    return result(null,'口令不明確。','syntax');
  }
  function annotation(segment,scale){
    return{k:segment.lineType==='dim'?'dim':segment.lineType==='arrow'?'arrow':'line',c:segment.color,lw:segment.width*scale,v:segment.view,x1:segment.from.x,y1:segment.from.y,x2:segment.to.x,y2:segment.to.y,measure:{id:segment.id,lineType:segment.lineType}};
  }
  // Recompute from the geometry so annotation edits cannot leave stale dimension text.
  function primitives(annotation,scale,original){
    const a=annotation,m=a.measure;if(!m||typeof m.id!=='string'||!m.id||!['line','arrow','dim'].includes(a.k))return original;
    const dx=a.x2-a.x1,dy=a.y2-a.y1,length=Math.hypot(dx,dy);
    if(!Number.isFinite(length)||!length)return original;
    const out=original.map(p=>({...p,measurement:true})),z=Math.max(12*scale,(a.lw||2*scale)*5.5),nx=-dy/length,ny=dx/length,up=ny>0?-1:1;
    if(m.lineType==='dashed')out.filter(p=>p.t==='l').forEach(p=>{p.dash=6*scale;});
    const label={t:'t',x:(a.x1+a.x2)/2+nx*up*z*.75,y:(a.y1+a.y2)/2+ny*up*z*.75+z*.35,s:fmt(length)+' mm',c:'ant',col:a.c||'#147c88',a:'middle',z,measurement:true};
    if(a.k==='dim'){const index=out.findIndex(p=>p.t==='t');if(index>=0)out[index]=label;}else out.push(label);
    return out;
  }
  return{parse,number,create,draft,preview,transition,annotation,primitives,fmt,names};
})();
if(typeof module!=='undefined')module.exports=VoiceMeasure;
