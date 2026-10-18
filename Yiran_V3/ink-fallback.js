const MIN_BRUSH=1, MAX_BRUSH=25;
/* Canvas 2D graceful fallback for devices where WebGL is disabled.
   The WebGL fluid renderer in app.js remains the preferred engine. */
(()=>{
 'use strict';
 if(window.__yiranWebGLReady)return;
 const canvas=document.getElementById('drawing');
 const paper=document.getElementById('paperTexture');
 const note=document.querySelector('.empty-note');
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const pctx=paper.getContext('2d');
 if(!ctx)return;
 const $=id=>document.getElementById(id);
 note.innerHTML='<div class="vertical-title"><p>一纸闲情</p><p>落笔怡然</p></div><small>点纸成墨，挥笔成浪</small>';
 const colors={青:[42,85,88],赤:[151,42,36],黄:[178,116,40],白:[234,226,200],黑:[37,36,32]};
 const tones={焦:{mass:1.00,wet:.015,rough:.90,spray:1.30},浓:{mass:.80,wet:.16,rough:.76,spray:1.18},重:{mass:.52,wet:.24,rough:.60,spray:1.00},淡:{mass:.18,wet:.64,rough:.42,spray:.84},清:{mass:.055,wet:1.0,rough:.28,spray:.68}};
 let ink='黑',tone='重',size=18,opacityLevel=.72,active=null,last=null,hasInk=false,strokeLength=0,direction={x:1,y:0};
 const SPLASH_POWER=.72;
 const images=[],flies=[];let paintRect=null;
 const rand=(a,b)=>a+Math.random()*(b-a);
 function updateStatus(){
   const rgb=colors[ink];
   $('inkStatus').innerHTML=`<i style="background:rgb(${rgb.join(',')})"></i>${ink} · ${tone}墨 · ${size}`;
   $('sizeValue').value=size;if($('opacityValue')) $('opacityValue').textContent=Math.round(opacityLevel*100)+'%';
   const s=$('brushSample');s.style.width=size+'px';s.style.height=size+'px';s.style.background=`rgb(${rgb.join(',')})`;
   $('undo').disabled=images.length===0;$('clear').disabled=!hasInk;
   document.querySelector('.paper').classList.toggle('has-ink',hasInk);
 }
 function resize(){
   const r=canvas.getBoundingClientRect(); if(r.width<1||r.height<1)return;
   const old=canvas.width>0?canvas.toDataURL():null;
   canvas.width=Math.round(r.width);canvas.height=Math.round(r.height);
   paper.width=canvas.width;paper.height=canvas.height;
   pctx.fillStyle='#eee8d5';pctx.fillRect(0,0,paper.width,paper.height);
   let seed=42;const seeded=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   for(let i=0;i<paper.width*paper.height/85;i++){pctx.fillStyle=`rgba(100,80,40,${.013+seeded()*.03})`;pctx.fillRect(seeded()*paper.width,seeded()*paper.height,.5+seeded()*2,1+seeded()*3)}
   if(old){const image=new Image;image.onload=()=>ctx.drawImage(image,0,0,canvas.width,canvas.height);image.src=old}
 }
 new ResizeObserver(resize).observe(canvas);resize();
 function bounds(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function circlePath(x,y,r,rough){
   let n=23,coords=[];
   for(let i=0;i<n;i++){
     const a=i*2*Math.PI/n,rr=r*rand(1-.25*rough,1+.33*rough);
     coords.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);
   }
   ctx.beginPath();
   let prev=coords[n-1],curr=coords[0];ctx.moveTo((prev[0]+curr[0])/2,(prev[1]+curr[1])/2);
   for(let i=0;i<n;i++){
     curr=coords[i];const next=coords[(i+1)%n];ctx.quadraticCurveTo(curr[0],curr[1],(curr[0]+next[0])/2,(curr[1]+next[1])/2)
   }
   ctx.closePath();
 }
 function blot(x,y,r,mass=1,extraRough=1){
   if(x< -40||y< -40||x>canvas.width+40||y>canvas.height+40)return;
   const t=tones[tone],rgb=colors[ink],opacity=Math.min(.95,t.mass*mass*(.01+opacityLevel*1.42)),wet=t.wet;
   ctx.save();
   if(wet>.1){
     ctx.filter=`blur(${(1.5+wet*3.5).toFixed(1)}px)`;
     ctx.fillStyle=`rgba(${rgb.join(',')},${opacity*wet*.32})`;
     circlePath(x,y,r*(1.35+wet*.2),.74);ctx.fill();ctx.filter='none';
   }
   const g=ctx.createRadialGradient(x-r*.19,y-r*.22,r*.04,x,y,r*1.25);
   g.addColorStop(0,`rgba(${rgb.join(',')},${opacity})`);
   g.addColorStop(.64,`rgba(${rgb.join(',')},${opacity*.68})`);
   g.addColorStop(1,`rgba(${rgb.join(',')},${opacity*.05})`);
   ctx.fillStyle=g;circlePath(x,y,r,Math.min(1,extraRough*t.rough));ctx.fill();
   if(tone==='焦'){
     // Faint dry bristle streaks retain the dark body instead of erasing past strokes.
     ctx.globalCompositeOperation='source-over';
     ctx.strokeStyle='rgba(238,232,213,.12)';
     ctx.lineWidth=.35;
     for(let i=0;i<Math.max(1,Math.round(r/11));i++){
       const oy=rand(-r*.45,r*.45);
       ctx.beginPath();ctx.moveTo(x-r*.32+rand(-2,2),y+oy);
       ctx.lineTo(x+rand(-r*.15,r*.42),y+oy+rand(-1,1));ctx.stroke();
     }
   }
   ctx.restore();
 }
 function spray(p,dx,dy,motion,count){
   const t=tones[tone];let dir=Math.atan2(dy,dx);if(motion<.05)dir=rand(-Math.PI,Math.PI);
   for(let i=0;i<count && flies.length<90;i++){
     const theta=dir+(motion>.05?rand(-1.25,1.25):rand(-Math.PI,Math.PI));
     const travel=size*rand(.6,3.3)*(.55+SPLASH_POWER*1.35)*(1+motion*.55);
     flies.push({x:p.x+Math.cos(theta)*travel,y:p.y+Math.sin(theta)*travel,r:size*(Math.random()<.19?rand(.45,.95):rand(.08,.33)),left:rand(.04,.28),mass:rand(.4,1.25),tone,color:ink});
   }
 }
 function frame(){
   let n=0;
   for(let i=flies.length-1;i>=0;i--){
      const f=flies[i];f.left-=1/60;
      if(f.left<=0 && n<12){
        flies.splice(i,1);n++;
        const priorTone=tone,priorColor=ink;tone=f.tone;ink=f.color;
        blot(f.x,f.y,f.r,f.mass,.85);tone=priorTone;ink=priorColor;
      }
   }
   requestAnimationFrame(frame)
 }requestAnimationFrame(frame);
 function drop(p,dx,dy){
   const t=tones[tone];const dist=Math.hypot(dx,dy);
   // Splashes form irregular clusters instead of continuously tracing a marker line.
   if(Math.random() < .67 || dist===0){
      const spread=size*(.2+.8*SPLASH_POWER), offsetX=rand(-spread,spread),offsetY=rand(-spread,spread);
      blot(p.x+offsetX,p.y+offsetY,size*rand(.72,1.75)*(.6+.5*SPLASH_POWER),rand(.48,1.18),1);
   }
   if(t.wet>.4 && Math.random()<.4)blot(p.x+rand(-size,size),p.y+rand(-size,size),size*(.9+t.wet*.5),.19,.45);
   strokeLength+=dist;
   if(strokeLength>Math.max(12,size*.9)){
     strokeLength=0;spray(p,dx||direction.x,dy||direction.y,1,Math.round((3+SPLASH_POWER*5)*t.spray));
   }
 }
 function saveSnapshot(){images.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(images.length>8)images.shift();}
 canvas.addEventListener('pointerdown',e=>{
   if(active!==null||e.button!==0)return;e.preventDefault();document.dispatchEvent(new Event('ink:stroke-start'));
   saveSnapshot();active=e.pointerId;canvas.setPointerCapture(e.pointerId);
   last=bounds(e);direction={x:1,y:0};strokeLength=0;
   drop(last,0,0);spray(last,0,0,.4,Math.round((12+SPLASH_POWER*8)*tones[tone].spray));hasInk=true;updateStatus();
 });
 canvas.addEventListener('pointermove',e=>{
   if(active!==e.pointerId)return;e.preventDefault();const p=bounds(e);const dx=p.x-last.x,dy=p.y-last.y;
   const distance=Math.hypot(dx,dy);if(distance<.5)return;
   const steps=Math.min(9,Math.ceil(distance/Math.max(6,size*.64)));
   for(let i=1;i<=steps;i++)drop({x:last.x+dx*i/steps,y:last.y+dy*i/steps},dx/steps,dy/steps);
   direction={x:dx,y:dy};last=p;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{
   if(e.pointerId!==active)return;
   if(type==='pointerup'&&Math.hypot(direction.x,direction.y)>1) spray(last,direction.x,direction.y,1,Math.round((6+SPLASH_POWER*6)*tones[tone].spray));
   active=null;last=null;document.dispatchEvent(new Event('ink:stroke-end'));
 });
 document.querySelectorAll('.color').forEach(b=>b.addEventListener('click',()=>{ink=b.dataset.color;document.querySelectorAll('.color').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateStatus()}));
 document.querySelectorAll('.tone-option').forEach(b=>b.addEventListener('click',()=>{tone=b.dataset.tone;document.querySelectorAll('.tone-option').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateStatus()}));
 $('size').addEventListener('input',e=>{size=Math.max(MIN_BRUSH,Math.min(MAX_BRUSH,Number(e.target.value)));e.target.value=size;updateStatus()});
 $('opacityControl').addEventListener('input',e=>{opacityLevel=Number(e.target.value)/100;updateStatus()});
 function undo(){flies.length=0;document.dispatchEvent(new Event('ink:cancel-idle'));const previous=images.pop();if(!previous)return;ctx.putImageData(previous,0,0);hasInk=images.length>0;updateStatus()}
 $('undo').addEventListener('click',undo);
 $('clear').addEventListener('click',()=>{saveSnapshot();flies.length=0;ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false;updateStatus()});
 window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();undo()}});
 $('export').addEventListener('click',()=>{
   while(flies.length){const f=flies.pop(),priorTone=tone,priorColor=ink;tone=f.tone;ink=f.color;blot(f.x,f.y,f.r,f.mass);tone=priorTone;ink=priorColor;}
   const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const g=out.getContext('2d');g.drawImage(paper,0,0);g.drawImage(canvas,0,0);
   out.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='怡然-泼墨.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png');
 });
 updateStatus();window.__yiranInkFallback=true;
})();