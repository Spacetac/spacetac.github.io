/* ===== v3.9.4: Gebiets-Beschriftung der Bots (Name, Stärke, Rang) ===== */
(function(){
const LB={t:-1e9,rank:new Map(),pow:new Map(),anchor:new Map()};
const fmtP=n=>n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' Mio':n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1).replace('.',',')+'k':String(Math.round(n));
function refresh(){const now=performance.now();if(now-LB.t<2500)return;LB.t=now;
 try{const L=standings();LB.rank.clear();L.forEach((s,i)=>LB.rank.set(s.id,i+1));LB.total=L.length;
  const pw=new Map(),sx=new Map(),sy=new Map(),cnt=new Map(),own=new Map();
  for(const f of fleets)if(f.owner>0&&!f.dead)pw.set(f.owner,(pw.get(f.owner)||0)+fleetPower(f));
  for(const p of planets){const o=p.owner;if(o<=0)continue;
   const g=p.garrison?basePower(p.garrison):0;pw.set(o,(pw.get(o)||0)+g);
   sx.set(o,(sx.get(o)||0)+p.x);sy.set(o,(sy.get(o)||0)+p.y);cnt.set(o,(cnt.get(o)||0)+1);(own.get(o)||own.set(o,[]).get(o)).push(p)}
  LB.pow=pw;LB.anchor.clear();
  for(const [o,list] of own){const ai=AIS[o-1];if(!ai||ai.dead)continue;const h=planets[ai.home];
   if(h&&h.owner===o){LB.anchor.set(o,h);continue}
   const mx=sx.get(o)/cnt.get(o),my=sy.get(o)/cnt.get(o);let best=list[0],bd=1e18;for(const p of list){const d=(p.x-mx)**2+(p.y-my)**2;if(d<bd){bd=d;best=p}}LB.anchor.set(o,best)}
 }catch(e){console.warn('labels',e)}}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function drawLabels(){if(!BORD.on)return;refresh();const z=cam.zoom;
 const items=[];
 for(const [o,p] of LB.anchor){const [sx,sy]=w2s(p.x,p.y);if(sx<-90||sy<-60||sx>W+90||sy>H+60)continue;items.push({o,p,sx,sy,rank:LB.rank.get(o)||9999})}
 if(!items.length)return;items.sort((a,b)=>a.rank-b.rank);
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
 const placed=[];let drawn=0;const fs=items.length<=14?10:9;
 for(const it of items){if(drawn>=45)break;
  const ai=AIS[it.o-1];if(!ai)continue;const name=ownerName(it.o);
  const l2='Stärke '+fmtP(LB.pow.get(it.o)||0)+' · #'+(it.rank<9999?it.rank:'–');
  ctx.font='600 '+fs+'px Rajdhani,sans-serif';const w=Math.max(ctx.measureText(name).width,ctx.measureText(l2).width*.9)+8,h=fs*2+6;
  const rad=Math.max(3.6,it.p.r*z),x=it.sx-w/2,y=it.sy-rad-8-h;
  if(x+w<0||y+h<0||x>W||y>H)continue;
  let hit=false;for(const q of placed){if(x<q.x+q.w+2&&x+w+2>q.x&&y<q.y+q.h+2&&y+h+2>q.y){hit=true;break}}if(hit)continue;
  placed.push({x,y,w,h});drawn++;
  const col=ownerColor(it.o),a=it.rank<=3?.62:.46;
  ctx.lineWidth=3;ctx.strokeStyle='rgba(2,6,23,.55)';
  ctx.globalAlpha=a;ctx.fillStyle=col;ctx.strokeText(name,it.sx,y+fs+1);ctx.fillText(name,it.sx,y+fs+1);
  ctx.font='600 '+(fs-.5)+'px Rajdhani,sans-serif';ctx.globalAlpha=a;ctx.fillStyle=col;
  ctx.strokeText(l2,it.sx,y+fs*2+3);ctx.fillText(l2,it.sx,y+fs*2+3);ctx.globalAlpha=1}
 ctx.restore()}
const _render=render;render=function(){_render.apply(this,arguments);try{drawLabels()}catch(e){}};
window.__LB=LB;
})();

/* ===== v3.9.4: Doppeltippen wie am PC (Bewegen & Angreifen) ===== */
(function(){
/* Einfaches Tippen lässt Flotten nie mehr losfliegen: Tippen=Bewegen standardmäßig AUS (auch in alten Spielständen) */
S.tapMove=false;
const _ai=addonInit;addonInit=function(){const r=_ai.apply(this,arguments);S.tapMove=false;try{updTapBtn()}catch(e){}return r};
/* Erneutes Antippen eines markierten Ziels greift NICHT mehr an – nur Doppeltippen (onDouble) */
onClick=function(x,y){const o=pickAt(x,y);
 if(o){sel=o;if(o.type==='fleet'){const f=fleetById.get(o.id);if(f&&f.owner===0)setActive(f.id)}playSound('click');renderTarget(true)}
 else{closeTarget();if(S.tapMove&&activeFleet)onDouble(x,y)}};
})();

/* ===== v4.4.2: Doppelklick auf Ziele/Flak ohne vorheriges Öffnen der Infos; Hinweis-X ===== */
(function(){
let pend=null,hh=false,hp=null;const win=()=>395;
const _oc=onClick;
onClick=function(x,y){clearTimeout(pend);pend=null;const o=pickAt(x,y);
 const own=o&&o.type==='fleet'&&(fleetById.get(o.id)||{}).owner===0;
 /* Mit aktiver Flotte oder im Platzier-Modus öffnet der Info-Dialog erst nach Ablauf des Doppelklick-Fensters */
 if(o&&!own&&(placing||activeFleet)){playSound('click');pend=setTimeout(()=>{pend=null;sel=o;renderTarget(true)},win());return}
 return _oc(x,y)};
const _od=onDouble;onDouble=function(x,y){clearTimeout(pend);pend=null;const prev=sel,r=_od(x,y);if(sel!==prev)closeTarget();return r};
const _sa=setActive;setActive=function(id){const r=_sa.apply(this,arguments);if(placing!==hp){hp=placing;hh=false}if(hh)$('hintBar').classList.add('hidden');return r};
window.hideHint=function(){hh=true;$('hintBar').classList.add('hidden')};
})();
