/* ===== SPEICHERN ===== */
function save(){if(window.NOSAVE)return;S.lastSeen=Date.now();try{const d={v:5,S:Object.assign({},S,{logs:S.logs.slice(0,30)}),act:activeFleet,
 fleets:fleets.map(f=>({id:f.id,owner:f.owner,name:f.name,x:f.x,y:f.y,ships:f.ships,placed:f.placed,ax:f.ax,ay:f.ay,guard:f.guard,gw:f.gw,order:f.owner===0?f.order:null})),
 ais:AIS.map(a=>({tech:a.tech,growT:a.growT,expAt:a.expAt,dead:a.dead,gachaAt:a.gachaAt,bank:a.bank})),
 ov:planets.filter(p=>p.dirty).map(p=>({id:p.id,o:p.owner,g:p.garrison,b:p.b}))};localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return false;const d=JSON.parse(raw);if(d.v!==5)return false;
 Object.assign(S,d.S);S.dev=false;fleets=[];fleetById.clear();
 for(const f of d.fleets){f.h=0;f.cool=0;f.hold=0;f.wait=Math.random()*5;f.dead=false;if(f.owner>0)f.order=null;addFleet(f)}
 d.ais.forEach((a,i)=>Object.assign(AIS[i],a));
 for(const o of d.ov){const p=planets[o.id];p.owner=o.o;p.garrison=o.g;p.b=o.b;p.dirty=true}
 recount();activeFleet=null;if(d.act&&fleetById.has(d.act))setActive(d.act);return true}catch(e){console.warn(e);return false}}
function newGame(){if(!confirm('Neues Spiel starten? Der Spielstand geht verloren.'))return;try{localStorage.removeItem(KEY)}catch(e){}window.NOSAVE=true;location.reload()}
