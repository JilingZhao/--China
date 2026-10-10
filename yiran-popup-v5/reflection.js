/* Offline reflection. Keyword cues are not an AI model or a clinical assessment.
   No networking, storage, telemetry, or API secrets are used here. */
(() => {
  'use strict';
  const dialog = document.getElementById('emotionDialog');
  const input = document.getElementById('emotionText');
  const analyze = document.getElementById('emotionAnalyze');
  const title = document.getElementById('responseTitle');
  const result = document.getElementById('emotionResult');
  let idleTimer = null, textTimer = null, drawing = false, focusBefore = null, activeId = null;
  const canvas = document.getElementById('drawing');
  const studio = document.querySelector('.studio');
  const status = document.getElementById('reflectionStatus');
  const isOpen = () => !dialog.hidden;
  const cues = [
    {name:'紧张与担心', words:['焦虑','担心','紧张','害怕','不安','压力','来不及','考试','截止','worried','anxious','stress'], reply:'这些文字里似乎有一些对结果的担心。也许这件事对你很重要，而眼下还有不确定的部分。', step:'可以试着区分：现在能做的一小步是什么，哪些结果暂时不由你决定？'},
    {name:'失落与难过', words:['难过','伤心','失落','委屈','想哭','孤独','寂寞','失望','sad','lonely'], reply:'你的文字里似乎有失落或委屈。你不必马上把感受收起来，也不必急着找到一个积极的解释。', step:'你原本期待发生什么？如果有人能理解你，你最希望对方听见哪一句话？'},
    {name:'生气与不满', words:['生气','愤怒','烦躁','不公平','讨厌','气愤','愤慨','angry','frustrated'], reply:'你提到的感受里，可能有生气或不满。可以留意，是哪件事与你在意的期待或边界发生了冲突。', step:'试着写成一句话：“当……发生时，我感到……，我希望……。”不需要现在就把它发送给任何人。'},
    {name:'疲惫与负担', words:['疲惫','累','耗尽','疲倦','没力气','撑不住','倦怠','tired','exhausted'], reply:'这些文字里可能有疲惫，也可能是同时要处理的事情太多。此刻不必要求自己把所有事情都完成。', step:'有没有一件事可以晚一点做？你现在更需要休息、帮助，还是一点不被打扰的时间？'},
    {name:'喜悦与满足', words:['开心','高兴','快乐','幸福','兴奋','满足','感激','感恩','期待','happy','excited'], reply:'文字里出现了喜悦或期待的线索。值得留意：是什么细节，让这一刻对你有了特别的意义。', step:'你愿意为这份感受取一个名字吗？也可以记下今天想要保留的一个小瞬间。'},
    {name:'平静与放松', words:['平静','放松','安心','宁静','释然','舒适','舒服','calm','relaxed'], reply:'你写下的内容似乎带着一些平静或放松。可以慢一点，看看这种感受来自什么。', step:'是环境、陪伴，还是给自己留出的空间？有什么小做法，是你下次也想保留的？'}
  ];
  function cancelIdle(){clearTimeout(idleTimer);idleTimer=null;}
  function open(){
    cancelIdle();if(isOpen())return;
    focusBefore=document.activeElement;
    dialog.hidden=false;
    studio.inert=true;
    document.dispatchEvent(new CustomEvent('ink:reflection',{detail:{open:true}}));
    input.focus();
  }
  function close(){
    if(!isOpen())return;
    dialog.hidden=true;studio.inert=false;cancelIdle();
    status.textContent='v5 · 继续落笔后，会重新计时';
    document.dispatchEvent(new CustomEvent('ink:reflection',{detail:{open:false}}));
    if(focusBefore?.isConnected)focusBefore.focus();
  }
  function begin(e){
    if(isOpen()||drawing||(e.button!==undefined&&e.button!==0))return;
    drawing=true;activeId=e.pointerId??'mouse';cancelIdle();
    status.textContent='v5 · 正在落笔';
  }
  function end(e){
    if(!drawing||(e.pointerId!==undefined&&activeId!==e.pointerId))return;
    drawing=false;activeId=null;cancelIdle();
    status.textContent='v5 · 已停笔，5 秒后打开心情卡片';
    idleTimer=setTimeout(()=>{idleTimer=null;if(!drawing&&!isOpen())open();},5000);
  }
  function showParagraphs(lines){result.replaceChildren(...lines.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));}
  function reflect(){
    const text=input.value.trim();
    if(!text){title.textContent='把心里的话，慢慢写下来';showParagraphs(['有些感受，可以先交给笔墨。也可以在右边记下刚刚发生的事。','这里会根据你文字中的情绪线索，给出一段回应。']);return;}
    const lower=text.toLowerCase();
    const hits=cues.map(c=>({...c, matched:c.words.filter(word=>{let at=lower.indexOf(word);while(at!==-1){const before=lower.slice(Math.max(0,at-7),at);if(!/(不|没有|不再|并不|并没有|没那么|不是|not |no longer )$/.test(before))return true;at=lower.indexOf(word,at+word.length);}return false;})})).filter(c=>c.matched.length).sort((a,b)=>b.matched.length-a.matched.length).slice(0,2);
    if(!hits.length){title.textContent='先不急着为心情命名';showParagraphs(['你写下的事情已经是一个开始。目前没有匹配到明确的情绪词，这不代表你没有情绪。','回到刚才那个瞬间：你有什么感受？最在意的是哪一部分？可以再补充一两句，也可以只把它留在这里。']);return;}
    title.textContent=hits.map(h=>h.name).join(' · ');
    const evidence=hits.flatMap(h=>h.matched).slice(0,4).map(w=>'“'+w+'”').join('、');
    showParagraphs(['你提到了 '+evidence+'。下面是一种可能的理解，若不贴合，请以自己的感受为准。',...hits.map(h=>h.reply),hits[0].step]);
  }
  // Listen to real input directly, independently of the WebGL renderer.
  if('PointerEvent' in window){
    canvas.addEventListener('pointerdown',begin,true);
    window.addEventListener('pointerup',end,true);
    window.addEventListener('pointercancel',end,true);
    canvas.addEventListener('lostpointercapture',end,true);
  }else{
    canvas.addEventListener('mousedown',begin,true);
    window.addEventListener('mouseup',end,true);
    canvas.addEventListener('touchstart',begin,{passive:true});
    window.addEventListener('touchend',end,{passive:true});
    window.addEventListener('touchcancel',end,{passive:true});
  }
  function reset(){drawing=false;activeId=null;cancelIdle();status.textContent='v5 · 停笔 5 秒或保存，记录心情';}
  document.addEventListener('ink:cancel-idle',reset);
  document.getElementById('clear').addEventListener('click',reset,true);
  document.getElementById('undo').addEventListener('click',reset,true);
  document.getElementById('export').addEventListener('click',open,true);
  document.getElementById('openEmotion').addEventListener('click',open);
  document.getElementById('emotionClose').addEventListener('click',close);
  document.getElementById('emotionContinue').addEventListener('click',close);
  document.addEventListener('keydown',e=>{
    if(!isOpen())return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const focusable=Array.from(dialog.querySelectorAll('button:not(:disabled), textarea'));
      const i=focusable.indexOf(document.activeElement);
      if(e.shiftKey&&(i<=0)){e.preventDefault();focusable[focusable.length-1].focus();}
      else if(!e.shiftKey&&(i===focusable.length-1||i<0)){e.preventDefault();focusable[0].focus();}
    }
  });
  input.addEventListener('input',()=>{document.getElementById('emotionCount').textContent=input.value.length+' / 2000';analyze.disabled=!input.value.trim();clearTimeout(textTimer);textTimer=setTimeout(reflect,600);});
  analyze.addEventListener('click',()=>{clearTimeout(textTimer);reflect();});
  status.textContent='v5 · 停笔 5 秒或保存，记录心情';
})();
