(()=>{
'use strict';
const $=id=>document.getElementById(id);
// All three tool panels are mutually exclusive and initially collapsed.
const toolPanels=[['paletteToggle','palette'],['inkToggle','settings']];
function closeToolPanels(except=null){
  for(const [buttonId,panelId] of toolPanels){
    if(panelId===except)continue;
    $(panelId).hidden=true;
    $(buttonId).setAttribute('aria-expanded','false');
  }
}
for(const [buttonId,panelId] of toolPanels){
  $(buttonId).addEventListener('click',event=>{
    event.stopPropagation();
    const panel=$(panelId),willOpen=panel.hidden;
    closeToolPanels();
    panel.hidden=!willOpen;
    $(buttonId).setAttribute('aria-expanded',String(willOpen));
  });
}
document.querySelectorAll('.color,.tone-option').forEach(button=>{
  button.addEventListener('click',()=>{
    closeToolPanels();
  });
});
document.addEventListener('pointerdown',event=>{
  if(toolPanels.some(([buttonId,panelId])=>$(buttonId).contains(event.target)||$(panelId).contains(event.target)))return;
  closeToolPanels();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeToolPanels();});
document.addEventListener('ink:close-panels',()=>closeToolPanels());
closeToolPanels();

// Render actual calligraphic bristle strokes in the five preview swatches.
// The five pigments remain independent of these five wet/dry ink styles.
function paintToneSamples(){
  const models={
    jiao:{alpha:1.00, width:22, dry:.66, bloom:0, scratch:9, flecks:8},
    nong:{alpha:.88, width:22, dry:.24, bloom:.03, scratch:5, flecks:5},
    zhong:{alpha:.62, width:20, dry:.20, bloom:.07, scratch:7, flecks:4},
    dan:{alpha:.26, width:20, dry:.12, bloom:.20, scratch:4, flecks:4},
    qing:{alpha:.07, width:19, dry:.04, bloom:.31, scratch:2, flecks:2}
  };
  const seeded=(n)=>()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};
  for(const canv of document.querySelectorAll('canvas.tone-mark')){
    const model=models[canv.dataset.stroke], c=canv.getContext('2d');
    if(!c||!model)continue;
    const rand=seeded(621+(['jiao','nong','zhong','dan','qing'].indexOf(canv.dataset.stroke))*429);
    const W=280,H=110;canv.width=W;canv.height=H;
    c.clearRect(0,0,W,H);
    const center=(t)=>57-21*t+Math.sin(t*5.2)*2;
    const width=(t)=>model.width*(.72+.34*Math.sin(Math.PI*t))*(.28+.72*Math.pow(Math.min(1,(1-t)*5),.44));
    // A width-varying, tapering ribbon that has naturally uneven bristle edges.
    function brushPath(scale=1,offset=0){
      c.beginPath();
      const N=70;
      for(let i=0;i<=N;i++){
        const t=i/N, x=10+t*254;
        const rough=(rand()-.5)*(model.dry>0.4?4.8:2.3);
        const y=center(t)+offset-width(t)*scale+rough;
        if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      for(let i=N;i>=0;i--){
        const t=i/N,x=10+t*254;
        const rough=(rand()-.5)*(model.dry>0.4?5.2:2.5);
        c.lineTo(x,center(t)+offset+width(t)*scale+rough);
      }
      c.closePath();
    }
    // Wet ink creates an extremely subtle feathered water halo beyond the stroke.
    if(model.bloom>0){
      c.save();c.filter='blur('+(6+model.bloom*6)+'px)';
      c.globalAlpha=model.bloom*.48;c.fillStyle='#2f2a23';
      brushPath(1.25);c.fill();c.restore();
    }
    c.save();
    c.globalAlpha=model.alpha;
    const gradient=c.createLinearGradient(0,25,0,95);
    gradient.addColorStop(0,'#514b43');
    gradient.addColorStop(.33,canv.dataset.stroke==='jiao'?'#1d1a17':'#26221d');
    gradient.addColorStop(1,'#4e4841');
    c.fillStyle=gradient;brushPath();c.fill();c.restore();
    // Layered bristle tracks make the mark read as a real sweeping brush stroke.
    for(let k=0;k<15;k++){
      const off=(k-7)*2.35+(rand()-.5)*1.5;
      c.beginPath();
      const start=rand()*.15,end=.78+rand()*.2;
      for(let j=0;j<=22;j++){
        const t=start+(end-start)*j/22;
        const x=11+t*254;
        const y=center(t)+off*.81+Math.sin(t*10+k)*.7;
        if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      const a=model.dry>.5?(rand()>.48?.42:.08):model.alpha*.22;
      c.strokeStyle=k%3===0?'#160f0c':'#50463b';
      c.lineWidth=.6+rand()*1.8;
      c.globalAlpha=a;c.stroke();
    }
    c.globalAlpha=1;
    // Drybrush leaves fine negative-space streaks across the deposited pigment.
    c.save();brushPath(.98);c.clip();
    c.globalCompositeOperation='destination-out';
    for(let k=0;k<model.scratch;k++){
      let st=.05+rand()*.68, en=Math.min(.99,st+.1+rand()*.37);
      const off=(rand()-.5)*model.width*1.6;
      c.beginPath();
      for(let j=0;j<=20;j++){
        const t=st+(en-st)*j/20;
        const x=11+t*254, y=center(t)+off+Math.sin(t*12+k)*.8;
        if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.lineWidth=canv.dataset.stroke==='jiao' ? .45+rand()*.75 : .45+rand()*1.0;
      c.globalAlpha=canv.dataset.stroke==='jiao' ? .15 : Math.max(.08,model.dry*.45);
      c.strokeStyle='#000';c.stroke();
    }
    c.restore();c.globalAlpha=1;
    // Loose wisps and scattered pigment at the edges.
    for(let k=0;k<model.flecks;k++){
      const t=rand()*.86+.03, off=(rand()>.5?1:-1)*(model.width+rand()*12);
      const x=11+t*254,y=center(t)+off;
      c.fillStyle='#302c27';c.globalAlpha=model.alpha*(.08+rand()*.17);
      c.beginPath();c.ellipse(x,y,.45+rand()*2,.25+rand()*.85,rand()*.7,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
  }
}
paintToneSamples();


})();
