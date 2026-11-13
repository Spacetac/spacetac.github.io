/* ===== v3.9: Sound-System (synthetisiert, weich, mit Hall, Stereo-Position, Ambient-Pad) ===== */
(function(){
const AU={ctx:null,master:null,revIn:null,nb:null,vol:.7,amb:true,voices:0,last:{},padG:null,engG:null,engF:null,at:null,skipBoom:false,mute:{}};window.AU=AU;
const CUR={v:1,pan:0,t:0,s:1};
try{const v=localStorage.getItem('ge_vol');if(v!==null)AU.vol=Math.max(0,Math.min(1,parseFloat(v)));if(localStorage.getItem('ge_amb')==='0')AU.amb=false}catch(e){}
const MIN={tap:30,hover:70,click:40,ok:60,boom:90,hit:25,alert:800,move:100,deny:150,laser:0};

function init(){
 if(AU.ctx)return AU.ctx;
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
 const c=AU.ctx=new C();
 const comp=c.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=4;comp.attack.value=.01;comp.release.value=.25;
 const m=AU.master=c.createGain();m.gain.value=AU.vol;m.connect(comp);comp.connect(c.destination);
 const len=Math.floor(c.sampleRate*2.4),ir=c.createBuffer(2,len,c.sampleRate);
 for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
 const cv=c.createConvolver();cv.buffer=ir;const rg=c.createGain();rg.gain.value=.4;
 const rin=AU.revIn=c.createGain();rin.connect(cv);cv.connect(rg);rg.connect(m);
 const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;AU.nb=nb;
 try{startAmbient()}catch(e){console.warn('amb',e)}
 try{startEngine()}catch(e){console.warn('eng',e)}
 return c}

function route(o,g){const c=AU.ctx;let n=g;
 if(CUR.pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=CUR.pan;n.connect(p);n=p}
 n.connect(AU.master);
 if(o.send){const s=c.createGain();s.gain.value=o.send;n.connect(s);s.connect(AU.revIn)}}
function env(g,t0,a,r,pk){g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(Math.max(.0002,pk),t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+a+r)}
function V(o){const c=AU.ctx;if(AU.voices>56)return;
 const t0=c.currentTime+.005+(o.t||0)+CUR.t,a=o.a||.006,r=Math.max(.03,o.r||.25),dur=Math.max(.02,o.dur||.2),pk=(o.g||.05)*CUR.v*CUR.s;
 const osc=c.createOscillator();osc.type=o.type||'sine';osc.frequency.setValueAtTime(o.f,t0);
 if(o.f2)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t0+dur);
 const g=c.createGain();env(g,t0,a,r,pk);let n=osc;
 if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;n.connect(f);n=f}
 n.connect(g);route(o,g);AU.voices++;osc.onended=()=>{AU.voices--};osc.start(t0);osc.stop(t0+a+r+.05)}
function Nz(o){const c=AU.ctx;if(AU.voices>56)return;
 const t0=c.currentTime+.005+(o.t||0)+CUR.t,a=o.a||.004,r=Math.max(.03,o.r||.25),dur=Math.max(.02,o.dur||.2),pk=(o.g||.05)*CUR.v*CUR.s;
 const src=c.createBufferSource();src.buffer=AU.nb;const f=c.createBiquadFilter();f.type=o.ft||'lowpass';f.frequency.setValueAtTime(o.f,t0);
 if(o.f2)f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t0+dur);f.Q.value=o.q||.7;
 const g=c.createGain();env(g,t0,a,r,pk);src.connect(f);f.connect(g);route(o,g);AU.voices++;src.onended=()=>{AU.voices--};
 src.start(t0,Math.random()*1.5);src.stop(t0+a+r+.05)}
function bell(f,t,g){V({f,t,a:.004,dur:.02,r:.9,g,send:.45});V({f:f*2.76,t,a:.002,dur:.02,r:.25,g:g*.2,send:.3})}
function pad(fs,t,g,r){for(const f of fs)V({f,t,a:.12,dur:.05,r:r||1.6,g,send:.6,lp:2200})}

