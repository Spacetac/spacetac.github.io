/* ===== ADD-ON v3.4: Schutzschilde, Asteroiden, Raketen & Raketenabwehr ===== */
const SH_R=520,SH_HP=9000,SH_DPS=.02,SH_BASE=6,SH_COST={steel:700,copper:400,crystals:60};
const RK_R=9000,RK_BOT_R=7000,RK_V=600,RK_TURN=2.2,RK_ICD=650,AST_KEEP=400;
const RKD={S:{n:8,d:420,nm:'Klein'},M:{n:4,d:1800,nm:'Mittel'},L:{n:1,d:30000,nm:'Groß'}};
const RKC={S:{steel:600,copper:350},M:{steel:1300,copper:700,crystals:90},L:{steel:2800,copper:1600,crystals:450}};
const RDC={steel:250,copper:150,crystals:20};
const shR=()=>SH_R*(1+tb('shrad')),shHP=()=>SH_HP*(1+tb('shhp')),shCap=()=>SH_BASE+tb('shcap');
const rdTime=()=>40*(1-Math.min(.6,tb('rdspd'))),rdCap=()=>3+tb('rdcap'),rkSlots=()=>2+tb('rslot');
const RKT=[];let _la=-99,_ac=0,_ar=0,_ab=0,_b2=0,GONE=null;
/* Forschung */
T('shield_tech','Schutzschilde','defense','Schaltet Schutzschilde frei (Bau in der Raumwerft, Ablegen per Flotte im eigenen Gebiet)',{copper:5000,crystals:1500,diamonds:120},1,['plasma_shields:4','hyper_shielding:1','point_defense:1'],{});
T('shield_hp','Schild-Energie','defense','+25% Schild-Energie je Stufe',{steel:2200,crystals:400},5,['shield_tech'],{shhp:.25});
T('shield_rad','Schild-Radius','defense','+12% Schild-Radius je Stufe',{copper:2000,crystals:450},4,['shield_tech'],{shrad:.12});
T('shield_cap','Schildgitter','defense','+2 Schild-Kapazität je Stufe',{steel:3500,crystals:900},5,['shield_hp:2'],{shcap:2});
T('shield_reg','Schild-Regeneration','defense','+0,4% Energie/s je Stufe wenn unbeschossen',{copper:3000,crystals:700},5,['shield_hp:2'],{shreg:.004});
T('rocket_tech','Raketensysteme','weapons','Schaltet zielsuchende Raketen frei (an Flotten montieren, nahe eigener Kolonie)',{steel:12000,copper:7000,crystals:3000,diamonds:200},1,['flak_dmg:2','missile_tech'],{});
T('rocket_dmg','Sprengköpfe','weapons','+20% Raketenschaden je Stufe',{steel:2600,crystals:500},5,['rocket_tech'],{rdmg:.2});
T('rocket_rng','Raketenreichweite','weapons','+12% Reichweite je Stufe',{copper:2200,crystals:400},4,['rocket_tech'],{rrng:.12});
T('rocket_slots','Raketenschächte','weapons','+1 Raketen-Slot je Flotte',{steel:4000,crystals:1200},3,['rocket_dmg:2'],{rslot:1});
T('rd_tech','Raketenabwehr','defense','Schaltet Raketenabwehr für Flotten frei (jedes System fängt 1 Rakete ab, Bauzeit)',{steel:4500,copper:2800,crystals:900},1,['flak_dmg:1'],{});
T('rd_cap','Abwehr-Slots','defense','+1 Abwehrsystem je Flotte',{steel:2500,crystals:500},6,['rd_tech'],{rdcap:1});
T('rd_spd','Abwehr-Fertigung','defense','-12% Bauzeit der Abwehrsysteme',{copper:2400,crystals:450},5,['rd_tech'],{rdspd:.12});
T('rd_acc','Abfang-Präzision','defense','+3% Abfangchance',{copper:3000,crystals:700},5,['rd_tech'],{rdacc:.03});
function ensureX(){ensureB();if(!S.sh)S.sh=[];if(!S.ag)S.ag=[];if(!S.xs)S.xs=[];if(!S.rst)S.rst={S:0,M:0,L:0,D:0};if(!S.dq)S.dq={n:0,t:0}}
const gone=()=>GONE||(GONE=new Set(S.ag||[]));
/* Asteroiden */
const AC=new Map(),ACOL={steel:'#94a3b8',coal:'#475569',copper:'#c2763b',crystals:'#38bdf8',diamonds:'#e0f2fe'};
function astCell(cx,cy){const k=cy*N+cx;let a=AC.get(k);if(a)return a;const r=mulberry32(SEED*31+k*7919),n=3+Math.floor(r()*3);a=[];
 for(let i=0;i<n;i++){const t=r(),ty=t<.4?'steel':t<.6?'coal':t<.85?'copper':t<.97?'crystals':'diamonds',sz=6+r()*10;
  a.push({id:k*8+i,x:cx*CELL-HALF+r()*CELL,y:cy*CELL-HALF+r()*CELL,r:sz,ty,v:ty==='diamonds'?1+Math.floor(r()*3):Math.round(sz*(ty==='crystals'?4:12+r()*8))})}
 AC.set(k,a);return a}
function astCollect(g){_ac+=g;if(_ac<.3)return;_ab+=_ac;_ar+=_ac;_ac=0;const bots=_ab>=1.5;if(bots)_ab=0;const G=gone(),tot={};
 for(const f of fleets){if(f.dead)continue;if(f.owner===0){if(!f.placed)continue}else if(!bots)continue;
  for(const a of astCell(cellX(f.x),cellY(f.y))){if(G.has(a.id)||Math.hypot(a.x-f.x,a.y-f.y)>130+a.r)continue;G.add(a.id);S.ag.push(a.id);
   if(f.owner===0){S.res[a.ty]+=a.v;tot[a.ty]=(tot[a.ty]||0)+a.v;FX.push({k:'boom',t0:performance.now(),dur:350,x1:a.x,y1:a.y,s:8,c:'#fde68a'})}
   else{const ai=AIS[f.owner-1];if(ai)ai.bank=(ai.bank||0)+a.v*.8}}}
 const e=Object.entries(tot);if(e.length){toast('Asteroid abgebaut: '+e.map(([k,v])=>'+'+v+' '+RN[k]).join(', '));playSound('ok')}
 if(_ar>=1){_ar=0;if(S.ag.length>AST_KEEP){let n=0,i=0;const keep=[],lim=S.ag.length-AST_KEEP;
  for(;i<S.ag.length&&n<lim&&i<80;i++){const id=S.ag[i],c=Math.floor(id/8),a=astCell(c%N,Math.floor(c/N))[id%8],[sx,sy]=w2s(a.x,a.y);
   if(sx>-400&&sx<W+400&&sy>-400&&sy<H+400)keep.push(id);else{G.delete(id);n++}}
  S.ag=keep.concat(S.ag.slice(i))}}}
/* Schilde */
function nudge(f){const a=f.h||0;f.order={type:'move',x:clamp(f.x+Math.cos(a)*420,-HALF+100,HALF-100),y:clamp(f.y+Math.sin(a)*420,-HALF+100,HALF-100)}}
function deployShield(f){ensureX();f.order=null;
 if(!(S.stock.shield>0)){toast('Kein Schild im Vorrat – Auftrag abgebrochen.');return}
 if(S.sh.length>=shCap()){toast('Schild-Limit erreicht ('+shCap()+').');return}
 if(!nearOwn(f.x,f.y)){toast('Schilde nur im eigenen Gebiet.');return}
 if(nearby(f.x,f.y,shR()*1.3,e=>e.owner>0&&!e.dead&&basePower(e.ships)>0).length){toast('Feindliche Flotte zu nah – Schild nicht platziert.');return}
 S.sh.push({id:S.nextB=(S.nextB||0)+1,x:f.x,y:f.y,q:1,t0:S.T+5});S.stock.shield--;
 FX.push({k:'wave',t0:performance.now(),dur:900,x1:f.x,y1:f.y,s:shR(),c:'#38bdf8'});nudge(f);
 toast(f.name+' hat ein Schild errichtet ('+S.sh.length+'/'+shCap()+').');playSound('ok');refreshUI()}
function shTick(g){const R=shR(),mx=shHP(),now=performance.now();
 for(let i=S.sh.length-1;i>=0;i--){const s=S.sh[i];if(S.T<s.t0)continue;let dmg=0;
  for(const f of nearby(s.x,s.y,R+80,e=>e.owner>0&&!e.dead&&basePower(e.ships)>0)){const dx=f.x-s.x,dy=f.y-s.y,d=Math.hypot(dx,dy);
   if(d<R+4){const k=(R+6)/(d||1);f.x=d?s.x+dx*k:s.x+R+6;f.y=d?s.y+dy*k:s.y}
   if(d<R+60){f.shb=S.T;dmg+=fleetPower(f)*SH_DPS*g}}
  if(dmg>0){s.q-=dmg/mx;s.fl=now;if(!s.lg||S.T-s.lg>30){s.lg=S.T;addLog('[SCHILD] Gegner greift ein Schutzschild an!',s.x,s.y)}}
  else if(s.q<1)s.q=Math.min(1,s.q+tb('shreg')*g);
  if(s.q<=0){S.sh.splice(i,1);FX.push({k:'boom',t0:now,dur:700,x1:s.x,y1:s.y,s:50,c:'#38bdf8'});FX.push({k:'wave',t0:now,dur:900,x1:s.x,y1:s.y,s:R,c:'#38bdf8'});addLog('[SCHILD] Ein Schutzschild wurde zerstört!',s.x,s.y);playSound('boom');refreshUI()}}}
