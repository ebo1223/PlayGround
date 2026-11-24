const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const playButton = document.getElementById('playButton');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const buttonText = document.getElementById('buttonText');
const bestEl = document.getElementById('bestScore');
const liveScore = document.getElementById('liveScore');
const gameHud = document.getElementById('gameHud');

let W=0,H=0,DPR=1,ground=0;
let state='ready', last=0, score=0, best=Number(localStorage.getItem('skyHopBest')||0);
bestEl.textContent=best;
const bird={x:0,y:0,vy:0,r:16,rot:0};
let pipes=[]; let particles=[]; let distance=0;

function resize(){
  const r=canvas.getBoundingCanvasRect?.() || canvas.getBoundingClientRect();
  W=r.width; H=r.height; DPR=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
  ground=H*.89; bird.x=W*.27; if(state==='ready') bird.y=H*.46;
}
new ResizeObserver(resize).observe(canvas); resize();

function reset(){
  bird.y=H*.46; bird.vy=0; bird.rot=0; pipes=[]; particles=[]; score=0; distance=0; liveScore.textContent='0';
  for(let i=0;i<3;i++) pipes.push(makePipe(W+380+i*260));
}
function makePipe(x){
  const gap=Math.max(142,Math.min(178,H*.22));
  const margin=145;
  const min=margin; const max=ground-gap-margin;
  const y=min+Math.random()*Math.max(30,max-min);
  return {x,y,gap,w:64,passed:false};
}
function start(){
  reset(); state='playing'; overlay.classList.add('hidden'); gameHud.classList.remove('hidden'); flap();
}
function flap(){
  if(state==='ready') return;
  if(state==='gameover'){ start(); return; }
  bird.vy=-7.8;
  for(let i=0;i<5;i++) particles.push({x:bird.x-12,y:bird.y+5,vx:-1-Math.random()*2,vy:(Math.random()-1)*1.5,life:1});
}
function end(){
  if(state==='gameover') return;
  state='gameover'; gameHud.classList.add('hidden');
  if(score>best){best=score;localStorage.setItem('skyHopBest',best);bestEl.textContent=best;}
  title.innerHTML='NICE<br><span>TRY</span>'; subtitle.textContent=`You scored ${score} • Best ${best}`; buttonText.textContent='RETRY';
  setTimeout(()=>overlay.classList.remove('hidden'),380);
}

playButton.addEventListener('click',e=>{e.stopPropagation();start();});
window.addEventListener('pointerdown',e=>{ if(!e.target.closest('button')&&state==='playing') flap(); });
window.addEventListener('keydown',e=>{ if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault(); if(state==='ready') start(); else flap(); } });

function roundedPipe(x,yTop,w,h,top){
  ctx.fillStyle='#69b96b'; ctx.strokeStyle='#18345a'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.roundRect(x,yTop,w,h,[10]); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(x+10,yTop+(top?8:0),9,h-(top?8:0));
  ctx.fillStyle='#74c66f'; ctx.fillRect(x-5,top?yTop+h-28:yTop,w+10,28);
  ctx.strokeRect(x-5,top?yTop+h-28:yTop,w+10,28);
}
function drawCloud(x,y,s){
  ctx.fillStyle='rgba(255,255,255,.78)'; ctx.beginPath(); ctx.arc(x,y,s*.35,0,Math.PI*2);ctx.arc(x+s*.3,y-s*.12,s*.48,0,Math.PI*2);ctx.arc(x+s*.65,y,s*.38,0,Math.PI*2);ctx.arc(x+s*.85,y+s*.12,s*.24,0,Math.PI*2);ctx.rect(x,y,x+s*.85,y+s*.12); ctx.fill();
}
function drawBackground(t){
  ctx.fillStyle='#82cfd8'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,245,191,.22)'; ctx.beginPath();ctx.arc(W*.82,H*.17,58,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,245,191,.65)';ctx.beginPath();ctx.arc(W*.82,H*.17,36,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.17)';
  for(let i=0;i<5;i++){const x=((i*190-distance*.07)%(W+220))-80; drawCloud(x,170+(i%3)*95,40+(i%2)*18);}
  ctx.fillStyle='#67b38a'; ctx.beginPath();ctx.moveTo(0,ground);for(let x=0;x<=W;x+=80){ctx.quadraticCurveTo(x+40,ground-45-Math.sin(x*.02+t*.0004)*18,x+80,ground);}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.fillStyle='#f4dda0';ctx.fillRect(0,ground,W,H-ground);
  ctx.fillStyle='#d8bd7f';ctx.fillRect(0,ground,W,5);
  ctx.fillStyle='#fff1bf';for(let x=-((distance*.9)%28);x<W;x+=28){ctx.beginPath();ctx.moveTo(x,ground+7);ctx.lineTo(x+14,ground+7);ctx.lineTo(x+7,H);ctx.lineTo(x-7,H);ctx.fill();}
}
function drawBird(t){
  ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.rot);
  ctx.fillStyle='#18345a';ctx.beginPath();ctx.ellipse(0,0,21,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f7b45f';ctx.beginPath();ctx.ellipse(-1,-2,17,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff1b2';ctx.beginPath();ctx.ellipse(-7,4,8,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#18345a';ctx.beginPath();ctx.arc(7,-6,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,-7,1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ee704f';ctx.beginPath();ctx.moveTo(14,-2);ctx.lineTo(27,3);ctx.lineTo(14,6);ctx.closePath();ctx.fill();ctx.strokeStyle='#18345a';ctx.lineWidth=2;ctx.stroke();
  const wing=-5+Math.sin(t*.018)*6;ctx.fillStyle='#e69a50';ctx.beginPath();ctx.ellipse(-9,wing,9,5,-.45,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.restore();
}

function update(dt){
  distance+=dt*.18;
  if(state==='playing'){
    bird.vy+=.43*dt; bird.y+=bird.vy*dt; bird.rot=Math.max(-.45,Math.min(1.25,bird.vy*.09));
    for(const p of pipes){p.x-=4*dt;if(!p.passed&&p.x+p.w<bird.x){p.passed=true;score++;liveScore.textContent=score;}}
    if(pipes.length&&pipes[0].x+pipes[0].w<-20)pipes.shift();
    if(pipes.length&&pipes[pipes.length-1].x<W-230)pipes.push(makePipe(pipes[pipes.length-1].x+260));
    for(const p of pipes){
      if(bird.x+14>p.x&&bird.x-14<p.x+p.w&&bird.y-14<p.y)pipes.length&&end();
      if(bird.x+14>p.x&&bird.x-14<p.x+p.w&&bird.y+14>p.y+p.gap)pipes.length&&end();
    }
    if(bird.y+bird.r>=ground||bird.y-bird.r<0)end();
  }else if(state==='ready'){
    bird.y=H*.46+Math.sin(performance.now()*0.004)*7;bird.rot=Math.sin(performance.now*.003)*.08;
  }
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.04*dt});particles=particles.filter(p=>p.life>0);
}
function render(t){
  ctx.clearRect(0,0,W,H);drawBackground(t);
  for(const p of pipes){roundedPipe(p.x,0,p.w,p.y,true);roundedPipe(p.x,p.y+p.gap,p.w,ground-p.y-p.gap,false);}
  particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
  drawBird(t);
}
function loop(t){const dt=Math.min(2,(t-last)/16.667||1);last=t;update(dt);render(t);requestAnimationFrame(loop);}requestAnimationFrame(loop);