const SND={
 tap:()=>V({f:700,f2:520,dur:.05,g:.05,r:.07,lp:3500}),
 hover:()=>V({f:1500,dur:.02,g:.012,r:.03}),
 click:()=>V({f:500,f2:680,dur:.07,g:.06,r:.09,send:.15}),
 select:()=>{V({type:'triangle',f:620,dur:.1,g:.05,r:.15,send:.25,lp:2500});V({f:930,t:.05,dur:.1,g:.03,r:.15,send:.25})},
 open:()=>{V({f:440,f2:587,dur:.14,g:.05,r:.2,send:.3});V({f:659,t:.07,dur:.1,g:.03,r:.2,send:.3})},
 close:()=>V({f:587,f2:392,dur:.14,g:.04,r:.2,send:.25}),
 ok:()=>{bell(784,0,.05);bell(1175,.06,.03)},
 deny:()=>V({type:'triangle',f:240,f2:190,dur:.14,g:.05,r:.18,lp:1200}),
 alert:()=>{for(const [t,f] of [[0,392],[.32,330],[.8,392],[1.12,330]])V({type:'triangle',f,t,dur:.3,g:.07,r:.35,send:.3,lp:1800})},
 move:()=>V({f:440,f2:587,dur:.12,g:.045,r:.2,send:.2}),
 attackOrder:()=>{V({type:'triangle',f:330,f2:392,dur:.12,g:.05,r:.2,send:.2,lp:2000});V({type:'triangle',f:392,f2:494,t:.1,dur:.12,g:.05,r:.25,send:.2,lp:2000})},
 boom:(t=0)=>{Nz({t,ft:'lowpass',f:700,f2:70,dur:.6,g:.2,r:.7,send:.2});V({t,f:90,f2:36,dur:.5,g:.2,r:.5,send:.2})},
 rumble:(t=0)=>{V({t,f:55,f2:30,dur:1.2,g:.2,a:.05,r:1.4,send:.2});Nz({t,ft:'lowpass',f:300,f2:50,dur:1.2,g:.12,r:1.3})},
 hit:()=>Nz({ft:'lowpass',f:1200,f2:200,dur:.15,g:.09,r:.2}),
 laser:()=>V({f:1500*(.8+Math.random()*.5),f2:380,dur:.14,g:.025,r:.16,lp:5000,send:.2}),
 rocket:()=>{Nz({ft:'bandpass',f:250,f2:1600,q:1.2,dur:.9,g:.1,a:.12,r:.8,send:.2});V({f:110,f2:200,dur:.8,g:.06,a:.1,r:.7})},
 intercept:()=>{bell(1760,0,.05);Nz({ft:'highpass',f:2500,dur:.1,g:.04,r:.12})},
 shield:()=>{V({f:260,f2:780,dur:.7,a:.25,g:.07,r:.8,send:.5});V({f:392,f2:1170,dur:.7,a:.25,g:.04,r:.8,send:.5});bell(1568,.5,.03)},
 mine:()=>{V({f:140,f2:70,dur:.15,g:.12,r:.2});Nz({ft:'lowpass',f:600,f2:150,dur:.1,g:.05,r:.12})},
 rstart:()=>{bell(523,0,.04);bell(659,.09,.04);bell(784,.18,.04)},
 rdone:()=>{[523,659,784,1046].forEach((f,i)=>bell(f,i*.11,.06));pad([261,329,392],.2,.03)},
 coin:()=>{bell(1319,0,.05);bell(1760,.07,.05)},
 victory:()=>{[523,659,784,1046].forEach((f,i)=>bell(f,i*.1,.06));pad([261,329,392,523],.25,.035)},
 defeat:()=>{[[220,0],[175,.25],[147,.5]].forEach(([f,t])=>V({type:'triangle',f,t,dur:.4,g:.06,r:.6,lp:900,send:.5}))},
 g_C:()=>bell(523,0,.05),
 g_U:()=>{bell(587,0,.05);bell(784,.08,.04)},
 g_R:()=>{bell(659,0,.06);bell(988,.1,.05)},
 g_E:()=>{[659,784,988,1318].forEach((f,i)=>bell(f,i*.08,.06));pad([329,392,494],.1,.03)},
 g_L:()=>{[523,659,784,1046,1318].forEach((f,i)=>bell(f,i*.09,.07));pad([261,329,392,523],.15,.04);Nz({ft:'highpass',f:4000,dur:.6,g:.03,a:.2,r:.8,send:.5})},
 g_M:()=>{SND.rumble();pad([130,196,261,329,392],0,.05,2.4);[523,784,1046,1568,2093].forEach((f,i)=>bell(f,.3+i*.12,.07));Nz({ft:'bandpass',f:500,f2:3000,q:1,dur:1.4,g:.05,a:.8,r:.9,send:.5})},
 charge:()=>{V({type:'sawtooth',f:90,f2:700,dur:.6,a:.3,g:.05,r:.2,lp:900});Nz({ft:'bandpass',f:300,f2:1800,q:2,dur:.6,g:.06,a:.3,r:.2})},
 beam:()=>{Nz({ft:'bandpass',f:400,f2:1200,q:1.5,dur:.75,g:.14,a:.05,r:.5,send:.2});V({f:220,f2:330,dur:.75,g:.1,a:.05,r:.6,send:.2})}
};

