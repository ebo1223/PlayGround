const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=1280,H=720,ground=548;
const menu=document.getElementById('menu'),hud=document.getElementById('hud'),result=document.getElementById('result'),banner=document.getElementById('roundBanner');
const pHealth=document.getElementById('pHealth'),eHealth=document.getElementById('eHealth'),pGauge=document.getElementById('pGauge'),eGauge=document.getElementById('eGauge'),timerEl=document.getElementById('timer');
let keys={},running=false,roundOver=false,last=0,time=99,roundStart=0,shake=0;
const player=newFighter(330,true),enemy=newFighter(950,false);
function newFighter(x,face){return{x,vx:0,y:ground,h:145,w:78,vy:0,health:100,gauge:0,faceRight:face,action:'idle',actionT:0,cooldown:0,hit:false,blocking:false,walkPhase:0}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function rects(a,b,pad=18){return Math.abs(a.x-b.x)<(a.w+b.w)/2-pad&&Math.abs(a.y-b.y)<110}

function start(){menu.classList.add('hidden');result.classList.add('hidden');hud.classList.remove('hidden');Object.assign(player,{x:330,y:ground,health:100,gauge:0,action:'idle',vx:0,vy:0,faceRight:true});Object.assign(enemy,{x:950,y:ground,health:100,gauge:0,action:'idle',vx:0,vy:0,faceRight:false});time=99;roundOver=false;running=true;roundStart=performance.now();banner.style.display='block';banner.textContent='ROUND 1';setTimeout(()=>banner.style.display='none',900);last=performance.now();requestAnimationFrame(loop)}
document.getElementById('startBtn').onclick=start;document.getElementById('againBtn').onclick=start;
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function update(dt){if(!running)return;
 time=Math.max(0,99-Math.floor((performance.now()-roundStart)/1000));timerEl.textContent=time<10?'0'+time:time;if(time<=0){end(player.health>=enemy.health?'RYUJI WINS':'KAIRO WINS');return}
 control(player,true,dt);ai(enemy,player,dt);updateFighter(player,enemy,dt,true);updateFighter(enemy,player,dt,false);
 if(player.action==='attack'&&player.actionT>0.12&&player.actionT<0.32&&rects(player,enemy,5))hit(enemy,player,player.action==='kick'?12:8,player.action==='kick'?280:220);
 if(enemy.action==='attack'&&enemy.actionT>0.12&&enemy.actionT<0.32&&rects(enemy,player,5))hit(player,enemy,enemy.action==='kick'?12:8,enemy.action==='kick'?260:200);
 pHealth.style.width=player.health+'%';eHealth.style.width=enemy.health+'%';pGauge.style.width=player.gauge+'%';eGauge.style.width=enemy.gauge+'%';
 if(player.health<=0)end('KAIRO WINS');if(enemy.health<=0)end('RYUJI WINS')}
function control(f,local,dt){f.faceRight=f.x<enemy.x;if(f.cooldown>0){f.cooldown-=dt;return}f.blocking=(keys['s']||keys['arrowdown']);if(f.blocking){f.action='block';return}
 let move=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);f.vx=move*260;
 if((keys['w']||keys['arrowup'])&&f.y>=ground-1){f.vy=-650;keys['w']=keys['arrowup']=false}
 if(keys['j'])attack(f,'punch');if(keys['k'])attack(f,'kick')}
function ai(f,tar,dt){if(f.cooldown>0){f.cooldown-=dt;return}f.faceRight=f.x>tar.x;let d=f.x-tar.x,fabs=Math.abs(d);f.blocking=false;
 if(fabs>150){f.vx=d>0?-190:190}else{f.vx=0;if(Math.random()<.025&&fabs<170){attack(f,Math.random()<.55?'punch':'kick')}else if(Math.random()<.008&&fabs<180)f.blocking=true}
 if(f.blocking)f.action='block';if(f.y>=ground-1&&fabs>300&&Math.random()<.003){f.vy=-620}}
