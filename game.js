const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W=960,H=640;
const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),livesEl=document.getElementById('lives'),statusEl=document.getElementById('status');
const overlay=document.getElementById('overlay'),overlayTitle=document.getElementById('overlayTitle'),overlayText=document.getElementById('overlayText'),startBtn=document.getElementById('startBtn');
let state='menu',score=0,best=+(localStorage.getItem('froggerBest')||0),lives=3,goals=[false,false,false,false,false],moving=false,hopT=0,shake=0,last=performance.now();
const frog={x:480,y:608,tx:480,ty:608,dir:'up'};
let objects=[];
function pad(n){return String(n).padStart(4,'0')}
function makeObjects(){
  objects=[];
  const add=(lane,type,x,y,w,speed,color,count=1)=>objects.push({lane,type,x,y,w,speed,color,count});
  add(2,'car',-90,416,92,110,'#edb13c');add(2,'car',300,416,92,110,'#63aeb5');add(2,'car',650,416,92,110,'#df7257');
  add(3,'car',40,352,110,-125,'#e56862');add(3,'car',390,352,110,-125,'#74a768');add(3,'truck',730,352,150,-125,'#eee0a3');
  add(4,'truck',-180,288,150,80,'#8aaeb2');add(4,'truck',280,288,150,80,'#e58a58');add(4,'truck',670,288,150,80,'#b99ac2');
  add(5,'car',80,224,90,-145,'#e9c74d');add(5,'car',380,224,90,-145,'#5baec2');add(5,'car',700,224,90,-145,'#de7b65');
  // river lanes overlap road lane numbers intentionally avoided
  add(6,'log',-100,224,190,68,'#9a6538');add(6,'log',310,224,160,68,'#a87543');add(6,'log',680,224,210,68,'#85582f');
  add(7,'turtle',-40,160,150,-55,'#6bae69',3);add(7,'turtle',290,160,150,-55,'#6bae69',3);add(7,'turtle',620,160,150,-55,'#6bae69',3);
  add(8,'log',-140,96,220,48,'#96703f');add(8,'log',260,96,180,48,'#a87543');add(8,'log',680,96,210,48,'#86592f');
}
makeObjects();
bestEl.textContent=pad(best);
const dots=document.getElementById('goalDots');for(let i=0;i<5;i++){let s=document.createElement('span');s.className='goal-dot';dots.appendChild(s)}
function updateUI(){scoreEl.textContent=pad(score);bestEl.textContent=pad(best);livesEl.textContent=lives?Array.from({length:lives},()=> '♥').join(' '):'—';document.querySelectorAll('.goal-dot').forEach((e,i)=>e.classList.toggle('done',goals[i]))}
updateUI();
function resetFrog(){frog.x=frog.tx=480;frog.y=frog.ty=608;frog.dir='up';moving=false;hopT=0}
function startGame(){score=0;lives=3;goals=[false,false,false,false,false];state='playing';overlay.classList.add('hidden');resetFrog();makeObjects();statusEl.textContent='Cross the road';startBtn.innerHTML='START ADVENTURE <b>→</b>';updateUI()}
startBtn.onclick=()=>{if(state==='paused'){state='playing';overlay.classList.add('hidden')}else startGame()};
document.getElementById('pauseBtn').onclick=()=>{if(state==='playing'){state='paused';overlayTitle.innerHTML='Paused';overlayText.innerHTML='Take a breath.<br>The adventure can wait.';startBtn.innerHTML='RESUME <b>→</b>';overlay.classList.remove('hidden')}else if(state==='paused'){state='playing';overlay.classList.add('hidden')}};
document.getElementById('soundBtn').onclick=e=>e.target.textContent=e.target.textContent==='♪'?'×':'♪';
function move(dx,dy,dir){if(state!=='playing'||moving)return;let nx=frog.tx+dx,ny=frog.ty+dy;if(nx<32||nx>928||ny<32||ny>608)return;frog.dir=dir;frog.tx=nx;frog.ty=ny;moving=true;hopT=0}
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k))e.preventDefault();if(k==='arrowup'||k==='w')move(0,-64,'up');if(k==='arrowdown'||k==='s')move(0,64,'down');if(k==='arrowleft'||k==='a')move(-64,0,'left');if(k==='arrowright'||k==='d')move(64,0,'right');if(k==='p'||k==='escape')document.getElementById('pauseBtn').click()});
let touch=null;canvas.addEventListener('touchstart',e=>{touch=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});canvas.addEventListener('touchend',e=>{if(!touch)return;let dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>12)move(dx>0?64:-64,0,dx>0?'right':'left');else if(Math.abs(dy)>12)move(0,dy>0?64:-64,dy>0?'down':'up')},{passive:true});
function lose(){if(state!=='playing')return;lives--;shake=14;updateUI();statusEl.textContent='Splash or crash — try again';if(lives<=0){setTimeout(()=>endGame(false),500)}else setTimeout(resetFrog,450)}
function endGame(won){state=won?'won':'lost';if(score>best){best=score;localStorage.setItem('froggerBest',best)}overlayTitle.innerHTML=won?'Adventure!':'Try Again!';overlayText.innerHTML=won?`All lily pads reached.<br>Final score: <b>${pad(score)}</b>`:`Final score: <b>${pad(score)}</b><br>The pond is still calling.`;startBtn.innerHTML='PLAY AGAIN <b>→</b>';overlay.classList.remove('hidden');updateUI()}
function reachGoal(){if(frog.y>64)return false;let hit=-1;for(let i=0;i<5;i++)if(Math.abs(frog.x-(96+i*192))<38)hit=i;if(hit<0||goals[hit]){if(hit>=0)score+=50;lose();return true}goals[hit]=true;score+=250;updateUI();statusEl.textContent='Lily pad reached!';resetFrog();if(goals.every(Boolean))setTimeout(()=>endGame(true),300);return true}
function update(dt){if(moving){hopT+=dt*7;let t=Math.min(hopT,1);frog.x=frog.tx-(frog.tx-frog.x)*(1-t);frog.y=frog.ty-(frog.ty-frog.y)*(1-t);if(t>=1){frog.x=frog.tx;frog.y=frog.ty;moving=false;if(frog.y<64)reachGoal()}}for(let o of objects){o.x+=o.speed*dt;if(o.speed>0&&o.x>W+100)o.x=-o.w-80;if(o.speed<0&&o.x<-o.w-100)o.x=W+100}checkCollision();shake=Math.max(0,shake-dt*40)}
function roadHits(){let road=0;if(frog.y===416)road=2;if(frog.y===352)road=3;if(frog.y===288)road=4;if(!road)return false;return objects.some(o=>o.lane===road&&frog.x>o.x-28&&frog.x<o.x+o.w+28)}
function checkCollision(){if([416,352,288].includes(frog.y)&&roadHits())lose();if([96,160,224].includes(frog.y)){let lane=frog.y===224?6:frog.y===160?7:8;let supported=objects.some(o=>o.lane===lane&&frog.x>o.x-25&&frog.x<o.x+o.w+25);if(!supported)lose();else{let o=objects.find(o=>o.lane===lane&&frog.x>o.x-25&&frog.x<o.x+o.w+25);frog.x+=o.speed*.016;frog.tx=frog.x}}}
function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function draw(){ctx.save();if(shake)ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);drawWorld();ctx.restore();}
function drawWorld(){ctx.fillStyle='#79ad51';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#b5ce73';ctx.fillRect(0,0,W,64);ctx.fillRect(0,576,W,64);ctx.fillRect(0,320,W,96); // grassy banks
  ctx.fillStyle='#4f95a3';ctx.fillRect(0,64,W,256);
  ctx.fillStyle='#69afbb';for(let y=72;y<312;y+=24){ctx.globalAlpha=.25;ctx.fillRect(0,y,W,3);ctx.globalAlpha=1}
  // lanes
  ctx.fillStyle='#6e6970';ctx.fillRect(0,256,W,256);ctx.fillStyle='#7d7980';ctx.fillRect(0,256,W,64);for(let y=320;y<512;y+=64){ctx.fillStyle=y===320?'#77737a':'#77727a';ctx.fillRect(0,y,W,64)}
  ctx.setLineDash([24,24]);ctx.strokeStyle='#f1d78a';ctx.lineWidth=4;for(let y=288;y<=480;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.setLineDash([]);
  // bottom grass and stripe
  ctx.fillStyle='#78b84d';ctx.fillRect(0,512,W,128);ctx.fillStyle='#96c95c';ctx.fillRect(0,512,W,8);
  // homes
  ctx.fillStyle='#4e8457';ctx.fillRect(0,0,W,64);ctx.strokeStyle='#d6dfa0';ctx.lineWidth=3;for(let i=0;i<5;i++){let x=96+i*192;ctx.fillStyle='#76a95b';ctx.beginPath();ctx.ellipse(x,34,38,23,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#b9d66b';ctx.beginPath();ctx.ellipse(x-7,29,16,8,-.3,0,Math.PI*2);ctx.fill();if(goals[i])drawFrog(x,34,.8)}
  for(let o of objects){if(o.type==='log')drawLog(o);else if(o.type==='turtle')drawTurtles(o);else drawVehicle(o)}
  if(!goals.every((v,i)=>v&&frog.y===32))drawFrog(frog.x,frog.y,1);
}
function drawLog(o){ctx.fillStyle='#614126';roundedRect(o.x,o.y-22,o.w,44,18);ctx.fillStyle=o.color;roundedRect(o.x+5,o.y-18,o.w-10,36,14);ctx.strokeStyle='#6f482b';ctx.lineWidth=3;for(let x=o.x+35;x<o.x+o.w;x+=55){ctx.beginPath();ctx.moveTo(x,o.y-13);ctx.lineTo(x,o.y+13);ctx.stroke()} }
function drawTurtles(o){for(let i=0;i<o.count;i++){let x=o.x+i*(o.w/o.count)+28;ctx.fillStyle='#557a43';ctx.beginPath();ctx.ellipse(x,o.y,24,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#80bf68';ctx.beginPath();ctx.ellipse(x,o.y-3,16,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#88b66a';ctx.beginPath();ctx.arc(x+(o.speed>0?20:-20),o.y+2,7,0,Math.PI*2);ctx.fill()}}
function drawVehicle(o){ctx.fillStyle=o.color;roundedRect(o.x,o.y-24,o.w,48,10);ctx.fillStyle='#49667a';let wx=o.w>120?38:30;ctx.fillRect(o.x+12,o.y-17,wx,16);ctx.fillRect(o.x+o.w-wx-12,o.y-17,wx,16);ctx.fillStyle='#26383e';ctx.beginPath();ctx.arc(o.x+20,o.y+22,8,0,Math.PI*2);ctx.arc(o.x+o.w-20,o.y+22,8,0,Math.PI*2);ctx.fill()}
function drawFrog(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(frog.dir==='left'?-.12:frog.dir==='right'?.12:0);ctx.fillStyle='#4d932f';ctx.beginPath();ctx.ellipse(0,5,22,27,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#77bd45';ctx.beginPath();ctx.ellipse(0,7,16,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-14,-15,9,0,Math.PI*2);ctx.arc(14,-15,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dff0a8';ctx.beginPath();ctx.arc(-14,-16,4,0,Math.PI*2);ctx.arc(14,-16,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17352b';ctx.beginPath();ctx.arc(-14,-16,2,0,Math.PI*2);ctx.arc(14,-16,2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#70b73e';ctx.beginPath();ctx.ellipse(-23,13,9,5,.5,0,Math.PI*2);ctx.ellipse(23,13,9,5,-.5,0,Math.PI*2);ctx.fill();ctx.restore()}
requestAnimationFrame(loop);
function loop(now){let dt=Math.min((now-last)/1000,.035);last=now;if(state==='playing')update(dt);draw();requestAnimationFrame(loop)}