function play(n,x){
 if(typeof audioOn==='undefined'||!audioOn)return;
 const c=init();if(!c)return;if(c.state==='suspended')c.resume();
 const now=performance.now();
 if(n==='boom'&&AU.skipBoom)return;
 if(n==='alert'&&(AU.mute.alert||0)>now)return;
 if((n==='ok'||n==='boom')&&now-(AU.last.vd||0)<600)return;
 if(n==='click'&&now-(AU.last.tap||0)<90)return;
 const mi=MIN[n]===undefined?0:MIN[n];if(mi&&AU.last[n]&&now-AU.last[n]<mi)return;AU.last[n]=now;
 x=x||{};CUR.v=x.v===undefined?1:x.v;CUR.pan=0;CUR.t=x.t||0;CUR.s=x.s||1;
 let px=x.x,py=x.y;if(px===undefined&&AU.at){px=AU.at.x;py=AU.at.y}
 if(px!==undefined&&typeof w2s==='function'){const [sx,sy]=w2s(px,py);CUR.pan=Math.max(-1,Math.min(1,sx/W*2-1))*.7;const off=Math.max(0,Math.max(Math.abs(sx/W-.5)*2,Math.abs(sy/H-.5)*2)-1);CUR.v*=1/(1+off*1.5)}
 if(n==='victory'||n==='defeat')AU.last.vd=now;
 try{(SND[n]||SND.click)()}catch(e){console.warn('snd',n,e)}
}
window.playSound=function(t,x){play(t,x)};
window.SOUND={play,AU};

/* ---- Ambient-Pad: langsame, entspannende Akkordfolge ---- */
const CH=[[73.42,110,174.61,220,261.63,329.63],[58.27,87.31,146.83,220,261.63,349.23],[49,73.42,116.54,174.61,220,293.66],[55,82.41,196,246.94,261.63,329.63]];
let _chi=0,_oscs=[];
function startAmbient(){const c=AU.ctx;
 const out=AU.padG=c.createGain();out.gain.value=0;
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.Q.value=.4;
 const lfo=c.createOscillator(),ld=c.createGain();lfo.frequency.value=.06;ld.gain.value=260;lfo.connect(ld);ld.connect(lp.frequency);lfo.start();
 lp.connect(out);out.connect(AU.master);const s=c.createGain();s.gain.value=.5;out.connect(s);s.connect(AU.revIn);
 CH[0].forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=(i%3-1)*4;const g=c.createGain();g.gain.value=.16;o.connect(g);g.connect(lp);o.start();_oscs.push(o)});
 setInterval(()=>{if(!AU.ctx||document.hidden)return;_chi=(_chi+1)%CH.length;const t=AU.ctx.currentTime;_oscs.forEach((o,i)=>o.frequency.setTargetAtTime(CH[_chi][i],t,4))},22000)}