function attack(f,type){if(f.action==='punch'||f.action==='kick'||f.action==='block'||f.cooldown>0)return;f.action='attack';f.attackName=type;f.actionT=0;f.cooldown=.42}
function hit(t,from,damage,knock){if(t.blocking&&((from.faceRight&&t.x>from.x)||(!from.faceRight&&t.x<from.x))){damage*=.25;t.gauge=Math.min(100,t.gauge+4)}else{t.gauge=Math.min(100,t.gauge+10)}t.health=Math.max(0,t.health-damage);t.vx=from.x<t.x?knock:-knock;t.hit=true;t.action='hit';t.actionT=0;shake=8;from.gauge=Math.min(100,from.gauge+16)}
function updateFighter(f,other,dt,local){if(f.action==='hit'||f.action==='attack'){f.actionT+=dt;if(f.actionT>.22&&f.action==='hit')f.action='idle';if(f.actionT>.38&&f.action==='attack')f.action='idle'}else if(!f.blocking&&Math.abs(f.vx)>10)f.action='walk';else if(!f.blocking)f.action='idle';
 if(f.action==='attack')f.actionName=f.actionName||f.attackName;
 f.vy+=1700*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.y>=ground){f.y=ground;f.vy=0}f.x=clamp(f.x,95,W-95);if(f.vx>0)f.vx*=.82;else if(f.vx<0)f.vx*=.82;f.walkPhase+=dt*10;
 if(Math.abs(f.x-other.x)<82){f.x+=(f.x<other.x?-1:1)*1}}
function end(text){if(roundOver)return;roundOver=true;running=false;result.classList.remove('hidden');document.getElementById('resultTitle').textContent='K.O.';document.getElementById('resultText').textContent=text}

