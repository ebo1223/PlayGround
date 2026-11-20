const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const W=960,H=540;
let keys={},running=false,ended=false,score=0,health=100,frame=0,camera=0,last=0,muted=false;
const hero={x:120,y:390,vx:0,vy:0,w:44,h:78,facing:1,onGround:true,attack:0,inv:0};
let enemies=[],citizens=[],coins=[],particles=[];

function reset(){score=0;health=100;hero.x=120;hero.y=390;hero.vx=0;hero.vy=0;hero.facing=1;hero.attack=0;camera=0;ended=false;
  enemies=[];citizens=[];coins=[];particles=[];
  [380,610,820,1050,1370].forEach((x,i)=>enemies.push({x,y:410-i%2*30,w:46,h:78,alive:true,dir:i%2?1:-1,health:2,stun:0}));
  [260,760,1180,1480].forEach((x,i)=>citizens.push({x,y:410,w:34,h:68,saved:false,phase:i}));
  [220,470,690,920,1100,1320,1500].forEach((x,i)=>coins.push({x,y:300-(i%3)*40,got:false,phase:i}));
  updateHud();}
function updateHud(){document.getElementById('healthText').textContent=Math.max(0,health);document.getElementById('scoreText').textContent=score;const rescued=citizens.filter(c=>c.saved).length;document.getElementById('missionProgress').style.width=(rescued/citizens.length*100)+'%';}
function beep(freq=220,duration=.06){if(muted)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='square';g.gain.setValueAtTime(.035,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+duration)}catch(e){}}
function burst(x,y,color){for(let i=0;i<10;i++)particles.push({x,y,vx:(Math.random()-.5)*7,vy:(Math.random-.5)*7-2,life:30,color});}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawCity(){
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#63b5d8');sky.addColorStop(1,'#bde4dc');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ffe2a3';ctx.beginPath();ctx.arc(790-camera*.08,95,48,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#86aeb5';for(let i=-2;i<12;i++){let x=i*150-camera*.18;if(i%2===0){rect(x,210,110,250,'#86aeb5');rect(x+18,180,74,280,'#93b8ba')}else rect(x,250,130,210,'#769fa8');for(let yy=270;yy<420;yy+=38)for(let xx=x+18;xx<x+120;xx+=34){ctx.fillStyle='#ffe29a';ctx.fillRect(xx-camera*.02,yy,13,18)}}
  ctx.fillStyle='#dfe3d8';ctx.beginPath();ctx.moveTo(0,410);ctx.lineTo(960,410);ctx.lineTo(960,540);ctx.lineTo(0,540);ctx.fill();
  ctx.fillStyle='#bcc6bd';ctx.fillRect(0,410,960,18);ctx.fillStyle='#f3cf3c';ctx.fillRect(0,426,960,7);
  ctx.fillStyle='#9daaa3';for(let i=-1;i<20;i++)ctx.fillRect(i*70-camera*.35%70,458,38,5);
}
function drawHero(){ctx.save();ctx.translate(hero.x-camera,hero.y);ctx.scale(hero.facing,1);
  ctx.fillStyle='#15243b';ctx.fillRect(-15,58,13,22);ctx.fillRect(12,58,13,22);ctx.fillStyle='#1c62a9';ctx.fillRect(-22,24,44,38);ctx.fillStyle='#ed3347';ctx.fillRect(-22,50,44,14);ctx.fillStyle='#f2bb8a';ctx.fillRect(-13,-2,26,28);ctx.fillStyle='#18233a';ctx.beginPath();ctx.arc(0,4,16,Math.PI,0);ctx.fill();ctx.fillRect(-15,-3,30,8);ctx.fillStyle='#ed3347';ctx.beginPath();ctx.moveTo(-15,-3);ctx.lineTo(-25,-18);ctx.lineTo(-2,-7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-9,12,18,5);ctx.fillStyle='#1c62a9';ctx.fillRect(-25,25,9,32);ctx.fillRect(16,25,9,32);
  if(hero.attack>0){ctx.strokeStyle='#ffcf40';ctx.lineWidth=7;ctx.beginPath();ctx.arc(28,38,28,-1,1);ctx.stroke()}ctx.restore();}
