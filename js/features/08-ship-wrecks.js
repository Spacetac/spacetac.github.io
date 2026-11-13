/* ===== v3.9.1: Superschiff-Wracks – zerstörte Superschiffe können repariert werden ===== */
(function(){
const WC={R:{steel:6000,crystals:2000,diamonds:100},E:{steel:10000,crystals:4000,diamonds:220},L:{steel:18000,crystals:7000,diamonds:500},M:{steel:25000,crystals:12000,diamonds:1200,credits:50000}};
const gsnap=d=>{const o={};for(const t in d)if(d[t]>0&&SHIP[t]&&SHIP[t].g)o[t]=d[t];return o};
let _wt=-1e9;
function addW(id,n){if(!(n>0))return;S.wrecks=S.wrecks||{};S.wrecks[id]=(S.wrecks[id]||0)+n;
 const t=performance.now();if(t-_wt>1500){_wt=t;toast(SHIP[id].name+' zerstört – Wrack in der Raumwerft reparierbar.')}
 addLog('[WRACK] '+SHIP[id].name+' kann in der Raumwerft repariert werden.')}
const wCost=id=>shipCost({cost:WC[SHIP[id].r]});

const _al=applyLoss;
applyLoss=function(dicts){const mine=new Set();for(const f of fleets)if(f.owner===0)mine.add(f.ships);
 const snaps=[];for(const d of dicts)if(mine.has(d))snaps.push([d,gsnap(d)]);
 const r=_al.apply(this,arguments);
 for(const [d,b] of snaps)for(const t in b){const l=b[t]-(d[t]||0);if(l>0)addW(t,l)}
 return r};
const _hf=hitFleet;
hitFleet=function(f){const b=f&&f.owner===0?gsnap(f.ships):null;const r=_hf.apply(this,arguments);
 if(b)for(const t in b){const l=b[t]-(f.ships[t]||0);if(l>0)addW(t,l)}return r};

window.repairShip=function(id,n){const w=S.wrecks||{};n=Math.min(n,w[id]||0);if(n<=0||!SHIP[id])return;
 const c=wCost(id),tot={};for(const k in c)tot[k]=c[k]*n;
 if(powerUsed()+SHIP[id].pw*n>powerCap()){toast('Nicht genug Energie für die Reparatur.');return}
 if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}
 pay(tot);w[id]-=n;if(w[id]<=0)delete w[id];S.hangar[id]=(S.hangar[id]||0)+n;
 playSound('ok');if(window.SOUND)SOUND.play('rdone',{v:.7});
 toast(n+'× '+SHIP[id].name+' repariert – im Hangar.');addLog('[REPARATUR] '+n+'× '+SHIP[id].name+' repariert.');refreshUI()};

function wHtml(){const w=S.wrecks||{},ids=Object.keys(w).filter(id=>w[id]>0&&SHIP[id]).sort((a,b)=>SHIP[b].power-SHIP[a].power);
 if(!ids.length)return '';
 return '<h3 class="font-orbitron text-amber-300 mt-4 mb-2"><i class="fa-solid fa-screwdriver-wrench"></i> WRACKS – SUPERSCHIFFE REPARIEREN</h3><div class="text-slate-400 mb-1">Zerstörte Superschiffe gehen nicht verloren. Repariert landen sie im Hangar und brauchen wieder Energie.</div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">'
 +ids.map(id=>{const s=SHIP[id],c=wCost(id),col=RAR[s.r].c;
  return card(`<div style="color:${col}"><i class="fa-solid ${s.icon}"></i> <b>${s.name}</b> ×${w[id]}</div><div class="text-slate-400">Stärke ${fmt(s.power)} • Energie ${s.pw}</div><div class="my-1">${costHtml(c)} <span class="text-slate-500">je Schiff</span></div><div class="flex gap-1">${btn('Reparieren ×1',`repairShip('${id}',1)`,'emerald',!canPay(c))}${w[id]>1?btn('Alle ('+w[id]+')',`repairShip('${id}',${w[id]})`,'amber'):''}</div>`)}).join('')+'</div>'}
function addPanel(){if(!curModal||(curModal!=='yard'&&curModal!=='fleets'))return;const b=document.getElementById('modalBody');if(!b)return;
 let d=document.getElementById('wreckPanel');const h=wHtml();if(!h){if(d)d.remove();return}
 if(!d||!d.isConnected){d=document.createElement('div');d.id='wreckPanel';b.appendChild(d)}
 setHtml(d,h)}
for(const k of ['yard','fleets']){const o=RENDER[k];RENDER[k]=function(){o();addPanel()}}
})();