/* Raketen */
const mkPack=t=>({t,n:RKD[t].n,d:RKD[t].d});
function fireRk(f,pi,tg){const pk=f.rk&&f.rk[pi],tp=pk&&targetPos(tg);if(!tp)return false;const own=f.owner;
 if(Math.hypot(f.x-tp.x,f.y-tp.y)>(own===0?RK_R*(1+tb('rrng')):RK_BOT_R))return false;
 const mul=own===0?1+tb('rdmg'):1+(AIS[own-1].tech||0)*.03;f.rk.splice(pi,1);
 for(let i=0;i<pk.n;i++)RKT.push({fid:f.id,o:own,t:{kind:tg.kind,id:tg.id},x:f.x,y:f.y,a:Math.atan2(tp.y-f.y,tp.x-f.x)+(Math.random()-.5)*1.3,v:200,d:pk.d*mul,sz:pk.t,dl:i*.2,life:45,ic:0,tr:[],c:own===0?'#fbbf24':'#f43f5e'});
 if(own>0&&tp.owner===0&&S.T-_la>10){_la=S.T;pushAlert('Raketenangriff von '+ownerName(own)+' auf '+tp.name+'!',tp.x,tp.y)}
 playSound('boom');return true}
function rdAcc(o){return o===0?clamp(.8+tb('rdacc'),0,.97):.82+(AIS[o-1]?AIS[o-1].tech*.005:0)}
function tryIntercept(r,t){const o=t.owner;if(o<0)return false;const ds=nearby(t.x,t.y,1100,f=>f.owner===o&&!f.dead&&f.rd>0);if(!ds.length)return false;
 const d=ds[0],nw=performance.now();d.rd--;FX.push({k:'shot',t0:nw,dur:220,x0:d.x,y0:d.y,x1:r.x,y1:r.y,c:'#22d3ee'});
 if(Math.random()<rdAcc(o)){FX.push({k:'boom',t0:nw+200,dur:350,x1:r.x,y1:r.y,s:16,c:'#67e8f9'});return true}return false}
function rkImpact(r,t){const nw=performance.now();FX.push({k:'boom',t0:nw,dur:650,x1:r.x,y1:r.y,s:22+Math.min(40,r.d/250),c:'#fb923c'});FX.push({k:'wave',t0:nw,dur:700,x1:r.x,y1:r.y,s:320,c:'#fb923c'});
 if(r.t.kind==='fleet'){const f=fleetById.get(r.t.id);if(f)hitFleet(f,r.d,1)}
 else{const p=planets[r.t.id],np=basePower(p.garrison);if(np>0){applyLoss([p.garrison],Math.min(.7,r.d/np));for(const k in p.garrison)if(p.garrison[k]<=0)delete p.garrison[k];p.dirty=true}}
 if(t.owner===0)addLog('[RAKETE] Einschlag bei '+t.name+'!',t.x,t.y);playSound('boom')}
function rkTick(g){for(let i=RKT.length-1;i>=0;i--){const r=RKT[i];
 if(r.dl>0){r.dl-=g;const f=fleetById.get(r.fid);if(f&&!f.dead){r.x=f.x;r.y=f.y}continue}
 const t=targetPos(r.t);if(!t||r.life<=0){FX.push({k:'boom',t0:performance.now(),dur:300,x1:r.x,y1:r.y,s:10,c:'#94a3b8'});RKT.splice(i,1);continue}
 const dx=t.x-r.x,dy=t.y-r.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-r.a;da=Math.atan2(Math.sin(da),Math.cos(da));r.a+=clamp(da,-RK_TURN*g,RK_TURN*g);
 r.v=Math.min(RK_V,r.v+RK_V*1.2*g);const st=r.v*g;r.x+=Math.cos(r.a)*st;r.y+=Math.sin(r.a)*st;r.life-=g;r.tr.push(r.x,r.y);if(r.tr.length>18)r.tr.splice(0,2);
 if(!r.ic&&d<RK_ICD){r.ic=1;if(tryIntercept(r,t)){RKT.splice(i,1);continue}}
 if(d<95||d<=st){rkImpact(r,t);RKT.splice(i,1)}}}
function botTick(g){_b2+=g;if(_b2<3)return;_b2=0;
 for(const f of fleets){if(f.owner<=0||f.dead)continue;const ai=AIS[f.owner-1];if(!ai||ai.dead)continue;if(f.bk===undefined)f.bk=S.T+120+Math.random()*500;const pw=fleetPower(f);
  if(unl(ai,'rk')>0&&S.T>=f.bk&&pw>1500&&rkOk(f)){f.bk=S.T+300+Math.random()*500;if((ai.bank||0)>500){const sl=1+Math.floor(ai.tech/8)+ELV(ai);f.rk=f.rk||[];
   if(f.rk.length<sl){f.rk.push(mkPack(pw>25000?'L':pw>8000?'M':'S'));ai.bank-=500}
   if((f.rd||0)<1+Math.floor(ai.tech/4)+ELV(ai)){f.rd=(f.rd||0)+1;ai.bank-=150}}}
  if(f.rk&&f.rk.length&&S.T>=(f.fa||0)){f.fa=S.T+8+Math.random()*10;let tg=null;const o=f.order;
   if(o&&o.type==='atk'){const tp=targetPos(o);if(tp&&tp.owner>=0&&tp.owner!==f.owner&&Math.hypot(tp.x-f.x,tp.y-f.y)<RK_BOT_R)tg={kind:o.kind,id:o.id}}
   if(!tg&&Math.random()<.04*(ai.skill+.5)){const n=nearby(f.x,f.y,RK_BOT_R,e=>e.owner!==f.owner&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>0);if(n.length)tg={kind:'fleet',id:n[0].id}}
   if(tg)fireRk(f,0,tg)}}}
function xTick(g){ensureX();shTick(g);rkTick(g);astCollect(g);botTick(g);let ch=false;
 for(const f of fleets)if(f.rqn>0&&S.T>=f.rqt){f.rd=(f.rd||0)+1;f.rqn--;f.rqt=f.rqn>0?S.T+rdTime():0;ch=true}
 if(ch&&curModal==='fleets')refreshUI()}
{const _ta=tickAddon;tickAddon=function(g){_ta(g);try{xTick(g)}catch(e){console.warn(e)}}}
{const _ra=resolveAttack;resolveAttack=function(f){if(f.shb!==undefined&&S.T-f.shb<.8)return;return _ra(f)}}
{const _dm=deployMine;deployMine=function(f){ensureX();const o=f.order;if(o&&o.what==='shield'){deployShield(f);return}const n=S.mines.length;_dm(f);if(S.mines.length>n)nudge(f)}}
{const _bd=buildDef;buildDef=function(k,n){if(k!=='shield')return _bd(k,n);ensureX();const c=shipCost({cost:SH_COST}),tot={};for(const q in c)tot[q]=c[q]*n;if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}pay(tot);S.stock.shield=(S.stock.shield||0)+n;playSound('ok');refreshUI()}}
{const _ab2=armBuild;armBuild=function(k){if(k!=='shield')return _ab2(k);ensureX();if(!(S.stock.shield>0)){toast('Kein Vorrat – zuerst bauen.');return}closeModal();placing='shield';setActive(activeFleet);toast('Klicke eine eigene Flotte an, dann Doppelklick auf einen Ort in deinem Gebiet.')}}
{const _pd=placeDef;placeDef=function(sx,sy){if(placing!=='shield')return _pd(sx,sy);ensureX();if(!(S.stock.shield>0)){placing=null;setActive(null);return}
 const [wx,wy]=s2w(sx,sy),f=activeFleet?fleetById.get(activeFleet):null;
 if(!f||f.owner!==0||!f.placed||!basePower(f.ships)){toast('Wähle zuerst eine platzierte eigene Flotte (anklicken) – sie muss das Schild transportieren.');return}
 if(S.sh.length>=shCap()){toast('Schild-Limit erreicht ('+shCap()+').');return}
 if(!inOwnTerr(wx,wy)){toast('Schilde nur innerhalb deines Gebietes (blau umrandet).');return}
 f.guard=null;f.retreat=false;f.order={type:'mine',what:'shield',x:clamp(wx,-HALF+100,HALF-100),y:clamp(wy,-HALF+100,HALF-100)};
 toast(f.name+' transportiert das Schild zum Zielort.');placing=null;setActive(f.id);playSound('ok');refreshUI()}}
window.xShHint=()=>'Schutzschild ('+(S.stock.shield||0)+' im Vorrat): Eigene Flotte anklicken, dann Doppelklick auf einen Ort in deinem Gebiet • Esc = beenden';
/* Speichern / Laden der Flotten-Systeme */
{const _sv=save;save=function(){try{S.fxs={};for(const f of fleets)if((f.rk&&f.rk.length)||f.rd||f.rqn)S.fxs[f.id]={rk:f.rk,rd:f.rd,rqn:f.rqn,rqt:f.rqt}}catch(e){}_sv()};
 const _ld=load;load=function(){const r=_ld();if(r&&S.fxs)for(const f of fleets){const x=S.fxs[f.id];if(x){f.rk=x.rk;f.rd=x.rd;f.rqn=x.rqn;f.rqt=x.rqt}}GONE=null;return r}}
