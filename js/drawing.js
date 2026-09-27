// Small local drawing pad. Strokes stay on this device until attached to a post.
export function mountDrawing(container, {draftKey, attach}) {
  container.innerHTML=`<details class="social-drawing"><summary>✎ Draw a post</summary><p>Draw with a mouse, touch, or pen. With the canvas focused, Space starts/stops a line and arrow keys move the pen; Shift moves faster.</p><div class="drawing-tools"><label>Ink<input type="color"  aria-label="Ink color"></label><label>Brush size<input type="range" min="1" max="24" value="4" aria-label="Brush size"></label><button type="button" data-undo>Undo</button><button type="button" data-clear>Clear drawing</button></div><canvas width="720" height="450" role="img" tabindex="0" aria-label="Drawing canvas. Space toggles the pen; arrow keys draw."></canvas><div class="social-actions"><button type="button" data-attach>Attach drawing</button><span role="status">Drawing drafts stay on this device.</span></div></details>`;
  const canvas=container.querySelector('canvas'),ctx=canvas.getContext('2d'),status=container.querySelector('[role=status]');
  const palette=getComputedStyle(document.documentElement);
  container.querySelector('[type=color]').value=palette.getPropertyValue('--cb-ink').trim();
  const paper=palette.getPropertyValue('--cb-paper').trim();
  let strokes=[],history=[],active=null,pointer=null,keyboard={x:360,y:225},drawing=false;
  try { const data=JSON.parse(localStorage.getItem(draftKey)||'[]');if(Array.isArray(data)&&data.length<=2000)strokes=data.filter(s=>Array.isArray(s.points)&&s.points.length&&s.points.length<50000&&/^#[0-9a-f]{6}$/i.test(s.color)&&s.size>=1&&s.size<=24&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))); } catch(_){}
  function remember(){try{localStorage.setItem(draftKey,JSON.stringify(strokes));}catch(_){status.textContent='Drawing could not be saved on this device. Attach it before leaving.';}}
  function saveUndo(){history.push(strokes.slice());if(history.length>20)history.shift();}
  function render(){ctx.fillStyle=paper;ctx.fillRect(0,0,canvas.width,canvas.height);for(const stroke of strokes){ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();stroke.points.forEach((p,i)=>{if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();const first=stroke.points[0];ctx.beginPath();ctx.arc(first.x,first.y,stroke.size/2,0,Math.PI*2);ctx.fill();}container.querySelector('[data-undo]').disabled=!history.length;container.querySelector('[data-attach]').disabled=!strokes.length;}
  function start(point){saveUndo();active={color:container.querySelector('[type=color]').value,size:Number(container.querySelector('[type=range]').value),points:[point]};strokes.push(active);render();}
  function move(point){if(active){active.points.push(point);render();}}
  function end(){active=null;pointer=null;drawing=false;remember();}
  function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))};}
  canvas.onpointerdown=e=>{if(e.button!==0||pointer!==null)return;e.preventDefault();end();pointer=e.pointerId;canvas.setPointerCapture(pointer);start(point(e));};
  canvas.onpointermove=e=>{if(e.pointerId===pointer)move(point(e));};
  canvas.onpointerup=e=>{if(e.pointerId===pointer)end();};canvas.onpointercancel=end;
  canvas.onkeydown=e=>{
    if(e.code==='Space'){e.preventDefault();drawing=!drawing;if(drawing){start({...keyboard});status.textContent='Pen down. Arrow keys draw.';}else{end();status.textContent='Pen lifted.';}return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?20:4;
    keyboard.x=Math.max(0,Math.min(canvas.width,keyboard.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)));
    keyboard.y=Math.max(0,Math.min(canvas.height,keyboard.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)));
    if(drawing)move({...keyboard});
  };
  canvas.onblur=()=>{if(drawing)end();};
  container.querySelector('[data-undo]').onclick=()=>{end();if(history.length)strokes=history.pop();remember();render();};
  container.querySelector('[data-clear]').onclick=()=>{end();saveUndo();strokes=[];remember();render();};
  container.querySelector('[data-attach]').onclick=async()=>{
    end();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob){status.textContent='Could not attach this drawing. Please try again.';return;}
    attach(new File([blob],'coolbrador-drawing.png',{type:'image/png'}));status.textContent='Drawing attached. Add a caption and post when ready.';container.querySelector('details').open=false;
  };
  render();return()=>{end();};
}