function draw(){ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.82}drawScene();drawShadow(player);drawShadow(enemy);drawFighter(player);drawFighter(enemy);ctx.restore();}
function drawScene(){
 // sky and distant city
 let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#18334b');g.addColorStop(.62,'#e49262');g.addColorStop(1,'#713e35');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(255,186,91,.28)';ctx.beginPath();ctx.arc(1030,180,75,0,7);ctx.fill();ctx.fillStyle='#2b3440';
 for(let i=0;i<16;i++){let x=i*90-30,h=130+(i%4)*45;ctx.fillRect(x,430-h,78,h);for(let y=430-h+25;y<420;y+=35)for(let xx=x+12;xx<x+68;xx+=26){ctx.fillStyle=(i+y)%3?'#e3aa63':'#202936';ctx.fillRect(xx,y,10,16)}}
 // neon signs
 ctx.fillStyle='#ef4f36';ctx.fillRect(95,300,145,70);ctx.fillStyle='#fff';ctx.font='38px Impact';ctx.fillText('KARATE',112,347);ctx.fillStyle='#37a7bd';ctx.fillRect(1015,330,180,55);ctx.fillStyle='#ddfaff';ctx.font='27px Impact';ctx.fillText('NIGHT MARKET',1028,366);
 // street/crowd barriers
 ctx.fillStyle='#15181b';ctx.fillRect(0,438,W,116);ctx.fillStyle='#252a2e';ctx.fillRect(0,438,W,18);ctx.fillStyle='#aa2e25';for(let x=0;x<W;x+=100){ctx.fillRect(x,438,52,8)}
 ctx.fillStyle='#bd4a37';ctx.beginPath();ctx.arc(180,410,25,0,7);ctx.fill();ctx.fillRect(160,432,40,14);ctx.fillStyle='#d3aa75';ctx.beginPath();ctx.arc(280,407,23,0,7);ctx.fill();ctx.fillRect(261,429,38,14);ctx.fillStyle='#3a2025';ctx.fillRect(145,446,170,7);
 // arena floor
 g=ctx.createLinearGradient(0,ground-20,0,H);g.addColorStop(0,'#77716c');g.addColorStop(1,'#292a2a');ctx.fillStyle=g;ctx.fillRect(0,ground,W,H-ground);ctx.strokeStyle='rgba(20,20,20,.45)';ctx.lineWidth=3;for(let x=-400;x<W+400;x+=100){ctx.beginPath();ctx.moveTo(640,ground);ctx.lineTo(x,H);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,620);ctx.lineTo(W,620);ctx.stroke();
 // lights
 ctx.fillStyle='#f6c263';ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,150);ctx.lineTo(170,438);ctx.lineTo(300,438);ctx.fill();ctx.beginPath();ctx.moveTo(W,150);ctx.lineTo(1090,438);ctx.lineTo(960,438);ctx.fill();ctx.globalAlpha=1
}
function drawShadow(f){ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(f.x,f.y+18,55,12,0,0,7);ctx.fill()}
function drawFighter(f){const enemySide=f===enemy;ctx.save();ctx.translate(f.x,f.y);if(!f.faceRight)ctx.scale(-1,1);let pose=f.action==='walk'?Math.sin(f.walkPhase)*10:0;if(f.action==='block')pose=8;
 // back arm
 ctx.fillStyle=enemySide?'#a83525':'#8d3021';ctx.fillRect(-38,-105,24,75);ctx.fillStyle=enemySide?'#e0a27d':'#d89b77';ctx.fillRect(-49,-65,25,16);
 // legs
 ctx.fillStyle='#151b27';ctx.save();ctx.translate(-18,-38);ctx.rotate(pose*.012);ctx.fillRect(-17,0,29,52);ctx.fillRect(-21,43,40,10);ctx.restore();ctx.save();ctx.translate(18,-38);ctx.rotate(-pose*.012);ctx.fillRect(-12,0,29,52);ctx.fillRect(-15,43,42,10);ctx.restore();ctx.fillStyle=enemySide?'#d83b27':'#ece8df';ctx.fillRect(-31,-62,62,30);ctx.fillStyle='#c9bfae';ctx.fillRect(-35,-72,70,15);
 // gi/body
 ctx.fillStyle=enemySide?'#171c36':'#dbe1dc';ctx.beginPath();ctx.moveTo(-43,-115);ctx.lineTo(38,-115);ctx.lineTo(29,-68);ctx.lineTo(-34,-68);ctx.closePath();ctx.fill();ctx.fillStyle=enemySide?'#d83b27':'#2a302f';ctx.fillRect(-40,-112,80,13);
 // belt
 ctx.fillStyle=enemySide?'#eeb62d':'#263a42';ctx.fillRect(-43,-72,86,13);ctx.fillStyle=enemySide?'#f7ca45':'#263a42';ctx.beginPath();ctx.moveTo(-9,-72);ctx.lineTo(18,-72);ctx.lineTo(10,-58);ctx.lineTo(-3,-58);ctx.fill();
 // head
 ctx.fillStyle=enemySide?'#b86e51':'#dcaa7d';ctx.beginPath();ctx.arc(0,-137,31,0,7);ctx.fill();ctx.fillStyle='#151719';ctx.fillRect(-28,-154,56,10);ctx.fillRect(-28,-148,8,30);ctx.fillRect(20,-148,8,30);
 // hair/headband
 ctx.fillStyle=enemySide?'#23243a':'#121518';ctx.beginPath();ctx.moveTo(-30,-150);ctx.quadraticCurveTo(0,-174,31,-150);ctx.lineTo(24,-137);ctx.lineTo(-25,-137);ctx.fill();ctx.fillStyle=enemySide?'#df3a29':'#d32f24';ctx.fillRect(-31,-150,62,8);ctx.fillRect(-31,-147,-48,-5);ctx.fillRect(-31,-147,-72,-1);
 // arm + attack
 ctx.fillStyle=enemySide?'#a83525':'#dbe1dc';ctx.save();ctx.translate(30,-108);if(f.action==='attack'){ctx.rotate(f.attackName==='kick'?-.2:-1.05);if(f.attackName==='punch')ctx.translate(25,0)}ctx.fillRect(-5,0,27,55);ctx.fillStyle=enemySide?'#b86e51':'#dcaa7d';ctx.beginPath();ctx.arc(8,55,13,0,7);ctx.fill();ctx.restore();
 // attack punch forearm / kick
 if(f.action==='attack'&&f.attackName==='punch'){ctx.fillStyle='#dcaa7d';ctx.fillRect(37,-118,46,18);ctx.beginPath();ctx.arc(84,-109,16,0,7);ctx.fill()}if(f.action==='attack'&&f.attackName==='kick'){ctx.strokeStyle='#dbe1dc';ctx.lineWidth=25;ctx.beginPath();ctx.moveTo(12,-53);ctx.lineTo(65,-43);ctx.stroke();ctx.strokeStyle=enemySide?'#b86e51':'#dcaa7d';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(65,-43);ctx.lineTo(100,-25);ctx.stroke()}
 ctx.restore();}
function loop(now){let dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();if(running||roundOver)requestAnimationFrame(loop)}
draw();