/* Zeichnen */
window.xDrawBelow=function(){const z=cam.zoom,now=performance.now();
 if(z>=.12){const [l,t]=s2w(0,0),[r,b]=s2w(W,H),G=gone(),x1=cellX(r),y1=cellY(b);
  for(let cy=cellY(t);cy<=y1;cy++)for(let cx=cellX(l);cx<=x1;cx++)for(const a of astCell(cx,cy)){if(G.has(a.id))continue;const [sx,sy]=w2s(a.x,a.y),p=Math.max(1.6,a.r*z*1.2);
   if(sx<-20||sy<-20||sx>W+20||sy>H+20)continue;ctx.fillStyle=ACOL[a.ty];
   if(a.ty==='crystals'||a.ty==='diamonds'){ctx.shadowColor=ACOL[a.ty];ctx.shadowBlur=6}
   if(p<3)ctx.fillRect(sx-p/2,sy-p/2,p,p);else{ctx.beginPath();for(let k=0;k<7;k++){const q=p*(.75+.35*Math.abs(Math.sin(a.id*1.7+k*2.1))),an=k*.8976+a.id;k?ctx.lineTo(sx+Math.cos(an)*q,sy+Math.sin(an)*q):ctx.moveTo(sx+Math.cos(an)*q,sy+Math.sin(an)*q)}ctx.closePath();ctx.fill()}
   ctx.shadowBlur=0}}
 for(const s of S.sh||[]){const [sx,sy]=w2s(s.x,s.y),R=shR()*z;if(sx<-R-20||sy<-R-20||sx>W+R+20||sy>H+R+20)continue;const fl=Math.max(0,1-(now-(s.fl||0))/350),arm=S.T<s.t0;
  ctx.globalAlpha=arm?.45:1;const gr=ctx.createRadialGradient(sx,sy,R*.4,sx,sy,R);gr.addColorStop(0,'rgba(56,189,248,.02)');gr.addColorStop(1,'rgba(56,189,248,'+(.12+.3*fl).toFixed(2)+')');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,R,0,6.283);ctx.fill();ctx.strokeStyle='rgba(125,211,252,.85)';ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.lineDashOffset=-now/60;ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle=s.q>.5?'#4ade80':s.q>.25?'#fbbf24':'#f43f5e';ctx.lineWidth=4;ctx.beginPath();ctx.arc(sx,sy,R+5,-1.5708,-1.5708+6.283*Math.max(0,s.q));ctx.stroke();
  ctx.fillStyle='#7dd3fc';ctx.beginPath();for(let k=0;k<6;k++)ctx.lineTo(sx+Math.cos(k*1.0472)*6,sy+Math.sin(k*1.0472)*6);ctx.closePath();ctx.fill();ctx.globalAlpha=1}};
const xAbove=()=>{const z=cam.zoom,now=performance.now();ctx.setTransform(dpr,0,0,dpr,0,0);
 for(const f of fleets){if(f.dead||(f.owner===0&&!f.placed)||!(f.rd>0||(f.rk&&f.rk.length)))continue;if(f.owner>0&&fleetVis(f)<.5)continue;
  const [sx,sy]=w2s(f.x,f.y);if(sx<-30||sy<-30||sx>W+30||sy>H+30)continue;const s=clamp(5+z*5,5,12);
  if(f.rd>0){const n=Math.min(f.rd,8);ctx.fillStyle=f.owner===0?'#22d3ee':'#f0abfc';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=6;for(let i=0;i<n;i++){const an=now/700+i*6.283/n;ctx.beginPath();ctx.arc(sx+Math.cos(an)*(s+11),sy+Math.sin(an)*(s+11),2.2,0,6.283);ctx.fill()}ctx.shadowBlur=0}
  if(f.rk)f.rk.forEach((p,i)=>{ctx.fillStyle=p.t==='L'?'#f43f5e':p.t==='M'?'#fb923c':'#fbbf24';ctx.fillRect(sx+s+5+i*5,sy-s-2,3,p.t==='L'?8:p.t==='M'?6:4)})}
 for(const r of RKT){if(r.dl>0)continue;const [sx,sy]=w2s(r.x,r.y);if(sx<-40||sy<-40||sx>W+40||sy>H+40)continue;
  if(r.tr.length>3){ctx.strokeStyle=r.c;ctx.lineWidth=2;ctx.globalAlpha=.55;ctx.beginPath();for(let i=0;i<r.tr.length;i+=2){const [a,b]=w2s(r.tr[i],r.tr[i+1]);i?ctx.lineTo(a,b):ctx.moveTo(a,b)}ctx.stroke();ctx.globalAlpha=1}
  ctx.shadowColor=r.c;ctx.shadowBlur=10;tri(sx,sy,r.a,6);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=r.c;ctx.lineWidth=1.5;ctx.stroke();ctx.shadowBlur=0}};
{const _r=render;render=function(){_r();try{xAbove()}catch(e){}}}
/* Menüs: Flotten (Raketen/Abwehr) & Werft (Schilde) */
function xFleetHtmlOld(){const mine=fleets.filter(f=>f.owner===0&&basePower(f.ships)>0);if(!mine.length)return'';const hR=S.lv.rocket_tech>0,hD=S.lv.rd_tech>0;
 let h='<h3 class="font-orbitron text-rose-300 mt-4 mb-2"><i class="fa-solid fa-rocket"></i> RAKETEN &amp; RAKETENABWEHR</h3>';
 if(!hR&&!hD)return h+'<div class="text-slate-500">Erforsche „Raketensysteme“ (Waffen) und „Raketenabwehr“ (Verteidigung).</div>';
 const c=t=>costHtml(shipCost({cost:RKC[t]}));
 h+=`<div class="text-slate-400 mb-1">Klein ×12 (je ${RKD.S.d}): ${c('S')}<br>Mittel ×4 (je ${RKD.M.d}): ${c('M')}<br>Groß ×1 (${RKD.L.d}): ${c('L')}<br>Abwehr (fängt 1 Rakete, ${Math.round(rdTime())} s Bauzeit): ${costHtml(shipCost({cost:RDC}))}<br>Montage nur nahe einer eigenen Kolonie.</div><div class="space-y-1.5">`;
 for(const f of mine){const near=nearOwn(f.x,f.y)&&f.placed,pk=(f.rk||[]).map(p=>`${RKD[p.t].nm} ×${p.n}`).join(', ')||'keine';
  h+=card(`<b class="text-cyan-300">${f.name}</b><div class="text-slate-400">Raketen (${(f.rk||[]).length}/${rkSlots()}): ${pk}<br>Abwehr: ${f.rd||0}/${rdCap()} bereit${f.rqn?` • +${f.rqn} im Bau (${fdur(Math.max(0,(f.rqt-S.T)/S.gs))})`:''}</div><div class="flex gap-1 flex-wrap mt-1">${hR?['S','M','L'].map(t=>btn(RKD[t].nm,`rkInstall(${f.id},'${t}')`,'amber',!near)).join('')+btn('<i class="fa-solid fa-crosshairs"></i> Feuern',`openRocket(${f.id})`,'rose',!(f.rk&&f.rk.length)||!f.placed):''}${hD?btn('Abwehr +1',`rdBuild(${f.id})`,'emerald',!near):''}</div>`)}
 return h+'</div>'}
function xShieldHtml(){ensureX();const ok=S.lv.shield_tech>0,c=shipCost({cost:SH_COST});
 return '<h3 class="font-orbitron text-sky-300 mt-4 mb-2">SCHUTZSCHILDE</h3>'+card(`<div class="flex items-center gap-2 mb-1"><i class="fa-solid fa-shield-halved text-sky-400"></i><b class="font-orbitron text-white">Schutzschild</b></div><div class="text-slate-400">Hält gegnerische Flotten auf, bis es zerstört ist • Energie ${fmt(shHP())} • Radius ${Math.round(shR())} • nur im eigenen Gebiet • Vorrat <b>${S.stock.shield||0}</b> • Platziert <b>${S.sh.length}/${shCap()}</b></div><div class="my-1">${costHtml(c)}</div>`
  +(ok?`<div class="flex gap-1 flex-wrap">${btn('Bauen ×1',"buildDef('shield',1)")}${btn('×5',"buildDef('shield',5)")}${btn('Mit Flotte legen',"armBuild('shield')",'amber',!(S.stock.shield>0))}</div>`:`<div class="text-rose-400 cursor-pointer" onclick="gotoTechFromYard('shield_tech')"><i class="fa-solid fa-lock"></i> Benötigt: Schutzschilde (Klick)</div>`))}
function xExtra(){if(!curModal||curModal!=='fleets')return;const b=$('modalBody');let x=$('xExtra');if(!x||!x.isConnected||x._m!==curModal){if(x)x.remove();x=document.createElement('div');x.id='xExtra';x._m=curModal;b.appendChild(x)}setHtml(x,curModal==='fleets'?xFleetHtml():xYardHtml())}
{const _f=RENDER.fleets,_y=RENDER.yard;RENDER.fleets=function(){_f();xExtra()};RENDER.yard=function(){_y();xExtra()}}
setInterval(()=>{try{if(curModal==='fleets')xExtra()}catch(e){}},700);
function rkInstall(fid,t){const f=fleetById.get(fid);if(!f||!f.placed||!nearOwn(f.x,f.y)){toast('Raketen nur im eigenen Gebiet montierbar.');return}
 f.rk=f.rk||[];if(f.rk.length>=rkSlots()){toast('Alle Raketen-Slots belegt.');return}const c=shipCost({cost:RKC[t]});if(!canPay(c)){toast('Nicht genug Ressourcen.');return}pay(c);f.rk.push(mkPack(t));playSound('ok');refreshUI()}
function rdBuild(fid){const f=fleetById.get(fid);if(!f||!f.placed||!nearOwn(f.x,f.y)){toast('Abwehr nur im eigenen Gebiet baubar.');return}
 if((f.rd||0)+(f.rqn||0)>=rdCap()){toast('Alle Abwehr-Slots belegt/in Bau.');return}const c=shipCost({cost:RDC});if(!canPay(c)){toast('Nicht genug Ressourcen.');return}pay(c);
 f.rqn=(f.rqn||0)+1;if(!f.rqt)f.rqt=S.T+rdTime();playSound('ok');refreshUI()}
