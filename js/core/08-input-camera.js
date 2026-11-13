/* ===== KAMERA / EINGABE ===== */
const cv=$('galaxyCanvas'),ctx=cv.getContext('2d');let W=800,H=600,dpr=1;
const cam={x:0,y:0,zoom:.6},MAXZ=2.5;let MINZ=.08;
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;cv.width=W*dpr;cv.height=H*dpr;MINZ=Math.min(.08,Math.max(.012,W/18000));if(cam.zoom<MINZ)cam.zoom=MINZ}
window.addEventListener('resize',resize);
const w2s=(x,y)=>[(x-cam.x)*cam.zoom+W/2,(y-cam.y)*cam.zoom+H/2];
const s2w=(x,y)=>[(x-W/2)/cam.zoom+cam.x,(y-H/2)/cam.zoom+cam.y];
let PICKR=16;const ptrs=new Map();let drag=null,lastTap={t:0,x:0,y:0},pinchD=0,mouse={x:0,y:0};
function clampCam(){cam.x=clamp(cam.x,-HALF,HALF);cam.y=clamp(cam.y,-HALF,HALF)}
cv.addEventListener('pointerdown',e=>{PICKR=e.pointerType==='touch'?28:16;try{cv.setPointerCapture(e.pointerId)}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={moved:false,sx:e.clientX,sy:e.clientY};
 if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinchD=Math.hypot(a.x-b.x,a.y-b.y);drag.moved=true}});
cv.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchD>0)zoomAt((a.x+b.x)/2,(a.y+b.y)/2,d/pinchD);pinchD=d;return}
 if(drag){if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>(e.pointerType==='touch'?10:5))drag.moved=true;if(drag.moved){cam.x-=dx/cam.zoom;cam.y-=dy/cam.zoom;clampCam()}}});
const endPtr=e=>{const was=ptrs.size;ptrs.delete(e.pointerId);if(drag&&!drag.moved&&was===1&&e.type==='pointerup')onTap(e.clientX,e.clientY);if(!ptrs.size){drag=null;pinchD=0}};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
function zoomAt(sx,sy,f){const [wx,wy]=s2w(sx,sy);cam.zoom=clamp(cam.zoom*f,MINZ,MAXZ);cam.x=wx-(sx-W/2)/cam.zoom;cam.y=wy-(sy-H/2)/cam.zoom;clampCam()}
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,e.deltaY<0?1.15:.87)},{passive:false});
function onTap(x,y){const now=performance.now();if(now-lastTap.t<380&&Math.hypot(x-lastTap.x,y-lastTap.y)<(PICKR>16?40:24)){lastTap.t=0;onDouble(x,y)}else{lastTap={t:now,x,y};onClick(x,y)}}
function pickAt(sx,sy){const [wx,wy]=s2w(sx,sy),z=cam.zoom;let best=null,bd=1e9;
 for(const f of fleets){if(f.dead||(f.owner===0&&!f.placed)||fleetVis(f)<.5)continue;const d=Math.hypot(f.x-wx,f.y-wy)*z;if(d<PICKR&&d<bd){bd=d;best={type:'fleet',id:f.id}}}
 if(best)return best;const cx=cellX(wx),cy=cellY(wy);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=planetAt(cx+dx,cy+dy);if(!p)continue;const d=Math.hypot(p.x-wx,p.y-wy);if(d<=Math.max(p.r,PICKR/z)&&d<bd){bd=d;best={type:'planet',id:p.id}}}
 return best}
function onClick(x,y){const o=pickAt(x,y);if(o&&PICKR>16&&sel&&sel.type===o.type&&sel.id===o.id&&activeFleet){const f0=fleetById.get(activeFleet),t0=o.type==='planet'?planets[o.id]:fleetById.get(o.id);if(f0&&f0.placed&&t0&&t0.owner!==0&&f0.id!==o.id){onDouble(x,y);return}}if(o){sel=o;if(o.type==='fleet'){const f=fleetById.get(o.id);if(f&&f.owner===0)setActive(f.id)}playSound('click');renderTarget(true)}else{closeTarget();if(S.tapMove&&activeFleet)onDouble(x,y)}}
function onDouble(x,y){if(placing){placeDef(x,y);return}const f=activeFleet?fleetById.get(activeFleet):null;
 if(!f){toast('Wähle zuerst eine Flotte (Flottenmenü oder Klick auf eine eigene Flotte), dann Doppelklick.');return}
 let [wx,wy]=s2w(x,y);wx=clamp(wx,-HALF+100,HALF-100);wy=clamp(wy,-HALF+100,HALF-100);
 if(!f.placed){
  if(!basePower(f.ships)){toast('Diese Flotte hat keine Schiffe. Füge im Flottenmenü Schiffe hinzu.');return}
  if(!inOwnTerr(wx,wy)){toast('Flotten können nur innerhalb deines Gebietes (blau umrandet) platziert werden.');return}
  f.placed=true;f.x=wx;f.y=wy;f.ax=wx;f.ay=wy;f.order=null;playSound('ok');toast(`${f.name} platziert.`);refreshUI()}
 else{if(!basePower(f.ships)){toast('Leere Flotte kann nicht fliegen.');return}f.guard=null;f.retreat=false;
  const o=pickAt(x,y),ot=o?(o.type==='planet'?planets[o.id]:fleetById.get(o.id)):null;
  if(ot&&ot.owner!==0){setAttack(f,o.type,o.id);sel=o;setActive(f.id);playSound('alert');toast(`${f.name} greift ${ot.name} an!`);refreshUI();return}
  f.order={type:'move',x:wx,y:wy};playSound('click');toast(`${f.name} fliegt zum Ziel.`);refreshUI()}}
let _h1t=0,_h1d=false;try{_h1d=localStorage.getItem('ge_hint1')==='1'}catch(_){}
function hintOnce(){if(_h1d)return false;const n=Date.now();if(!_h1t){_h1t=n;try{localStorage.setItem('ge_hint1','1')}catch(_){}setTimeout(()=>{if(!placing)$('hintBar').classList.add('hidden')},12000)}return n-_h1t<12000}
function setActive(id){activeFleet=id;const f=id?fleetById.get(id):null,bar=$('hintBar');
 if(f&&(placing==='mine'||placing==='shield')){bar.classList.remove('hidden');$('hintText').textContent=placeHint()}else if(f&&hintOnce()){bar.classList.remove('hidden');$('hintText').textContent=f.placed?`${f.name}: Doppelklick auf die Karte = bewegen, auf ein Ziel = automatisch angreifen`:`${f.name}: Doppelklick in dein Gebiet (blau umrandet) = Flotte platzieren`}else if(placing){bar.classList.remove('hidden');$('hintText').textContent=placeHint()}else bar.classList.add('hidden')}
const mini=$('minimap'),mctx=mini.getContext('2d');
mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect();cam.x=clamp(((e.clientX-r.left)/r.width-.5)*WORLD,-HALF,HALF);cam.y=clamp(((e.clientY-r.top)/r.height-.5)*WORLD,-HALF,HALF);e.preventDefault()});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('modal2Root').classList.contains('hidden'))closeModal2();else if(!$('modalRoot').classList.contains('hidden'))closeModal();else{closeTarget();placing=null;setActive(null)}}});
