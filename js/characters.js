// Original Pixar-style buddy characters. Each draws itself onto a canvas.
// drawBuddy(ctx, buddy, state='idle', t=0)  — state: 'idle' | 'happy' | 'thinking' | 'sad'

const BUDDIES = [
  { id:'pip',   name:'Pip',   color:'#ff8fb1', accent:'#c44b78', hat:'#ffd966', animal:'bunny' },
  { id:'momo',  name:'Momo',  color:'#6fb3ff', accent:'#3a78c4', hat:'#ffb366', animal:'bear' },
  { id:'bloop', name:'Bloop', color:'#7fe3b0', accent:'#2f9e6e', hat:'#c9a6ff', animal:'blob' },
];

function ear(ctx, x, y, accent, color){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(-0.5);
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.ellipse(0,0,14,20,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=accent;
  ctx.beginPath(); ctx.arc(-4,-4,5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBuddy(ctx, buddy, state='idle', t=0){
  const {color, accent, hat, animal} = buddy;
  ctx.save();
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const cx=ctx.canvas.width/2, cy=ctx.canvas.height/2;

  let bob=0;
  if(state==='happy')   bob=Math.sin(t*14)*6;
  if(state==='idle')    bob=Math.sin(t*3)*3;
  if(state==='thinking')bob=Math.sin(t*8)*2;

  // shadow
  ctx.fillStyle='rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(cx,cy+40,34,10,0,0,Math.PI*2); ctx.fill();

  // hat
  ctx.fillStyle=hat;
  ctx.beginPath();
  ctx.moveTo(cx-30,cy-50+bob); ctx.lineTo(cx+30,cy-50+bob);
  ctx.lineTo(cx+26,cy-74+bob); ctx.lineTo(cx-26,cy-74+bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=accent;
  ctx.beginPath(); ctx.arc(cx,cy-74+bob,5,0,Math.PI*2); ctx.fill();

  // body
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.ellipse(cx,cy+18+bob,52,56,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=accent; ctx.lineWidth=4; ctx.stroke();

  // ears
  if(animal==='bunny'){ ear(ctx,cx-40,cy-40+bob,accent,color); ear(ctx,cx+40,cy-40+bob,accent,color); }
  else if(animal==='bear'){ ear(ctx,cx-46,cy-20+bob,accent,color); ear(ctx,cx+46,cy-20+bob,accent,color); }

  // eyes
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(cx-16,cy-2+bob,13,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+16,cy-2+bob,13,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#222';
  ctx.beginPath(); ctx.arc(cx-16,cy-2+bob,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+16,cy-2+bob,5,0,Math.PI*2); ctx.fill();

  // mouth
  ctx.strokeStyle=accent; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath();
  if(state==='happy'){ ctx.arc(cx,cy+10+bob,11,0.15*Math.PI,0.85*Math.PI); }
  else if(state==='sad'){ ctx.arc(cx,cy+6+bob,11,1.15*Math.PI,1.85*Math.PI); }
  else { ctx.moveTo(cx-10,cy+6+bob); ctx.lineTo(cx+10,cy+6+bob); }
  ctx.stroke();

  // cheeks
  ctx.fillStyle='rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.arc(cx-30,cy+6+bob,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+30,cy+6+bob,5,0,Math.PI*2); ctx.fill();

  ctx.restore();
}

// Animate a buddy canvas with a state that can be set externally.
function startBuddyLoop(canvas, buddy, getState){
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  let last=0;
  function frame(ts){
    const t=(ts-last)/1000; last=ts;
    drawBuddy(ctx, buddy, getState(), t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {ctx};
}