/* Fadenkreuz-Menü */
let RK=null;
function rkRange(){return RK_R*(1+tb('rrng'))}
function openRocket(fid,pre){if(performance.now()-(window._md||0)<700)return;const f=fleetById.get(fid);if(!f||f.owner!==0||!f.placed||!f.rk||!f.rk.length){toast('Keine Raketen oder Flotte nicht platziert.');return}closeModal();closeRk();
 RK={fid,pk:0,x:f.x,y:f.y,lock:null,fix:pre||null,lt:0,lx:0,ly:0};const d=document.createElement('div');d.id='rkRoot';d.className='fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-2';
 d.innerHTML=`<div class="glass-panel rounded-xl p-3 w-[min(94vw,520px)] text-xs"><div class="flex justify-between items-center mb-2"><b class="font-orbitron text-rose-300"><i class="fa-solid fa-crosshairs"></i> RAKETENSTART – ${f.name}</b><button class="nb" onclick="closeRk()">✕</button></div><canvas id="rkCv" width="480" height="480" style="width:100%;aspect-ratio:1;touch-action:none;cursor:crosshair;background:#02040a;border:1px solid #334155;border-radius:8px"></canvas><div id="rkUi" class="mt-2"></div></div>`;
 document.body.appendChild(d);const cv2=$('rkCv'),mv=e=>{const f2=fleetById.get(RK&&RK.fid);if(!f2)return;const r=cv2.getBoundingClientRect(),R=rkRange();RK.x=f2.x+((e.clientX-r.left)/r.width-.5)*2*R;RK.y=f2.y+((e.clientY-r.top)/r.height-.5)*2*R};
 cv2.addEventListener('pointerdown',e=>{const n=performance.now();if(n-RK.lt<380&&Math.hypot(e.clientX-RK.lx,e.clientY-RK.ly)<24){RK.lt=0;rkFixToggle();return}RK.lt=n;RK.lx=e.clientX;RK.ly=e.clientY;if(!RK.fix)mv(e)});cv2.addEventListener('pointermove',e=>{if(!RK.fix&&(e.buttons||e.pointerType==='mouse'))mv(e)});RK.iv=setInterval(rkDraw,60)}
function closeRk(){if(RK){clearInterval(RK.iv);RK=null}const d=$('rkRoot');if(d)d.remove()}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&RK)closeRk()});
function rkPick(i){if(RK)RK.pk=i}
function rkFire(){if(!RK||!RK.lock)return;const f=fleetById.get(RK.fid),tg={kind:RK.lock.kind,id:RK.lock.id};if(!f)return closeRk();
 if(fireRk(f,RK.pk,tg)){toast('Raketen gestartet auf '+RK.lock.name+'!');RK.pk=0;if(!f.rk.length)closeRk();refreshUI()}else toast('Ziel außer Reichweite oder verloren.')}
function rkDraw(){if(!RK)return;const f=fleetById.get(RK.fid),cv2=$('rkCv');if(!f||f.dead||!cv2||!f.rk||!f.rk.length){closeRk();return}
 const c=cv2.getContext('2d'),R=rkRange(),M=240,sc=M/R,P=(x,y)=>[M+(x-f.x)*sc,M+(y-f.y)*sc],now=performance.now();
 const L=nearby(f.x,f.y,R,e=>e.owner!==0&&!e.dead&&fleetVis(e)>.5).map(e=>({kind:'fleet',id:e.id,x:e.x,y:e.y,name:e.name,owner:e.owner}));
 const k=Math.ceil(R/CELL),cx=cellX(f.x),cy=cellY(f.y);for(let dy=-k;dy<=k;dy++)for(let dx=-k;dx<=k;dx++){const p=planetAt(cx+dx,cy+dy);if(p&&p.owner!==0&&Math.hypot(p.x-f.x,p.y-f.y)<=R)L.push({kind:'planet',id:p.id,x:p.x,y:p.y,name:p.name,owner:p.owner})}
 for(const m of (S.xm||[]))if(Math.hypot(m.x-f.x,m.y-f.y)<=R)L.push({kind:'mine',id:m.id,x:m.x,y:m.y,name:'Gegnerische Mine',owner:m.o});
 for(const [pe,r] of NET.rem){for(const a of r.fl)if(Math.hypot(a[1]-f.x,a[2]-f.y)<=R)L.push({kind:'rf',id:pe+':'+a[0],x:a[1],y:a[2],name:r.n+' (Freund)',owner:-9});for(const i of r.pl){const p=planets[i];if(p&&Math.hypot(p.x-f.x,p.y-f.y)<=R)L.push({kind:'rp',id:pe+':'+i,x:p.x,y:p.y,name:r.n+': '+p.name,owner:-9})}}
 let best=null,bd=26/sc;if(RK.fix){best=L.find(o=>o.kind===RK.fix.kind&&String(o.id)===String(RK.fix.id));if(!best){const tp=targetPos(RK.fix);if(tp)best={kind:RK.fix.kind,id:RK.fix.id,x:tp.x,y:tp.y,name:tp.name,owner:tp.owner,far:1};else RK.fix=null}}
 if(!RK.fix)for(const o of L){const d=Math.hypot(o.x-RK.x,o.y-RK.y);if(d<bd){bd=d;best=o}}RK.lock=best;
 c.fillStyle='#02040a';c.fillRect(0,0,480,480);c.strokeStyle='rgba(56,189,248,.25)';c.lineWidth=1;for(let i=1;i<=3;i++){c.beginPath();c.arc(M,M,M*i/3-1,0,6.283);c.stroke()}
 c.beginPath();c.moveTo(M,0);c.lineTo(M,480);c.moveTo(0,M);c.lineTo(480,M);c.stroke();
 for(const o of L){const [x,y]=P(o.x,o.y);c.fillStyle=o.owner===-9?'#facc15':o.kind==='planet'?(o.owner>0?'#ef4444':'#64748b'):'#f87171';if(o.kind==='planet'||o.kind==='rp'){c.beginPath();c.arc(x,y,5,0,6.283);c.fill()}else{c.save();c.translate(x,y);c.beginPath();c.moveTo(0,-6);c.lineTo(5,5);c.lineTo(-5,5);c.closePath();c.fill();c.restore()}}
 for(const o of S.mines||[]);c.fillStyle='#22d3ee';c.beginPath();c.arc(M,M,5,0,6.283);c.fill();c.strokeStyle='#22d3ee';c.beginPath();c.arc(M,M,9,0,6.283);c.stroke();
 for(const r of RKT){const [x,y]=P(r.x,r.y);c.fillStyle=r.c;c.fillRect(x-2,y-2,4,4)}
 let [qx,qy]=best?P(best.x,best.y):P(RK.x,RK.y);qx=clamp(qx,8,472);qy=clamp(qy,8,472);const col=best?(RK.fix?'#ff2d55':'#f43f5e'):'#fbbf24',rr=best?16+2*Math.sin(now/120):14;
 c.strokeStyle=col;c.lineWidth=1.8;c.shadowColor=col;c.shadowBlur=8;c.beginPath();c.arc(qx,qy,rr,0,6.283);c.stroke();
 for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){c.beginPath();c.moveTo(qx+a*(rr-5),qy+b*(rr-5));c.lineTo(qx+a*(rr+9),qy+b*(rr+9));c.stroke()}c.shadowBlur=0;
 if(best){c.fillStyle='#fecdd3';c.font='11px sans-serif';c.fillText((RK.fix?'🔒 ':'')+best.name,clamp(qx+rr+4,4,330),clamp(qy-rr,12,470))}
 const pk=f.rk[RK.pk]||f.rk[0],mul=1+tb('rdmg'),dist=best?Math.hypot(best.x-f.x,best.y-f.y):0;
 const info=best?`Ziel: <b class="text-rose-300">${best.name}</b> • ${best.kind==='planet'||best.kind==='rp'?'Planet':best.kind==='mine'?'Mine (Klein = entschärfen, Mittel/Groß = zünden, Sprengradius '+MINE_R+')':'Flotte'} • Distanz ${fmt(dist)} • Flugzeit ca. ${Math.round(dist/RK_V*1.15)} s${best.far?' <b class="text-amber-300">(außer Reichweite)</b>':''}${RK.fix?' • <b class="text-rose-300">fixiert</b>':''}<br>Salve: ${pk.n} Rakete(n) × ${fmt(pk.d*mul)} Schaden (Gegnerabwehr kann einzelne abfangen)`:'Fadenkreuz über ein Ziel ziehen/tippen, Doppelklick fixiert das Ziel. Reichweite: '+fmt(R);
 setHtml($('rkUi'),`<div class="text-slate-300 mb-2">${info}</div><div class="flex flex-wrap gap-1 mb-2">${f.rk.map((p,i)=>btn(`${RKD[p.t].nm} ×${p.n} • ${fmt(p.d*mul)}`,`rkPick(${i})`,i===RK.pk?'amber':'slate')).join('')}</div><div class="flex justify-end gap-2">${btn(RK.fix?'Fixierung lösen':'Ziel fixieren','rkFixToggle()','amber',!best)}${btn('Schließen','closeRk()','slate')}${btn('<i class="fa-solid fa-bullseye"></i> Abschuss','rkFire()','rose',!best||best.far)}</div>`)}
/* Button im Zielfenster */
{const _rt=renderTarget;renderTarget=function(force){_rt(force);try{const a=$('targetActions');if(sel&&sel.type==='fleet'&&a){const f=fleetById.get(sel.id);const has=f&&f.owner===0&&f.rk&&f.rk.length&&f.placed;let b=$('rkTBtn');
 if(has&&(!b||!b.isConnected)){b=document.createElement('span');b.id='rkTBtn';b.innerHTML=btn('<i class="fa-solid fa-crosshairs"></i> Raketen',`openRocket(${f.id})`,'rose');a.appendChild(b)}else if(!has&&b)b.remove()}}catch(e){}}}

/* ===== ADD-ON v3.4.1: Bot-Verteidigung, Raketen im Angriffsmenü, Online-Modus ===== */
const YEL='#facc15',NET={peer:null,conns:[],host:false,code:'',rem:new Map()};
let _ap=0,_xv=0,_xa=0;
function planetHit(p,d){const np=basePower(p.garrison);if(np>0){applyLoss([p.garrison],Math.min(.7,d/np));for(const k in p.garrison)if(p.garrison[k]<=0)delete p.garrison[k];p.dirty=true}}
function rkFixToggle(){if(!RK)return;if(RK.fix){RK.fix=null;toast('Fixierung gelöst.')}else if(RK.lock){RK.fix={kind:RK.lock.kind,id:RK.lock.id};toast('Ziel fixiert – Doppelklick löst es wieder.')}}
/* Bot-Schilde: bauen wenn bedroht (oder am Heimatplaneten), blockieren alle fremden Flotten */
/* Bot-Minen und -Schilde muessen wie beim Spieler von einem Schiff platziert werden */
function aiPendDrop(ai,k){let n=0;for(const f of fleets)if(f.owner===ai.id&&!f.dead&&f.xdrop&&(!k||f.xdrop.k===k))n++;return n}
function aiStartDrop(ai,k,x,y){if(aiPendDrop(ai))return false;let best=null,bd=1e18;
 for(const f of fleets){if(f.owner!==ai.id||f.dead||f.order||f.xdrop||!basePower(f.ships)||isStealthFleet(f))continue;const d=Math.hypot(f.x-x,f.y-y);if(d<bd){bd=d;best=f}}
 if(!best||bd>40000)return false;best.order={type:'move',x,y};best.wp=null;best.xdrop={k,x,y,t:S.T+Math.max(240,bd/Math.max(1,fleetSpeed(best))*1.5+60)};return true}