function startEngine(){const c=AU.ctx;
 const src=c.createBufferSource();src.buffer=AU.nb;src.loop=true;
 const f=AU.engF=c.createBiquadFilter();f.type='bandpass';f.frequency.value=140;f.Q.value=.8;
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=400;
 const g=AU.engG=c.createGain();g.gain.value=0;src.connect(f);f.connect(lp);lp.connect(g);g.connect(AU.master);src.start()}
setInterval(()=>{try{if(!AU.ctx)return;const t=AU.ctx.currentTime,on=(typeof audioOn!=='undefined'&&audioOn)&&!document.hidden;
 if(AU.padG)AU.padG.gain.setTargetAtTime(on&&AU.amb?.04:0,t,1.5);
 let n=0;if(typeof fleets!=='undefined')for(const f of fleets)if(f.owner===0&&f.placed&&!f.dead&&f.order)n++;
 if(AU.engG)AU.engG.gain.setTargetAtTime(on?Math.min(.03,n*.01):0,t,.6);if(AU.engF)AU.engF.frequency.setTargetAtTime(110+Math.min(n,6)*25,t,.8);
 if(document.hidden&&AU.ctx.state==='running')AU.ctx.suspend();else if(!document.hidden&&AU.ctx.state==='suspended'&&on)AU.ctx.resume()}catch(e){}},300);

/* ---- Buttons: Tippen & Hover ---- */
const SEL='button,.nb,.sb,.resItem,.pullcard,[onclick]';
document.addEventListener('pointerdown',e=>{if(typeof audioOn==='undefined'||!audioOn)return;const c=init();if(c&&c.state==='suspended')c.resume();
 const t=e.target.closest&&e.target.closest(SEL);if(t&&!t.classList.contains('dis')&&!t.closest('#galaxyCanvas')&&t.id!=='galaxyCanvas'){play('tap')}},true);
let _hv=null;document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const t=e.target.closest&&e.target.closest(SEL);if(t===_hv)return;_hv=t;if(t&&!t.classList.contains('dis'))play('hover')});

/* ---- Spiel-Ereignisse einhängen ---- */
const wrap=(name,fn)=>{try{const o=window[name];if(typeof o!=='function')return;window[name]=fn(o)}catch(e){console.warn('wrap',name,e)}};
wrap('openModal',o=>function(n){const was=curModal;const r=o.apply(this,arguments);if(curModal===n&&was!==n)play('open');return r});
wrap('closeModal',o=>function(){const was=curModal;const r=o.apply(this,arguments);if(was)play('close');return r});
wrap('closeModal2',o=>function(){const was=!document.getElementById('modal2Root').classList.contains('hidden');const r=o.apply(this,arguments);if(was)play('close',{v:.7});return r});
wrap('toast',o=>function(m){const r=o.apply(this,arguments);try{m=String(m||'');
 if(/^(Nicht genug|Kein|Keine|Alle .*(belegt|Plätze)|Falsches|Ungültig|Tageslimit|Erst |Es läuft bereits|Wähle zuerst|Flotten können nur|Schilde nur|Flak nur|Diese Flotte hat keine|Leere Flotte|Feindliche Flotte zu nah|Außer Reichweite|Ziel außer)|Limit erreicht|nicht (abgelegt|platziert|montierbar|baubar)|Bauschlange voll/.test(m))play('deny');
 else if(/fliegt zum Ziel|transportiert|ziehen sich zurück/.test(m))play('move');
 else if(/greift .* an!|startet den Angriff/.test(m))play('attackOrder')}catch(e){}return r});