function drawEnemy(e){if(!e.alive)return;ctx.save();ctx.translate(e.x-camera,e.y);ctx.fillStyle='#3d3545';ctx.fillRect(-18,18,36,48);ctx.fillStyle='#f03d52';ctx.fillRect(-22,50,44,10);ctx.fillStyle='#d9a56f';ctx.fillRect(-14,0,28,22);ctx.fillStyle='#4a364a';ctx.fillRect(-16,-5,32,9);ctx.fillStyle='#fff';ctx.fillRect(-9,8,6,4);ctx.fillRect(3,8,6,4);ctx.restore()}
function drawCitizen(c){if(c.saved)return;ctx.save();ctx.translate(c.x-camera,c.y);ctx.fillStyle=c.phase%2?'#f0a43a':'#6c9c58';ctx.fillRect(-15,26,30,42);ctx.fillStyle='#e4b68f';ctx.fillRect(-12,5,24,24);ctx.fillStyle=c.phase%2?'#65452f':'#2d4f61';ctx.fillRect(-13,0,26,8);ctx.restore();}
function drawCoin(c){if(c.got)return;const bob=Math.sin(frame*.08+c.phase)*6;ctx.save();ctx.translate(c.x-camera,c.y+bob);ctx.fillStyle='#ffca38';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1a0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#a86b20';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('S',0,4);ctx.restore();}

function update(){if(!running)return;frame++;
  const left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD;
  if(left){hero.vx=-4;hero.facing=-1}else if(right){hero.vx=4;hero.facing=1}else hero.vx*=.75;
  if((keys.Space||keys.ArrowUp||keys.KeyW)&&hero.onGround){hero.vy=-11;hero.onGround=false;beep(180)}
  if(keys.KeyJ||keys.KeyX){if(hero.attack<=0){hero.attack=12;beep(100,.08)}}
  hero.vy+=.55;hero.x+=hero.vx;hero.y+=hero.vy;
  if(hero.y>410){hero.y=410;hero.vy=0;hero.onGround=true}
  hero.x=Math.max(30,Math.min(1580,hero.x));hero.attack=Math.max(0,hero.attack-1);hero.inv=Math.max(0,hero.inv-1);
  camera+=(hero.x-160-camera)*.08;camera=Math.max(0,Math.min(960,camera));
  enemies.forEach(e=>{if(!e.alive)return;e.x+=e.dir*.8;if(e.x<e.startX-35||e.x>e.startX+35)e.dir*=-1;if(!e.startX)e.startX=e.x;const dx=hero.x-e.x,dy=Math.abs(hero.y-e.y);if(hero.attack>0&&Math.abs(dx)<55&&dy<55){e.health--;e.stun=15;hero.attack=5;e.dir=dx<0?-1:1;if(e.health<=0){e.alive=false;score+=300;burst(e.x,e.y,'#ec3d46');beep(70,.12)}}else if(Math.abs(dx)<32&&dy<60&&e.stun<=0&&hero.inv<=0){health-=10;hero.inv=80;hero.vx=dx<0?6:-6;burst(hero.x,hero.y,'#ff5a62');beep(90,.1)}});
  citizens.forEach(c=>{if(!c.saved&&Math.abs(hero.x-c.x)<42){c.saved=true;score+=500;burst(c.x,c.y,'#ffcc38');beep(440,.12)}});
  coins.forEach(c=>{if(!c.got&&Math.abs(hero.x-c.x)<32&&Math.abs(hero.y-c.y)<45){c.got=true;score+=100;burst(c.x,c.y,'#ffcc38');beep(660,.04)}});
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.life--});particles=particles.filter(p=>p.life>0);
  updateHud();if(health<=0)finish(false);else if(citizens.every(c=>c.saved)&&enemies.every(e=>!e.alive))finish(true);
}
function finish(win){running=false;ended=true;document.getElementById('endBadge').textContent=win?'MISSION COMPLETE':'MISSION FAILED';document.getElementById('endTitle').textContent=win?'METRO IS SAFE':'THE CITY NEEDS YOU';document.getElementById('endText').textContent=win?'You stopped the villains and rescued every citizen.':'Recover, regroup, and give it another try.';document.getElementById('finalScore').textContent=score;document.getElementById('endPanel').classList.remove('hidden');}
function draw(){drawCity();coins.forEach(drawCoin);citizens.forEach(drawCitizen);enemies.forEach(drawEnemy);drawHero();particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/30);rect(p.x-camera,p.y,5,5,p.color);ctx.globalAlpha=1});}
function loop(t){if(!ended||running){update();draw()}requestAnimationFrame(loop)}

reset();draw();requestAnimationFrame(loop);
document.getElementById('startBtn').onclick=()=>{document.getElementById('startPanel').classList.add('hidden');document.getElementById('missionPanel').classList.remove('hidden');reset();running=true;beep(330,.1)};
document.getElementById('restartBtn').onclick=()=>{document.getElementById('endPanel').classList.add('hidden');document.getElementById('missionPanel').classList.remove('hidden');reset();running=true};
document.getElementById('soundBtn').onclick=e=>{muted=!muted;e.currentTarget.textContent=muted?'×':'♪'};
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();keys[e.code]=true});
window.addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const down=e=>{e.preventDefault();keys[k]=true};const up=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)});