function aiDropTick(){ensureX();for(const f of fleets){const d=f.xdrop;if(!d)continue;const ai=AIS[f.owner-1];
  if(f.dead||!ai||ai.dead){f.xdrop=null;continue}
  if(S.T>d.t){f.xdrop=null;if(f.order&&f.order.type==='move')f.order=null;continue}
  if(Math.hypot(f.x-d.x,f.y-d.y)>250)continue;
  const R=d.k==='m'?MINE_R:SH_R;
  if(nearby(f.x,f.y,R*1.3,e=>e.owner!==ai.id&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>0).length)continue;
  if(d.k==='m')S.xm.push({id:S.nextB=(S.nextB||0)+1,x:f.x,y:f.y,o:ai.id,t0:S.T+20});
  else S.xs.push({id:S.nextB=(S.nextB||0)+1,o:ai.id,x:f.x,y:f.y,q:1,t0:S.T+5});
  FX.push({k:'wave',t0:performance.now(),dur:900,x1:f.x,y1:f.y,s:d.k==='m'?200:SH_R,c:'#f87171'});
  f.xdrop=null;const a=f.h||0;f.order={type:'move',x:clamp(f.x+Math.cos(a)*420,-HALF+100,HALF-100),y:clamp(f.y+Math.sin(a)*420,-HALF+100,HALF-100)}}}
function aiXTick(g){_xa+=g;if(_xa<3)return;_xa=0;ensureX();try{aiDropTick()}catch(e){}
 for(let n=0;n<20;n++){const ai=AIS[_ap=(_ap+1)%AIS.length];if(!ai||ai.dead||ai.planets<2||ai.tech<2||unl(ai,'shield')<=0||Math.max(ai.bank||0,ai.dbank||0)<700)continue;
  const mine=S.xs.filter(s=>s.o===ai.id);if(mine.length>=Math.max(1,Math.floor(Math.min(3+ELV(ai)*3,1+Math.floor(ai.planets/2))*unl(ai,'shield'))))continue;if(ai.style!=='def'&&Math.random()<.5)continue;
  const own=planets.filter(p=>p.owner===ai.id);let pick=null;
  for(const p of own){if(nearby(p.x,p.y,5000,e=>e.owner!==ai.id&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>600).length){pick=p;break}}
  if(!pick)pick=(!mine.length&&planets[ai.home]&&planets[ai.home].owner===ai.id)?planets[ai.home]:(Math.random()<.5?own[Math.floor(Math.random()*own.length)]:null);
  if(!pick)continue;const a=Math.random()*6.283,x=pick.x+Math.cos(a)*250,y=pick.y+Math.sin(a)*250;
  if(S.xs.some(s=>s.o===ai.id&&Math.hypot(s.x-x,s.y-y)<700))continue;
  if(!aiStartDrop(ai,'s',x,y))continue;if((ai.dbank||0)>=600)ai.dbank-=600;else ai.bank-=600}}
function xsTick(g){const now=performance.now();
 for(let i=S.xs.length-1;i>=0;i--){const s=S.xs[i],ai=AIS[s.o-1];if(!ai||ai.dead){S.xs.splice(i,1);continue}if(S.T<s.t0)continue;
  const R=SH_R*(1+ai.tech*.02),mx=SH_HP*(1+ai.tech*.05);let dmg=0;
  for(const f of nearby(s.x,s.y,R+80,e=>e.owner!==s.o&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>0)){const dx=f.x-s.x,dy=f.y-s.y,d=Math.hypot(dx,dy);
   if(d<R+4){const k=(R+6)/(d||1);f.x=d?s.x+dx*k:s.x+R+6;f.y=d?s.y+dy*k:s.y}if(d<R+60){f.shb=S.T;dmg+=fleetPower(f)*SH_DPS*g}}
  if(dmg>0){s.q-=dmg/mx;s.fl=now}else if(s.q<1)s.q=Math.min(1,s.q+.002*g);
  if(s.q<=0){S.xs.splice(i,1);FX.push({k:'boom',t0:now,dur:700,x1:s.x,y1:s.y,s:50,c:'#f87171'});addLog('[SCHILD] Ein gegnerisches Schutzschild wurde zerstört!',s.x,s.y)}}}
/* Bot-Minen & Bot-Flaks wirken auch gegen andere Bots */
function xvTick(g){_xv+=g;if(_xv<1)return;const dt=_xv;_xv=0;const nw=performance.now();
 for(let i=S.xm.length-1;i>=0;i--){const m=S.xm[i],ai=AIS[m.o-1];if(!ai||ai.dead||S.T<m.t0)continue;
  const hit=nearby(m.x,m.y,MINE_R,e=>e.owner>0&&e.owner!==m.o&&!e.dead&&basePower(e.ships)>0);if(!hit.length)continue;S.xm.splice(i,1);
  for(const f of hit)hitFleet(f,MINE_D*(1+ai.tech*.03),1);FX.push({k:'boom',t0:nw,dur:700,x1:m.x,y1:m.y,s:55,c:'#f59e0b'})}
 for(const a of S.xa){const p=planets[a.pid],ai=AIS[a.o-1];if(!p||!ai||ai.dead)continue;const pos=aaPos(a),tg=nearby(pos.x,pos.y,AA_R,e=>e.owner>0&&e.owner!==a.o&&!e.dead&&basePower(e.ships)>0);if(!tg.length)continue;
  const b=tg[0],bx=b.x,by=b.y;hitFleet(b,AA_DPS*(1+ai.tech*.03)*dt,1);if(nw>(a.fxT||0)&&FX.length<400){a.fxT=nw+500;FX.push({k:'shot',t0:nw,dur:200,x0:pos.x,y0:pos.y,x1:bx,y1:by,c:'#e879f9'})}}}
{const _xt=xTick;xTick=function(g){_xt(g);xsTick(g);xvTick(g);aiXTick(g)}}
{const _b=window.xDrawBelow;window.xDrawBelow=function(){_b();const z=cam.zoom,now=performance.now();
 for(const s of S.xs||[]){const ai=AIS[s.o-1];if(!ai)continue;const [sx,sy]=w2s(s.x,s.y),R=SH_R*(1+ai.tech*.02)*z;if(sx<-R-20||sy<-R-20||sx>W+R+20||sy>H+R+20)continue;
  const gr=ctx.createRadialGradient(sx,sy,R*.4,sx,sy,R);gr.addColorStop(0,'rgba(239,68,68,.02)');gr.addColorStop(1,'rgba(239,68,68,'+(.12+.3*Math.max(0,1-(now-(s.fl||0))/350)).toFixed(2)+')');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,R,0,6.283);ctx.fill();ctx.strokeStyle='rgba(248,113,113,.85)';ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.lineDashOffset=now/60;ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#fca5a5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,R+5,-1.5708,-1.5708+6.283*Math.max(0,s.q));ctx.stroke()}
 for(const r of NET.rem.values()){for(const i of r.pl){const p=planets[i];if(!p)continue;const [sx,sy]=w2s(p.x,p.y);if(sx<-30||sy<-30||sx>W+30||sy>H+30)continue;
   ctx.fillStyle='rgba(250,204,21,.2)';ctx.strokeStyle=YEL;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,Math.max(7,p.r*z+5),0,6.283);ctx.fill();ctx.stroke()}
  for(const s of r.sh){const [sx,sy]=w2s(s[0],s[1]),R=shR()*z;if(sx<-R||sy<-R||sx>W+R||sy>H+R)continue;ctx.strokeStyle=YEL;ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.beginPath();ctx.arc(sx,sy,R,0,6.283);ctx.stroke();ctx.setLineDash([])}}}}
/* Raketen im Angriffsmenü */
function atkRocket(){const t=atk&&(atk.kind==='planet'?planets[atk.id]:fleetById.get(atk.id));if(!t)return;const own=fleets.filter(f=>f.owner===0&&f.placed&&!f.dead&&f.rk&&f.rk.length);
 const f=own.find(x=>x.id===atk.fid)||own.sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];if(!f){toast('Keine platzierte Flotte mit Raketen.');return}
 const kind=atk.kind,id=atk.id;closeModal2();openRocket(f.id,{kind,id})}
{const _ra=renderAttack;renderAttack=function(){_ra();try{if(!atk)return;const b=$('modal2Body');let x=$('atkRk');if(!x||!x.isConnected){x=document.createElement('div');x.id='atkRk';x.className='mt-2';b.appendChild(x)}
 const has=fleets.some(f=>f.owner===0&&f.placed&&!f.dead&&f.rk&&f.rk.length);setHtml(x,`<div class="flex justify-end">${btn('<i class="fa-solid fa-rocket"></i> Raketen abfeuern','atkRocket()','amber',!has)}</div>`+(has?'':'<div class="text-right text-slate-500 text-[10px]">Keine Flotte mit montierten Raketen.</div>'))}catch(e){}}}