wrap('showReport',o=>function(r){try{play(r&&r.win?'victory':'defeat')}catch(e){}return o.apply(this,arguments)});
wrap('spawnBattle',o=>function(f,tx,ty,defOwner,r,myth){const d=o.apply(this,arguments);
 try{if(d){const mine=f.owner===0||defOwner===0,v=mine?1:.35;
  if(myth){play('charge',{x:f.x,y:f.y,v});play('beam',{x:tx,y:ty,v,t:.6});play('rumble',{x:tx,y:ty,v,t:1.3})}
  else{const n=Math.max(6,Math.min(16,Math.round(6+Math.log10(1+r.aE+r.dE)*2)));
   for(let i=0;i<n;i++){const t=Math.random()*2.3;play('laser',{x:i%2?tx:f.x,y:i%2?ty:f.y,v,t});play('hit',{x:tx,y:ty,v:v*.8,t:t+.26})}
   play('boom',{x:tx,y:ty,v,t:2.6})}}}catch(e){console.warn('battle',e)}return d});
wrap('fireRk',o=>function(f){AU.skipBoom=true;let r;try{r=o.apply(this,arguments)}finally{AU.skipBoom=false}if(r)play('rocket',{x:f.x,y:f.y,v:f.owner===0?1:.6});return r});
wrap('rkImpact',o=>function(r){AU.at={x:r.x,y:r.y};try{return o.apply(this,arguments)}finally{AU.at=null}});
wrap('tryIntercept',o=>function(r){const ok=o.apply(this,arguments);if(ok)play('intercept',{x:r.x,y:r.y,v:.8});return ok});
wrap('deployShield',o=>function(f){const n=(S.sh||[]).length;const r=o.apply(this,arguments);if((S.sh||[]).length>n)play('shield',{x:f.x,y:f.y});return r});
wrap('deployMine',o=>function(f){const n=(S.mines||[]).length;const r=o.apply(this,arguments);if((S.mines||[]).length>n)play('mine',{x:f.x,y:f.y});return r});
wrap('doResearch',o=>function(){const had=!!S.rq;const r=o.apply(this,arguments);if(!had&&S.rq)play('rstart');return r});
wrap('finishResearch',o=>function(){AU.last.vd=performance.now();const r=o.apply(this,arguments);play('rdone');return r});
wrap('claimDaily',o=>function(){const g=S.gems;const r=o.apply(this,arguments);if(S.gems>g){AU.last.vd=performance.now();play('coin');setTimeout(()=>play('rdone',{v:.6}),180)}return r});
wrap('trade',o=>function(){const c=S.res.credits;const r=o.apply(this,arguments);if(S.res.credits!==c)play('coin',{v:.6});return r});
wrap('gachaPull',o=>function(){AU.mute.alert=performance.now()+400;AU.last.vd=performance.now();return o.apply(this,arguments)});
wrap('showPulls',o=>function(out){try{out.forEach((r,i)=>play('g_'+r.t,{t:i*.11,v:'CU'.includes(r.t)?.6:1}))}catch(e){}return o.apply(this,arguments)});
wrap('toggleAudio',o=>function(){const r=o.apply(this,arguments);if(audioOn)play('ok');return r});

/* ---- Lautstärke & Ambient im Hilfe-Menü ---- */
const LV=[0,.25,.5,.7,1];
window.cycleVol=function(){let i=LV.findIndex(v=>Math.abs(v-AU.vol)<.01);i=(i+1)%LV.length;AU.vol=LV[i];try{localStorage.setItem('ge_vol',AU.vol)}catch(e){}if(AU.master)AU.master.gain.value=AU.vol;play('ok');renderModal()};
window.toggleAmb=function(){AU.amb=!AU.amb;try{localStorage.setItem('ge_amb',AU.amb?'1':'0')}catch(e){}play('click');renderModal()};
if(false&&typeof RENDER!=='undefined'&&RENDER.help){const _h=RENDER.help;RENDER.help=function(){_h();const b=document.getElementById('modalBody');if(!b)return;let d=document.getElementById('audioCtl');if(!d||!d.isConnected){d=document.createElement('div');d.id='audioCtl';d.className='flex gap-2 mt-3 flex-wrap';b.appendChild(d)}
 setHtml(d,btn('<i class="fa-solid fa-volume-high"></i> Lautstärke: '+Math.round(AU.vol*100)+'%','cycleVol()','cyan')+btn('<i class="fa-solid fa-music"></i> Ambient-Musik: '+(AU.amb?'AN':'AUS'),'toggleAmb()','cyan'))}}
})();
