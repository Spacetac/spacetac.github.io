/* ===== HELFER ===== */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':n.toLocaleString('de-DE')};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const KEEP_IDS=new Set(['xExtra','wreckPanel','audioCtl']);
function morphAttrs(o,n){
 if((o.tagName==='INPUT'||o.tagName==='TEXTAREA')&&document.activeElement===o)return;
 for(const at of Array.from(n.attributes)){const k=at.name,v=at.value;
  if(k==='title'){if(o.getAttribute('data-tip')!==v)o.setAttribute('data-tip',v);o.removeAttribute('title');continue}
  if(o.getAttribute(k)!==v)o.setAttribute(k,v)}
 for(const at of Array.from(o.attributes)){const k=at.name;
  if(k==='data-tip'){if(!n.hasAttribute('title')&&!n.hasAttribute('data-tip'))o.removeAttribute(k);continue}
  if(!n.hasAttribute(k))o.removeAttribute(k)}}
function morphKids(a,b){
 const all=Array.from(a.childNodes),old=all.filter(x=>!(x.nodeType===1&&KEEP_IDS.has(x.id))),keepFirst=all.find(x=>x.nodeType===1&&KEEP_IDS.has(x.id))||null,nw=Array.from(b.childNodes);
 for(let i=0;i<nw.length;i++){const n=nw[i],o=old[i];
  if(!o){a.insertBefore(n,keepFirst);continue}
  if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName){a.replaceChild(n,o);continue}
  if(n.nodeType===3||n.nodeType===8){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;continue}
  morphAttrs(o,n);if(o.tagName!=='TEXTAREA'&&o.tagName!=='INPUT')morphKids(o,n)}
 for(let j=nw.length;j<old.length;j++)a.removeChild(old[j])}
/* setHtml: bestehende Elemente bleiben erhalten (kein Flimmern, Hover/Druck-Zustand bleibt, Animationen starten nicht neu) */
function setHtml(el,html){if(el._h===html)return;
 if(el._h==null||!el.firstChild){el._h=html;el.innerHTML=html;return}
 el._h=html;const t=document.createElement('template');t.innerHTML=html;morphKids(el,t.content)}

/* ===== AUDIO ===== */
let audioOn=true,audioCtx=null;
function playSound(t){if(!audioOn)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),n=audioCtx.currentTime;o.connect(g);g.connect(audioCtx.destination);
 const cfg={click:[600,900,.05,.08],alert:[300,120,.12,.5],boom:[120,40,.15,.4],ok:[500,1000,.07,.15]}[t]||[500,500,.05,.1];
 o.frequency.setValueAtTime(cfg[0],n);o.frequency.exponentialRampToValueAtTime(cfg[1],n+cfg[3]);g.gain.setValueAtTime(cfg[2],n);g.gain.exponentialRampToValueAtTime(.001,n+cfg[3]);o.start(n);o.stop(n+cfg[3])}catch(e){}}
function toggleAudio(){audioOn=!audioOn;$('audioBtn').innerHTML=`<i class="fa-solid ${audioOn?'fa-volume-high':'fa-volume-xmark'}"></i>`}