/* Online-Modus (WebRTC über PeerJS, Raumcode) */
function netSend(m){if(!NET.peer)return;m.from=NET.peer.id;for(const c of NET.conns)if(c.open)c.send(m)}
function netLoad(cb){if(window.Peer)return cb();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';s.onload=cb;s.onerror=()=>toast('Online-Bibliothek konnte nicht geladen werden (Internet nötig).');document.head.appendChild(s)}
const netErr=e=>toast('Netzwerk: '+((e&&e.type)||e));
function netStop(q){for(const c of NET.conns)try{c.close()}catch(e){}NET.conns=[];if(NET.peer)try{NET.peer.destroy()}catch(e){}NET.peer=null;NET.rem.clear();NET.code='';if(!q)netUi()}
function netHost(){netLoad(()=>{netStop(true);const id='GE'+Math.random().toString(36).slice(2,7).toUpperCase(),p=NET.peer=new Peer(id);NET.host=true;p.on('open',()=>{NET.code=id;netUi()});p.on('connection',netAdd);p.on('error',netErr)})}
function netJoin(){const code=($('netCode').value||'').trim().toUpperCase();if(!code)return;netLoad(()=>{netStop(true);const p=NET.peer=new Peer();NET.host=false;p.on('open',()=>{NET.code=code;netAdd(p.connect(code,{reliable:true}));netUi()});p.on('error',netErr)})}
function netAdd(c){c.on('open',()=>{NET.conns.push(c);toast('Online: Verbindung steht.');netUi();netPush()});c.on('data',m=>netRecv(c,m));c.on('close',()=>{NET.conns=NET.conns.filter(x=>x!==c);NET.rem.delete(c.peer);netUi()});c.on('error',netErr)}
function netPush(){if(!NET.conns.length)return;netSend({t:'st',n:S.name||'Spieler',pl:[...PS],fl:fleets.filter(f=>f.owner===0&&f.placed&&!f.dead).map(f=>[f.id,Math.round(f.x),Math.round(f.y),Math.round(fleetPower(f)),+(f.h||0).toFixed(2)]),sh:(S.sh||[]).map(s=>[Math.round(s.x),Math.round(s.y)])})}
function netRecv(c,m){if(!m||!m.t)return;if(NET.host)for(const o of NET.conns)if(o!==c&&o.open)o.send(m);
 if(m.t==='st')NET.rem.set(m.from,{n:m.n,pl:m.pl||[],fl:m.fl||[],sh:m.sh||[],t:Date.now()});
 else if(m.t==='hit'&&NET.peer&&m.to===NET.peer.id){const nw=performance.now();
  if(m.k==='f'){const f=fleetById.get(m.i);if(f&&f.owner===0)hitFleet(f,m.d,1)}else{const p=planets[m.i];if(p&&p.owner===0)planetHit(p,m.d)}
  FX.push({k:'boom',t0:nw,dur:650,x1:m.x,y1:m.y,s:30,c:'#fb923c'});pushAlert('Raketentreffer von '+m.n+'!',m.x,m.y);playSound('boom');refreshUI()}}
{const _tp=targetPos;targetPos=function(o){if(o.kind==='rf'||o.kind==='rp'){const [pe,i]=String(o.id).split(':'),r=NET.rem.get(pe);if(!r)return null;
  if(o.kind==='rf'){const a=r.fl.find(q=>q[0]==+i);return a?{x:a[1],y:a[2],owner:-9,name:r.n+' (Flotte)'}:null}const p=planets[+i];return p&&r.pl.includes(+i)?{x:p.x,y:p.y,owner:-9,name:p.name}:null}return _tp(o)}}
{const _ri=rkImpact;rkImpact=function(r,t){if(r.t.kind==='rf'||r.t.kind==='rp'){const nw=performance.now(),[pe,i]=String(r.t.id).split(':');
  FX.push({k:'boom',t0:nw,dur:650,x1:r.x,y1:r.y,s:30,c:'#fb923c'});netSend({t:'hit',to:pe,k:r.t.kind==='rf'?'f':'p',i:+i,d:r.d,n:S.name||'Spieler',x:r.x,y:r.y});toast('Treffer bei '+t.name+'!');playSound('boom');return}_ri(r,t)}}
{const _r2=render;render=function(){_r2();try{if(!NET.rem.size)return;const z=cam.zoom;ctx.setTransform(dpr,0,0,dpr,0,0);
 for(const r of NET.rem.values())for(const a of r.fl){const [sx,sy]=w2s(a[1],a[2]);if(sx<-30||sy<-30||sx>W+30||sy>H+30)continue;const s=clamp(5+z*5,5,12);
  ctx.fillStyle='rgba(250,204,21,.28)';ctx.beginPath();ctx.arc(sx,sy,s+5,0,6.283);ctx.fill();tri(sx,sy,a[4],s);ctx.fillStyle=YEL;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();
  if(z>.25){ctx.fillStyle=YEL;ctx.font='10px sans-serif';ctx.fillText(r.n,sx+s+4,sy-s)}}}catch(e){}}}
{const _rm=renderMini;renderMini=function(){_rm();if(!NET.rem.size)return;const m=mctx,s=150/WORLD;m.fillStyle=YEL;
 for(const r of NET.rem.values()){for(const i of r.pl){const p=planets[i];if(p)m.fillRect((p.x+HALF)*s-1.5,(p.y+HALF)*s-1.5,3,3)}for(const a of r.fl)m.fillRect((a[1]+HALF)*s-1,(a[2]+HALF)*s-1,3,3)}}}
function netPanel(){let d=$('netRoot');if(d){d.remove();return}d=document.createElement('div');d.id='netRoot';d.className='fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-2';d.onclick=e=>{if(e.target===d)d.remove()};
 d.innerHTML='<div class="glass-panel rounded-xl p-4 w-[min(94vw,420px)] text-xs"><div id="netUi"></div></div>';document.body.appendChild(d);netUi()}
function netUi(){const el=$('netUi');if(!el)return;const fr=[...NET.rem.values()].map(r=>`<span class="inline-block rounded px-2 py-0.5 mr-1 mb-1 border" style="border-color:${YEL};color:${YEL}">${r.n}</span>`).join('')||'<span class="text-slate-500">noch keine Freunde in der Welt</span>';
 const h=`<div class="flex justify-between items-center mb-2"><b class="font-orbitron" style="color:${YEL}"><i class="fa-solid fa-globe"></i> ONLINE-MODUS</b><button class="nb" onclick="netPanel()">✕</button></div>`
 +(!NET.peer?`<div class="text-slate-300 mb-2">Einer erstellt einen Raum und gibt den Code weiter, die anderen treten bei. Freunde erscheinen überall <b style="color:${YEL}">gelb</b>.</div><div class="flex flex-wrap gap-2 items-center">${btn('Raum erstellen','netHost()','emerald')}<input id="netCode" placeholder="Raumcode" class="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-28 uppercase">${btn('Beitreten','netJoin()','cyan')}</div>`
 :`<div class="mb-2 text-slate-300">${NET.host?'Dein Raumcode':'Verbunden mit Raum'}: <b class="text-lg" style="color:${YEL}">${NET.code||'…'}</b>${NET.host?'<div class="text-slate-500">Gib den Code deinen Freunden. Der Host muss die Seite offen lassen.</div>':''}</div><div class="mb-2">Freunde: ${fr}</div>${btn('Trennen','netStop()','rose')}`)
 +'<div class="text-slate-500 mt-3">Alle nutzen dieselbe Weltkarte, jeder spielt seinen eigenen Spielstand. Freunde sind gelb, ihre Flotten/Planeten/Schilde sichtbar und mit Raketen (Fadenkreuz-Menü) angreifbar.</div>';setHtml(el,h)}
{const yb=document.querySelector("button[onclick=\"openModal('yard')\"]");if(yb)yb.insertAdjacentHTML('afterend','<button onclick="netPanel()" title="Online-Modus mit Freunden" class="nb"><i class="fa-solid fa-globe"></i> Online</button>')}
setInterval(()=>{try{netPush();const n=Date.now();for(const [k,r] of NET.rem)if(n-r.t>8000)NET.rem.delete(k);if($('netUi'))netUi()}catch(e){}},500);

/* ===== ADD-ON v3.4.2: Raketen aus der Werft, Zuweisung im Flottenmanager, Kanonenboot-Regel ===== */
const rkOk=f=>{const kb=SHIPS.findIndex(s=>s.id==='gunship');for(const t in f.ships)if(f.ships[t]>0&&SHIPS.indexOf(SHIP[t])>=kb)return true;return false};
function xYardHtml(){return xShieldHtml()+xRkYard()}
function xRkYard(){ensureX();const hR=S.lv.rocket_tech>0,hD=S.lv.rd_tech>0;
 let h='<h3 class="font-orbitron text-rose-300 mt-4 mb-2"><i class="fa-solid fa-rocket"></i> RAKETEN &amp; RAKETENABWEHR</h3><div class="text-slate-400 mb-1">Gebaute Systeme landen im Lager und werden im Flottenmenü wie Schiffe zugewiesen. Nur Flotten mit Schiffen ab Kanonenboot können sie tragen.</div><div class="grid sm:grid-cols-2 gap-2">';
 for(const t of['S','M','L']){const d=RKD[t],c=shipCost({cost:RKC[t]});
  h+=card(`<b class="font-orbitron text-white">Raketenpaket ${d.nm}</b><div class="text-slate-400">${d.n} zielsuchende Rakete(n) × ${d.d} Schaden • Lager <b>${S.rst[t]}</b></div><div class="my-1">${costHtml(c)}</div>`
   +(hR?`<div class="flex gap-1">${btn('Bauen ×1',`rkBuild('${t}',1)`)}${btn('×5',`rkBuild('${t}',5)`)}</div>`:`<div class="text-rose-400 cursor-pointer" onclick="gotoTechFromYard('rocket_tech')"><i class="fa-solid fa-lock"></i> Benötigt: Raketensysteme (Klick)</div>`))}
 h+=card(`<b class="font-orbitron text-white">Raketenabwehr-System</b><div class="text-slate-400">Fängt 1 Rakete ab • Bauzeit ${Math.round(rdTime())} s je System, eins nach dem anderen • Lager <b>${S.rst.D}</b> • in Bau <b>${S.dq.n}</b>${S.dq.n?' ('+fdur(Math.max(0,(S.dq.t-S.T)/S.gs))+')':''}</div><div class="my-1">${costHtml(shipCost({cost:RDC}))}</div>`
  +(hD?`<div class="flex gap-1">${btn('Bauen ×1',"rdQueue(1)")}${btn('×5',"rdQueue(5)")}</div>`:`<div class="text-rose-400 cursor-pointer" onclick="gotoTechFromYard('rd_tech')"><i class="fa-solid fa-lock"></i> Benötigt: Raketenabwehr (Klick)</div>`));
 return h+'</div>'}
function rkBuild(t,n){ensureX();const c=shipCost({cost:RKC[t]}),tot={};for(const k in c)tot[k]=c[k]*n;if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}pay(tot);S.rst[t]+=n;playSound('ok');refreshUI()}
function rdQueue(n){ensureX();if(S.dq.n+n>20){toast('Bauschlange voll (max. 20).');return}const c=shipCost({cost:RDC}),tot={};for(const k in c)tot[k]=c[k]*n;if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}pay(tot);S.dq.n+=n;if(!S.dq.t)S.dq.t=S.T+rdTime();playSound('ok');refreshUI()}
function xFleetHtmlOld2(){const mine=fleets.filter(f=>f.owner===0&&basePower(f.ships)>0);if(!mine.length)return'';ensureX();const hR=S.lv.rocket_tech>0,hD=S.lv.rd_tech>0,st=S.rst;
 let h='<h3 class="font-orbitron text-rose-300 mt-4 mb-2"><i class="fa-solid fa-rocket"></i> RAKETEN &amp; RAKETENABWEHR</h3>';
 if(!hR&&!hD)return h+'<div class="text-slate-500">Erforsche „Raketensysteme“ (Waffen) bzw. „Raketenabwehr“ (Verteidigung) und baue sie in der Raumwerft.</div>';
 h+=`<div class="text-slate-400 mb-1">Lager: Klein ×${st.S} • Mittel ×${st.M} • Groß ×${st.L} • Abwehr ×${st.D}${S.dq.n?` (+${S.dq.n} im Bau)`:''}<br>Zuweisen nur innerhalb deines Gebietes. Tragen können es nur Flotten mit Schiffen ab Kanonenboot.</div><div class="space-y-1.5">`;
 for(const f of mine){const ok=rkOk(f),ed=canEdit(f),rk=f.rk||[],pk=rk.map(p=>`${RKD[p.t].nm} ×${p.n}`).join(', ')||'keine';
  h+=card(`<b class="text-cyan-300">${f.name}</b>`+(ok?`<div class="text-slate-400">Raketen (${rk.length}/${rkSlots()}): ${pk}<br>Abwehr: ${f.rd||0}/${rdCap()}</div><div class="flex gap-1 flex-wrap mt-1">`
   +(hR?['S','M','L'].map(t=>btn('+ '+RKD[t].nm,`rkAssign(${f.id},'${t}')`,'amber',!ed||!st[t]||rk.length>=rkSlots())).join('')+rk.map((p,i)=>btn('− '+RKD[p.t].nm,`rkUnassign(${f.id},${i})`,'slate',!ed)).join('')+btn('<i class="fa-solid fa-crosshairs"></i> Feuern',`openRocket(${f.id})`,'rose',!rk.length||!f.placed):'')
   +(hD?btn('+ Abwehr',`rdAssign(${f.id})`,'emerald',!ed||!st.D||(f.rd||0)>=rdCap())+btn('− Abwehr',`rdUnassign(${f.id})`,'slate',!ed||!f.rd):'')+'</div>':'<div class="text-slate-500">Nur kleine Schiffe – Raketen und Abwehr erst ab Kanonenboot.</div>'))}
 return h+'</div>'}
