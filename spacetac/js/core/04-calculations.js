/* ===== BERECHNUNGEN ===== */
const myPlanets=()=>[...PS].map(i=>planets[i]);
const bsum=k=>{let s=0;for(const i of PS)s+=planets[i].b[k];return s};
function mods(o){if(o===0)return{atk:tb('atk'),arm:tb('arm'),bomb:tb('bomb'),pdef:tb('pdef'),rep:Math.min(.5,tb('rep')),tdis:Math.min(.6,tb('tdis')),spd:tb('spd')};
 if(o>0){const t=AIS[o-1].tech,a=t*.03;return{atk:a,arm:a,bomb:0,pdef:a*.7,rep:.1,tdis:0,spd:t*.02}}
 return{atk:0,arm:0,bomb:0,pdef:0,rep:0,tdis:0,spd:0}}
const fleetPower=f=>basePower(f.ships);
/* Heimvorteil: im eigenen Gebiet (Zelle eines eigenen Planeten) +12% Tempo; neutrale und fremde Gebiete normal */
const ZONE_SPD=1.12;
function zoneOwnerAt(x,y){const cx=cellX(x),cy=cellY(y);let q=null,bd=1e18;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;const p=planets[yy*N+xx],d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;q=p}}
 return q?q.owner:-1}
function zoneSpd(f){const t=performance.now();if(!(f._zt>t-250))f._zt=t,f._zm=zoneOwnerAt(f.x,f.y)===f.owner?ZONE_SPD:1;return f._zm}
function fleetSpeed(f){let m=1e9;for(const t in f.ships)if(f.ships[t]>0)m=Math.min(m,SHIP[t].spd);if(m>=1e9)m=60;return m*SPDX*zoneSpd(f)*(1+mods(f.owner).spd)*(f.retreat?1.25+tb('retr'):1)}
const powerCap=()=>S.dev?1e9:60+bsum('power')*35*(1+tb('pwr'));
function powerUsed(){let u=0;for(const t in S.hangar)u+=SHIP[t].pw*S.hangar[t];for(const f of fleets)if(f.owner===0)for(const t in f.ships)u+=SHIP[t].pw*f.ships[t];return u}
const unlocked=s=>!s.req||(S.lv[s.req]||0)>0;
function shipCost(s){const m=1-Math.min(.5,tb('cost')+.02*bsum('yard')),c={};for(const k in s.cost)c[k]=Math.max(1,Math.round(s.cost[k]*m));return c}
const mineRate=(l,p)=>1.6*l*(p?p.rich:1)*(1+tb('eco'));
function bldCost(k,l){const c={},m=Math.pow(1.55,l);for(const r in BLD[k].cost)c[r]=Math.round(BLD[k].cost[r]*m);return c}
function techCost(t){const l=S.lv[t.id]||0,m=Math.pow(1.75,l)*(1-Math.min(.55,.03*bsum('lab')+tb('tcost'))),c={};for(const k in t.cost)c[k]=Math.round(t.cost[k]*m);return c}
const canPay=c=>{for(const k in c)if((S.res[k]||0)<c[k])return false;return true};
const pay=c=>{for(const k in c)S.res[k]-=c[k]};
const costHtml=c=>Object.entries(c).map(([k,v])=>`<span class="${(S.res[k]||0)>=v?'text-slate-300':'text-rose-400'}">${fmt(v)} ${RN[k]}</span>`).join(' · ');
function rarRing(x,y,s,c){const m=c===RAR.M.c;ctx.strokeStyle=c;if(m){ctx.lineWidth=2.5;ctx.shadowColor=c;ctx.shadowBlur=12}else{ctx.lineWidth=1.3;ctx.globalAlpha=.85}ctx.beginPath();ctx.arc(x,y,m?s+8:s+3,0,6.283);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1}
const RORD='RELM',rarCol=id=>{const s=SHIP[id];return s&&s.g?RAR[s.r].c:null};
function fleetRarCol(f){let b=-1;for(const t in f.ships)if(f.ships[t]>0&&SHIP[t].g){const i=RORD.indexOf(SHIP[t].r);if(i>b)b=i}return b<0?null:RAR[RORD[b]].c}
const shipsHtml=d=>{const e=Object.entries(d).filter(([t,n])=>n>0);return e.length?e.map(([t,n])=>{const c=rarCol(t);return `<span class="inline-block bg-slate-800/80 border border-slate-700 rounded px-1.5 py-0.5 mr-1 mb-1"${c?` title="${RAR[SHIP[t].r].n}" style="border-color:${c};color:${c};box-shadow:0 0 6px ${c}77"`:''}><i class="fa-solid ${SHIP[t].icon} ${c?'':'text-cyan-400'}"></i> ${SHIP[t].name} ×${fmt(n)}</span>`}).join(''):'<span class="text-slate-500">keine Schiffe</span>'};
const hangarCount=()=>countShips(S.hangar);
const WARN=()=>1800+tb('warn');
/* Platzierung/Bauen NUR innerhalb der angezeigten eigenen Gebietsgrenzen (Voronoi-Zelle der eigenen Planeten) */
function inOwnTerr(x,y){const cx=cellX(x),cy=cellY(y);let q=-1,bd=1e18;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;const p=planets[yy*N+xx],d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd){bd=d;q=p.id}}
 if(q<0||planets[q].owner!==0)return false;
 const P=vorPoly(q);let ins=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)ins=!ins}return ins}
function nearOwn(x,y){return inOwnTerr(x,y)}
