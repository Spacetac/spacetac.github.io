/* ===== RENDER ===== */
const STARS=Array.from({length:140},(_,i)=>{const r=mulberry32(i+5);return[r(),r(),.02+r()*.06,r()]});
function tri(x,y,h,s){ctx.beginPath();ctx.moveTo(x+Math.cos(h)*s,y+Math.sin(h)*s);ctx.lineTo(x+Math.cos(h+2.5)*s*.8,y+Math.sin(h+2.5)*s*.8);ctx.lineTo(x+Math.cos(h-2.5)*s*.8,y+Math.sin(h-2.5)*s*.8);ctx.closePath()}
function render(){
 const z=cam.zoom;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#02040a';ctx.fillRect(0,0,W,H);{const so=shakeOff();if(so[0]||so[1])ctx.setTransform(dpr,0,0,dpr,so[0]*dpr,so[1]*dpr)}
 ctx.fillStyle='rgba(255,255,255,.55)';for(const s of STARS){const x=((s[0]*W-cam.x*z*s[2])%W+W)%W,y=((s[1]*H-cam.y*z*s[2])%H+H)%H;ctx.fillRect(x,y,s[3]>.8?2:1,s[3]>.8?2:1)}
 {const _a=activeFleet&&fleetById.get(activeFleet);if(BORD.on||placing||(_a&&!_a.placed))drawTerr()}try{window.xDrawBelow&&window.xDrawBelow()}catch(e){}
 const [bx,by]=w2s(-HALF,-HALF);ctx.strokeStyle='rgba(244,63,94,.45)';ctx.lineWidth=2;ctx.strokeRect(bx,by,WORLD*z,WORLD*z);
 const [l,t]=s2w(0,0),[r,b]=s2w(W,H);
 const x0=Math.max(0,cellX(l)-1),x1=Math.min(N-1,cellX(r)+1),y0=Math.max(0,cellY(t)-1),y1=Math.min(N-1,cellY(b)+1);
 const armed=activeFleet&&fleetById.get(activeFleet)&&!fleetById.get(activeFleet).placed;
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const p=planets[cy*N+cx],[sx,sy]=w2s(p.x,p.y);if(sx<-40||sy<-40||sx>W+40||sy>H+40)continue;
  const rr=Math.max(p.owner>=0?3.6:2.2,p.r*z),bio=BIOMES[p.biome];
  if(p.owner!==-1){ctx.fillStyle=p.owner===0?'#3b82f6':ownerColor(p.owner);ctx.globalAlpha=p.owner>=0?.4:.25;ctx.beginPath();ctx.arc(sx,sy,rr+(p.owner>=0?6:4)+(p.owner===0?2:0),0,6.283);ctx.fill();ctx.globalAlpha=1;if(p.owner>=0){ctx.strokeStyle=(p.owner>0?'rgba(239,68,68,':'rgba(59,130,246,')+(.5+.4*Math.sin(performance.now()/350+p.id)).toFixed(2)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,rr+11,0,6.283);ctx.stroke()}}
  ctx.fillStyle=bio.color;ctx.beginPath();ctx.arc(sx,sy,rr,0,6.283);ctx.fill();
  if(p.owner!==-1&&rr>3){ctx.strokeStyle=ownerColor(p.owner);ctx.lineWidth=p.owner===0?2.5:1.5;ctx.stroke()}
  if(z>.55){ctx.fillStyle=p.owner===0?'#93c5fd':'#94a3b8';ctx.font='10px Rajdhani';ctx.textAlign='center';ctx.fillText(p.name,sx,sy+rr+11);
   if(p.owner>0&&z>.5){ctx.save();ctx.globalAlpha=.5;ctx.fillStyle='#f87171';ctx.font='9px Rajdhani';ctx.fillText(AIS[p.owner-1].name,sx,sy+rr+21);ctx.restore()}
   else if(p.owner===0&&z>.5){ctx.fillStyle='#60a5fa';ctx.fillText(p.id===S.capital?'★ Hauptwelt':'★ Kolonie',sx,sy+rr+22)}}}
 ensureB();
  for(const m of S.mines){const [mx,my]=w2s(m.x,m.y);if(mx<-20||my<-20||mx>W+20||my>H+20)continue;const pr=(m.t0&&S.T<m.t0)?-.5:.5+.5*Math.sin(performance.now()/300+m.id);ctx.fillStyle='rgba(245,158,11,'+(.45+.4*pr).toFixed(2)+')';ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mx,my,4,0,6.283);ctx.fill();ctx.stroke();
  for(let q=0;q<4;q++){const an=q*1.5708+.78;ctx.beginPath();ctx.moveTo(mx+Math.cos(an)*4,my+Math.sin(an)*4);ctx.lineTo(mx+Math.cos(an)*8,my+Math.sin(an)*8);ctx.stroke()}
  if(z>.5){ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(251,191,36,.25)';ctx.beginPath();ctx.arc(mx,my,MINE_R*(1+tb('mrad'))*z,0,6.283);ctx.stroke();ctx.setLineDash([])}}
 for(const a of S.aa){const p=planets[a.pid];if(!p)continue;const q=aaPos(a),[px,py]=w2s(p.x,p.y),[qx,qy]=w2s(q.x,q.y);if(qx<-30||qy<-30||qx>W+30||qy>H+30)continue;
  ctx.strokeStyle='rgba(96,165,250,.45)';ctx.setLineDash([2,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(qx,qy);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#1e3a8a';ctx.strokeStyle='#60a5fa';ctx.lineWidth=1.5;ctx.fillRect(qx-4,qy-4,8,8);ctx.strokeRect(qx-4,qy-4,8,8);ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(qx+Math.cos(a.ang)*9,qy+Math.sin(a.ang)*9);ctx.stroke();
  if(z>.5){ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(96,165,250,.2)';ctx.beginPath();ctx.arc(qx,qy,AA_R*(1+tb('frng'))*z,0,6.283);ctx.stroke();ctx.setLineDash([])}}
 if(S.xm)for(const m of S.xm){const[mx,my]=w2s(m.x,m.y);if(mx<-20||my<-20||mx>W+20||my>H+20)continue;const pr=.5+.5*Math.sin(performance.now()/300+m.id);ctx.fillStyle='rgba(217,70,239,'+(.4+.4*pr).toFixed(2)+')';ctx.strokeStyle='#e879f9';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mx,my,4,0,6.283);ctx.fill();ctx.stroke();
  for(let q=0;q<4;q++){const an=q*1.5708+.78;ctx.beginPath();ctx.moveTo(mx+Math.cos(an)*4,my+Math.sin(an)*4);ctx.lineTo(mx+Math.cos(an)*8,my+Math.sin(an)*8);ctx.stroke()}
  if(z>.5){ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(232,121,249,.30)';ctx.beginPath();ctx.arc(mx,my,MINE_R*z,0,6.283);ctx.stroke();ctx.setLineDash([])}}
 if(S.xa)for(const a of S.xa){const p=planets[a.pid];if(!p)continue;const q=aaPos(a),[px,py]=w2s(p.x,p.y),[qx,qy]=w2s(q.x,q.y);if(qx<-30||qy<-30||qx>W+30||qy>H+30)continue;
  ctx.strokeStyle='rgba(232,121,249,.45)';ctx.setLineDash([2,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(qx,qy);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#581c87';ctx.strokeStyle='#e879f9';ctx.lineWidth=1.5;ctx.fillRect(qx-4,qy-4,8,8);ctx.strokeRect(qx-4,qy-4,8,8);ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(qx+Math.cos(a.ang)*9,qy+Math.sin(a.ang)*9);ctx.stroke();
  if(z>.5){ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(232,121,249,.2)';ctx.beginPath();ctx.arc(qx,qy,AA_R*z,0,6.283);ctx.stroke();ctx.setLineDash([])}}
 // Befehlslinien
 ctx.lineWidth=1;ctx.setLineDash([5,5]);
 for(const f of fleets){if(!f.order||(f.owner===0&&!f.placed)||fleetVis(f)<.3)continue;const o=f.order;let tp=(o.type==='move'||o.type==='mine')?{x:o.x,y:o.y,owner:-1}:targetPos(o);if(!tp)continue;
  if(f.owner>0&&tp.owner!==0)continue;const [a,c]=w2s(f.x,f.y),[d,e]=w2s(tp.x,tp.y);
  if((a<-50&&d<-50)||(a>W+50&&d>W+50)||(c<-50&&e<-50)||(c>H+50&&e>H+50))continue;
  ctx.strokeStyle=f.owner===0?(o.type==='atk'?'rgba(59,130,246,.95)':o.type==='mine'?'rgba(251,191,36,.85)':'rgba(34,211,238,.7)'):'rgba(239,68,68,.9)';ctx.beginPath();ctx.moveTo(a,c);ctx.lineTo(d,e);ctx.stroke()}
 ctx.setLineDash([]);
 // Flotten
 for(const f of fleets){if(f.dead||(f.owner===0&&!f.placed)||f.hideUntil>performance.now())continue;const fv=fleetVis(f);if(fv<.04)continue;const [sx,sy]=w2s(f.x,f.y);if(sx<-20||sy<-20||sx>W+20||sy>H+20)continue;
  const s=clamp(5+z*5,5,12);const cloak=f.owner===0&&isStealthFleet(f);ctx.globalAlpha=cloak?.5:fv;if(cloak){ctx.strokeStyle='rgba(103,232,249,.7)';ctx.setLineDash([2,3]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy,s+8,0,6.283);ctx.stroke();ctx.setLineDash([])}if(f.owner>0){ctx.fillStyle='rgba(239,68,68,.28)';ctx.beginPath();ctx.arc(sx,sy,s+5,0,6.283);ctx.fill()}{const rc=fleetRarCol(f);if(rc)rarRing(sx,sy,s,rc)}tri(sx,sy,f.h,s);ctx.fillStyle=ownerColor(f.owner);ctx.fill();ctx.strokeStyle=f.owner===0?'#fff':'rgba(0,0,0,.6)';ctx.lineWidth=f.owner===0?1.5:1;ctx.stroke();
  if(z>.5||f.owner===0&&z>.3){ctx.fillStyle=f.owner===0?'#a5f3fc':'#ef4444';ctx.font=(f.owner===0?'10px':'11px')+' Rajdhani';ctx.textAlign='center';ctx.fillText(f.owner===0?f.name:fmt(fleetPower(f)),sx,sy-s-4)}
  if(f.id===activeFleet){ctx.strokeStyle='#facc15';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,s+5,0,6.283);ctx.stroke()}ctx.globalAlpha=1}
 if(GH.length){const nw=performance.now();for(let i=GH.length-1;i>=0;i--){const g=GH[i];if(nw>=g.until){GH.splice(i,1);continue}const [gx,gy]=w2s(g.x,g.y),s=clamp(5+z*5,5,12);
  if(g.owner>0){ctx.fillStyle='rgba(239,68,68,.28)';ctx.beginPath();ctx.arc(gx,gy,s+5,0,6.283);ctx.fill()}
  if(g.rc)rarRing(gx,gy,s,g.rc)
  tri(gx,gy,g.h,s);ctx.fillStyle=ownerColor(g.owner);ctx.fill();ctx.strokeStyle=g.owner===0?'#fff':'rgba(0,0,0,.6)';ctx.lineWidth=g.owner===0?1.5:1;ctx.stroke()}}
 if(FX.length){const nw=performance.now();ctx.lineCap='round';
  for(let i=FX.length-1;i>=0;i--){const e=FX[i];if(nw<e.t0)continue;const k=(nw-e.t0)/e.dur;if(k>=1){FX.splice(i,1);continue}
   if(e.k==='shot'){const tl=Math.max(0,k-.3),[ax,ay]=w2s(e.x0+(e.x1-e.x0)*tl,e.y0+(e.y1-e.y0)*tl),[hx,hy]=w2s(e.x0+(e.x1-e.x0)*k,e.y0+(e.y1-e.y0)*k);ctx.strokeStyle=e.c;ctx.lineWidth=2.2;ctx.shadowColor=e.c;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(hx,hy);ctx.stroke();ctx.shadowBlur=0}
   else if(e.k==='beam'){const hh=Math.min(1,k*7),[ax,ay]=w2s(e.x0,e.y0),[hx,hy]=w2s(e.x0+(e.x1-e.x0)*hh,e.y0+(e.y1-e.y0)*hh);ctx.globalAlpha=Math.min(1,(1-k)*1.6+.25);ctx.lineCap='butt';ctx.strokeStyle=e.c;ctx.shadowColor=e.c;ctx.shadowBlur=30;ctx.lineWidth=15*(1-k*.5);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(hx,hy);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ecfccb';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(hx,hy);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='round'}
   else if(e.k==='charge'||e.k==='debris'){fxExtra(e,k)}
   else if(e.k==='wave'){const [x,y]=w2s(e.x1,e.y1),R=k*Math.max(180,e.s*z);ctx.globalAlpha=(1-k)*.9;ctx.strokeStyle=e.c;ctx.shadowColor=e.c;ctx.shadowBlur=14;ctx.lineWidth=2+10*(1-k);ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1}
   else{const [x,y]=w2s(e.x1,e.y1);ctx.globalAlpha=1-k;ctx.fillStyle=e.c;ctx.beginPath();ctx.arc(x,y,3+k*e.s,0,6.283);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,2+k*e.s*1.3,0,6.283);ctx.stroke();ctx.globalAlpha=1}}
  ctx.lineCap='butt'}
 if(sel){let o=sel.type==='planet'?planets[sel.id]:fleetById.get(sel.id);if(o){const [sx,sy]=w2s(o.x,o.y);ctx.strokeStyle='#facc15';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(sx,sy,(o.r?Math.max(5,o.r*z):10)+8,0,6.283);ctx.stroke();ctx.setLineDash([])}}
 if(armed&&drag===null){tri(mouse.x,mouse.y,-1.57,11);ctx.fillStyle='rgba(34,211,238,.5)';ctx.fill()}
 const [cx,cy]=[Math.round(cam.x/100),Math.round(cam.y/100)];$('sectorText').textContent=`Sektor [${cx}, ${cy}] • Zoom ${cam.zoom.toFixed(cam.zoom<.1?3:2)}`;
}
let miniT=0;
function renderMini(){const m=mctx,s=150/WORLD;m.fillStyle='#02040a';m.fillRect(0,0,150,150);
 for(const p of planets){if(p.owner===-1)continue;m.fillStyle=ownerColor(p.owner);m.fillRect((p.x+HALF)*s,(p.y+HALF)*s,p.owner===0?3:1.3,p.owner===0?3:1.3)}
 m.fillStyle='#22d3ee';for(const f of fleets)if(f.owner===0&&f.placed)m.fillRect((f.x+HALF)*s-1,(f.y+HALF)*s-1,3,3);
 m.fillStyle='#ef4444';for(const f of fleets)if(f.owner>0&&f.order&&f.order.type==='atk'&&fleetVis(f)>.5){const t=targetPos(f.order);if(t&&t.owner===0)m.fillRect((f.x+HALF)*s-1,(f.y+HALF)*s-1,3,3)}
 m.strokeStyle='#facc15';m.lineWidth=1;const [l,t]=s2w(0,0);m.strokeRect((l+HALF)*s,(t+HALF)*s,W/cam.zoom*s,H/cam.zoom*s)}