function rkAssign(fid,t){ensureX();const f=fleetById.get(fid);if(!f||f.owner!==0)return;if(!rkOk(f)){toast('Erst Schiffe ab Kanonenboot können Raketen tragen.');return}if(!canEdit(f)){toast('Flotte muss unbewegt im eigenen Gebiet sein.');return}
 f.rk=f.rk||[];if(f.rk.length>=rkSlots()){toast('Alle Raketen-Slots belegt.');return}if(!(S.rst[t]>0)){toast('Kein Raketenpaket im Lager – in der Werft bauen.');return}S.rst[t]--;f.rk.push(mkPack(t));playSound('ok');refreshUI()}
function rkUnassign(fid,i){const f=fleetById.get(fid);if(!f||!f.rk||!f.rk[i]||!canEdit(f))return;const p=f.rk.splice(i,1)[0];S.rst[p.t]++;playSound('click');refreshUI()}
function rdAssign(fid){ensureX();const f=fleetById.get(fid);if(!f||f.owner!==0)return;if(!rkOk(f)){toast('Erst Schiffe ab Kanonenboot können Abwehr tragen.');return}if(!canEdit(f)){toast('Flotte muss unbewegt im eigenen Gebiet sein.');return}
 if((f.rd||0)>=rdCap()){toast('Alle Abwehr-Slots belegt.');return}if(!(S.rst.D>0)){toast('Kein Abwehrsystem im Lager – in der Werft bauen.');return}S.rst.D--;f.rd=(f.rd||0)+1;playSound('ok');refreshUI()}
function rdUnassign(fid){const f=fleetById.get(fid);if(!f||!f.rd||!canEdit(f))return;f.rd--;S.rst.D++;playSound('click');refreshUI()}
{const _xt=xTick;xTick=function(g){_xt(g);if(S.dq.n>0&&S.T>=S.dq.t){S.rst.D++;S.dq.n--;S.dq.t=S.dq.n>0?S.T+rdTime():0;if(curModal==='yard'||curModal==='fleets')refreshUI()}}}
{const _df=disbandFleet;disbandFleet=function(id){const f=fleetById.get(id);if(f&&canEdit(f)){ensureX();for(const p of f.rk||[])S.rst[p.t]++;S.rst.D+=f.rd||0;f.rk=[];f.rd=0}_df(id)}}
{const _od=onDouble;onDouble=function(x,y){window._md=performance.now();return _od(x,y)}}
{const _sb=spawnBattle;spawnBattle=function(f,tx,ty,o,r,myth){const d=_sb(f,tx,ty,o,r,myth);if(d&&f&&(myth||(f.order&&f.order.kind==='planet')))f.hold=performance.now()+d;return d}}
setInterval(()=>{try{if(curModal==='yard')xExtra()}catch(e){}},700);

/* ===== ADD-ON v3.4.3: Raketen & Abwehr direkt in der Flottenkarte ===== */
function xFleetHtml(){return''}
function xRkStock(){ensureX();if(!(S.lv.rocket_tech>0||S.lv.rd_tech>0))return'';return`<div class="mt-1 text-slate-400">Raketenlager: Klein ×${S.rst.S} • Mittel ×${S.rst.M} • Groß ×${S.rst.L} • Abwehr ×${S.rst.D}${S.dq.n?` (+${S.dq.n} im Bau)`:''}</div>`}
function rkUnT(fid,t){const f=fleetById.get(fid);if(!f||!f.rk)return;for(let i=f.rk.length-1;i>=0;i--)if(f.rk[i].t===t)return rkUnassign(fid,i)}
function xRkRows(f,ed){ensureX();const hR=S.lv.rocket_tech>0,hD=S.lv.rd_tech>0;if(!hR&&!hD)return'';
 if(!rkOk(f))return'<div class="text-[10px] text-slate-500 mb-1">Raketen &amp; Abwehr erst ab Kanonenboot.</div>';
 const rk=f.rk||[],row=(ic,col,nm,stock,have,dn,up)=>`<div class="flex items-center justify-between shiprow"><span><i class="fa-solid ${ic} ${col}"></i> ${nm} <span class="text-slate-500">(Lager ${stock})</span></span><span class="shipctl shipctl2 ${ed?'':'dis'}">${btn('-1',dn,'slate')} <b class="inline-block w-10 text-center">${have}</b> ${btn('+1',up,'slate')}</span></div>`;
 let h='<div class="space-y-0.5 mb-2 border-t border-slate-800 pt-1">';
 if(hR)for(const t of['S','M','L'])h+=row('fa-rocket','text-rose-400','Raketen '+RKD[t].nm,S.rst[t],rk.filter(p=>p.t===t).length,`rkUnT(${f.id},'${t}')`,`rkAssign(${f.id},'${t}')`);
 if(hD)h+=row('fa-shield-virus','text-sky-400','Raketenabwehr',S.rst.D,f.rd||0,`rdUnassign(${f.id})`,`rdAssign(${f.id})`);
 return h+`<div class="text-[10px] text-slate-500">Raketen-Slots ${rk.length}/${rkSlots()} • Abwehr-Slots ${f.rd||0}/${rdCap()}</div></div>`}

/* ===== ADD-ON v3.6: Bot-Kriege (OpenFront-Stil) & Raketen gegen Minen ===== */
(function(){
const mineList=()=>[...(S.mines||[]).map(m=>({m,o:0,L:S.mines})),...(S.xm||[]).map(m=>({m,o:m.o,L:S.xm}))];
function findMine(id){const a=(S.xm||[]).find(m=>m.id===id);if(a)return{m:a,o:a.o,L:S.xm};const b=(S.mines||[]).find(m=>m.id===id);if(b)return{m:b,o:0,L:S.mines};return null}
const _tp=targetPos;
targetPos=function(o){if(o&&o.kind==='mine'){const q=findMine(o.id);return q?{x:q.m.x,y:q.m.y,owner:q.o,name:q.o===0?'Eigene Mine':'Gegnerische Mine'}:null}return _tp(o)};
/* Mine entschärfen (still entfernen) oder zünden (Sprengschaden + Kettenreaktion) */
function blast(m,list,trigger,depth){const i=list.indexOf(m);if(i<0)return;list.splice(i,1);const nw=performance.now();
 FX.push({k:'boom',t0:nw,dur:700,x1:m.x,y1:m.y,s:trigger?55:30,c:trigger?'#f59e0b':'#22d3ee'});
 if(!trigger){FX.push({k:'wave',t0:nw,dur:500,x1:m.x,y1:m.y,s:120,c:'#22d3ee'});addLog('[MINE] Eine Mine wurde durch eine Rakete entschärft.',m.x,m.y);return}
 FX.push({k:'wave',t0:nw,dur:800,x1:m.x,y1:m.y,s:MINE_R*1.2,c:'#f59e0b'});
 const ai=m.o?AIS[m.o-1]:null,dmg=ai?MINE_D*(1+ai.tech*.03):MINE_D*(1+tb('mdmg'));
 const hit=nearby(m.x,m.y,MINE_R*(ai?1:1+tb('mrad')),e=>!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>0);
 for(const f of hit)hitFleet(f,dmg,ai?1:1+tb('mgx'));
 addLog('[MINE] Eine Mine wurde durch eine Rakete gezündet'+(hit.length?' ('+hit.length+' Flotte(n) getroffen)':'')+'!',m.x,m.y);playSound('boom');
 if(depth<6)for(const q of mineList()){if(q.m!==m&&Math.hypot(q.m.x-m.x,q.m.y-m.y)<MINE_R*1.1)blast(q.m,q.L,true,depth+1)}}
const _ri=rkImpact;
rkImpact=function(r,t){if(r.t.kind==='mine'){const q=findMine(r.t.id);if(q)blast(q.m,q.L,r.d>=1200,0);refreshUI();return}return _ri(r,t)};
const _ti=tryIntercept;
tryIntercept=function(r,t){if(r.t.kind==='mine')return false;return _ti(r,t)};
/* Bots beschießen Minen in ihrer Nähe mit ihren kleinsten Raketen */
let _bm=0;const _bt0=botTick;
botTick=function(g){_bt0(g);try{_bm+=g;if(_bm<5)return;_bm=0;
 for(const f of fleets){if(f.owner<=0||f.dead||!f.rk||!f.rk.length||S.T<(f.fmn||0))continue;f.fmn=S.T+25+Math.random()*30;
  let best=null,bd=2800;for(const q of mineList()){if(q.o===f.owner)continue;if(q.m.t0&&S.T<q.m.t0)continue;const d=Math.hypot(q.m.x-f.x,q.m.y-f.y);if(d<bd){bd=d;best=q}}
  if(!best)continue;let pi=0;f.rk.forEach((p,i)=>{if(p.d<f.rk[pi].d)pi=i});
  if(f.rk[pi].d>=1200&&bd<MINE_R*2.2)continue;fireRk(f,pi,{kind:'mine',id:best.m.id})}}catch(e){console.warn(e)}};
/* Bots greifen Nachbarn an, wenn keine freien Planeten mehr erreichbar sind */
function hunt(f){
 if(f.owner<=0||f.dead||f.order||f.cool>0||S.T<150||!basePower(f.ships))return;
 const ai=AIS[f.owner-1];if(!ai||ai.dead||S.T<(ai.huntAt||0)||fleetPower(f)<450)return;
 ai.huntAt=S.T+(ai.style==='def'?70:25)+Math.random()*40;
 const cx=cellX(f.x),cy=cellY(f.y),ag=aggrOf(ai),mayTake=S.T>=ai.capAt&&ai.planets<aiCap(ai);
 if(mayTake)for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const p=planetAt(cx+dx,cy+dy);
  if(p&&p.owner===-1&&Math.hypot(p.x-f.x,p.y-f.y)<=7*CELL&&estimate(f.ships,f.owner,defendersOf('planet',p)).aE>=estimate(f.ships,f.owner,defendersOf('planet',p)).dE*ag)return}
 const c=[],R=11;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const p=planetAt(cx+dx,cy+dy);if(!p||p.owner<0||p.owner===f.owner)continue;
  if(p.owner===0&&(S.T<300||(p.id===S.capital&&S.T<900)))continue;const d=Math.hypot(p.x-f.x,p.y-f.y);if(d<=R*CELL)c.push({kind:'planet',id:p.id,d})}
 for(const g of nearby(f.x,f.y,AGGRO*2,g=>g.owner!==f.owner&&!g.dead&&basePower(g.ships)>0&&(g.owner>0||(g.placed&&S.T>=300&&fleetVis(g)>=.3))))c.push({kind:'fleet',id:g.id,d:Math.hypot(g.x-f.x,g.y-f.y)});
 c.sort((a,b)=>a.d-b.d);let best=null,bs=1e18;
 for(const t of c.slice(0,10)){const o=t.kind==='planet'?planets[t.id]:fleetById.get(t.id);if(!o)continue;
  const e=estimate(f.ships,f.owner,defendersOf(t.kind,o));if(e.aE<e.dE*ag*1.1)continue;const sc=t.d+e.dE*2;if(sc<bs){bs=sc;best=t}}
 if(best){setAttack(f,best.kind,best.id);checkWarn(f)}}
const _th=think;
think=function(f){_th(f);try{hunt(f)}catch(e){console.warn(e)}};
})();

/* ===== ADD-ON v3.7: Rache & mehrfache Sofort-Angriffsmeldungen ===== */
function grudgeVal(ai,o){const r=ai.rev&&ai.rev[o];return r?r.v*Math.exp(-(S.T-r.t)/1200):0}
function grudgeAdd(ai,o,w){ai.rev=ai.rev||{};ai.rev[o]={v:Math.min(6,grudgeVal(ai,o)+w),t:S.T}}
{const _r=resolveAttack;resolveAttack=function(f){let to=-9;const a=f.owner;
 try{const o=f.order;if(o&&o.type==='atk'){const t=targetPos(o);if(t)to=t.owner}}catch(e){}
 const r=_r(f);
 if(to>0&&to!==a){const ai=AIS[to-1];if(ai&&!ai.dead)grudgeAdd(ai,a,ai.pers==='rusher'?1.5:ai.pers==='turtle'?.7:1)}
 return r}}
function aiRevenge(f,ai){if(!ai||!ai.rev||S.T<(ai.revAt||0)||fleetPower(f)<450)return null;
 let en=-9,bv=.99;for(const k in ai.rev){const o=+k;if(o>0&&AIS[o-1]&&AIS[o-1].dead){delete ai.rev[k];continue}const v=grudgeVal(ai,o);if(v>bv){bv=v;en=o}}
 if(en<0)return null;ai.revAt=S.T+15+Math.random()*25;
 if(en===0&&S.T<420)return null;
 const cx=cellX(f.x),cy=cellY(f.y),R=12,ag=aggrOf(ai)*Math.max(.55,1-.1*bv);let best=null,bsc=1e18;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const p=planetAt(cx+dx,cy+dy);if(!p||p.owner!==en)continue;
  if(en===0&&p.id===S.capital&&S.T<900)continue;
  const e=estimate(f.ships,f.owner,defendersOf('planet',p));if(e.aE<e.dE*ag)continue;
  const sc=Math.hypot(p.x-f.x,p.y-f.y)+e.dE*2;if(sc<bsc){bsc=sc;best={kind:'planet',id:p.id}}}
 return best}
/* Mehrere gleichzeitige Warnungen (gestapelt) */
const ALS=[];let _alBox=null;
function alBox(){if(_alBox)return _alBox;const b=document.createElement('div');b.id='alertStack';
 b.style.cssText='position:absolute;top:calc(var(--hh,90px) + 48px);left:50%;transform:translateX(-50%);width:min(92vw,28rem);z-index:30;display:flex;flex-direction:column;gap:4px;pointer-events:none';
 const ban=$('alertBanner');(ban&&ban.parentNode||document.body).appendChild(b);return _alBox=b}
function alRemove(a){const i=ALS.indexOf(a);if(i>=0)ALS.splice(i,1);alRender()}
function alRender(){const now=S.T;
 for(let i=ALS.length-1;i>=0;i--){const a=ALS[i],m=a.meta;
  if(m){const att=fleetById.get(m.aid);if(att&&!att.dead){const tg=m.kind==='fleet'?fleetById.get(m.id):planets[m.id];if(tg){const eta=Math.max(0,Math.round(Math.hypot(tg.x-att.x,tg.y-att.y)/fleetSpeed(att)/S.gs));a.text=a.text.replace(/Ankunft in ca\. \d+ s/,'Ankunft in ca. '+eta+' s')}}if(m.kind==='fleet'){const tp=fleetById.get(m.id);if(tp&&!tp.dead){a.x=tp.x;a.y=tp.y}}
   if(!att||att.dead||!att.order||att.order.type!=='atk'||att.order.id!==m.id||now-a.t>900)ALS.splice(i,1)}
  else if(now-a.t>(/abgewehrt/i.test(a.text)?6:25))ALS.splice(i,1)}
 const box=alBox();box.textContent='';
 ALS.slice(-5).reverse().forEach(a=>{const d=document.createElement('div');
  d.className='glass-panel-rose rounded-lg border border-rose-500/60 px-3 py-1.5 flex items-center justify-between shadow-2xl cursor-pointer';d.style.pointerEvents='auto';
  d.onclick=()=>jumpTo(a.x,a.y);
  const l=document.createElement('div');l.className='text-xs text-slate-200';l.textContent=(a.meta?'⚠ ':'ℹ ')+a.text;d.appendChild(l);
  if(a.meta){const b=document.createElement('button');b.className='px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[11px] whitespace-nowrap ml-2';b.textContent='Rückzug';
   b.onclick=e=>{e.stopPropagation();lastAlert=a;doRetreat();alRemove(a)};d.appendChild(b)}
  const x=document.createElement('button');x.className='text-rose-400 text-sm ml-2';x.textContent='✕';x.onclick=e=>{e.stopPropagation();alRemove(a)};d.appendChild(x);box.appendChild(d)});
 if(ALS.length>5){const m=document.createElement('div');m.className='text-[11px] text-rose-300 text-center';m.textContent='+'+(ALS.length-5)+' weitere Warnungen';box.appendChild(m)}}
pushAlert=function(text,x,y,meta){const key=meta?'a'+meta.aid+':'+meta.kind+':'+meta.id:'i'+text;let a=ALS.find(q=>q.key===key),fresh=!a;
 if(!a){a={key};ALS.push(a)}Object.assign(a,{text,x,y,meta,t:S.T});lastAlert=a;
 if(fresh){playSound('alert');addLog('[ALARM] '+text,x,y)}
 $('alertBanner').classList.add('hidden');alRender()};
setInterval(()=>{try{if(ALS.length)alRender()}catch(e){}},1000);
