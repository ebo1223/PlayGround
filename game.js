const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=540,title=document.getElementById('titlePanel'),pause=document.getElementById('pausePanel');
let state='title',last=0,keys={},camera=0,shake=0,time=0,particles=[];
const player={x:150,y:335,vx:0,vy:0,dir:1,hp:100,maxHp:100,stamina:100,maxStamina:100,atk:0,inv:0,dash:0,dead:false};
let enemies=[],boss=null,coins=0,stageClear=false;
function rand(a,b){return a+Math.random()*(b-a)}
function reset(){player.x=150;player.y=335;player.hp=100;player.stamina=100;player.dead=false;camera=0;coins=0;stageClear=false;boss=null;
 enemies=[];for(let i=0;i<6;i++)enemies.push(makeEnemy(500+i*145+rand(-30,30),i%2?340:300, i===5?'brute':'scout'));spawnBoss();particles=[]}
function makeEnemy(x,y,type){return{x,y,hp:type==='brute'?48:30,maxHp:type==='brute'?48:30,type,dir:-1,hit:0,dead:false,vx:0,vy:0}}
function spawnBoss(){boss={x:1550,y:278,hp:260,maxHp:260,type:'dragon',dir:-1,hit:0,dead:false,fire:0,roar:2}}
reset();
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
resize();
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();if(e.key==='Escape'&&state==='playing')pauseGame();if(e.key==='Escape'&&state==='paused')resumeGame();if((e.key.toLowerCase()==='j'||e.key===' ')&&state==='playing'){if(player.dead)reset();else attack()}});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function attack(){if(player.atk>0||player.dead)return;player.atk=.34}
function dash(){if(player.stamina>=30&&player.dash<=0&&!player.dead){player.dash=.22;player.stamina-=30;player.vx=player.dir*520;shake=4}}
function pauseGame(){state='paused';pause.classList.add('show')}
function resumeGame(){state='playing';pause.classList.remove('show')}
document.getElementById('startBtn').onclick=()=>{reset();title.classList.remove('show');state='playing'};
document.getElementById('resumeBtn').onclick=resumeGame;
document.getElementById('restartBtn').onclick=()=>{pause.classList.remove('show');reset();state='playing'};
const dirs={up:'w',down:'s',left:'a',right:'d'};
document.querySelectorAll('#dpad button').forEach(b=>b.onpointerdown=e=>{e.prevent;keys[dirs[b.dataset.dir]]=true});
document.querySelectorAll('#dpad button').forEach(b=>b.onpointerup=()=>keys[dirs[b.dataset.dir]]=false);
document.getElementById('attackTouch').onpointerdown=e=>{e.preventDefault();attack()};document.getElementById('dashTouch').onpointerdown=e=>{e.preventDefault();dash()};
window.addEventListener('blur',()=>{if(state==='playing')pauseGame()});
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function update(dt){time+=dt;if(shake>0)shake-=dt*20;if(player.dead){player.atk=Math.max(0,player.atk-dt);return} 
 let mx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(mx)player.dir=mx>0?1:-1;
 if(player.dash>0){player.dash-=dt}else{player.vx+=(mx*190-player.vx)*Math.min(1,dt*10);player.vy+=(my*150-player.vy)*Math.min(1,dt*10)}
 player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=clamp(player.x,32,1710);player.y=clamp(player.y,250,408);
 player.atk=Math.max(0,player.atk-dt);player.inv=Math.max(0,player.inv-dt);player.stamina=Math.min(100,player.stamina+18*dt);
 if((keys.k)&&player.dash<=0)dash();
 if(player.atk>.24){for(const e of enemies)if(!e.dead&&Math.abs(e.x-player.x)<62&&Math.abs(e.y-player.y)<55&&Math.sign(e.x-player.x)==player.dir)hurt(e,18)}
 if(player.atk>.24&&boss&&!boss.dead&&Math.abs(boss.x-player.x)<90&&Math.abs(boss.y-player.y)<75&&Math.sign(boss.x-player.x)==player.dir)hurt(boss,20);
 for(const e of enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);if(d<190&&d>38){e.vx=(dx/d)*65;e.dir=dx>0?1:-1}else e.vx*=.9;e.x+=e.vx*dt;if(d<42&&player.inv<=0){hurtPlayer(e.type==='brute'?16:10)}}
 if(boss&&!boss.dead){boss.hit=Math.max(0,boss.hit-dt);boss.fire-=dt;const dx=player.x-boss.x,d=Math.hypot(dx,player.y-boss.y);boss.dir=dx>0?1:-1;if(d>110)boss.x+=boss.dir*38*dt;if(boss.fire<=0&&d<520){boss.fire=1.7;for(let i=-1;i<=1;i++)particles.push({x:boss.x,y:boss.y-25,vx:boss.dir*(210+i*35),vy:i*55,life:1.7,type:'fire',r:12})}}
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.type==='fire'&&p.life>0&&Math.hypot(p.x-player.x,p.y-player.y)<38&&player.inv<=0)hurtPlayer(12)}particles=particles.filter(p=>p.life>0);
 camera+=(clamp(player.x-W*.44,0,880)-camera)*Math.min(1,dt*5);
 enemies.forEach(e=>{if(!e.dead&&e.hp<=0){e.dead=true;coins+=e.type==='brute'?3:1;burst(e.x,e.y,'coin')}});if(boss&&!boss.dead&&boss.hp<=0){boss.dead=true;stageClear=true;coins+=20;burst(boss.x,boss.y,'gold')}
 if(player.hp<=0&&!player.dead){player.dead=true;player.hp=0}
}
function hurt(e,n){if(e.hit>.06)return;e.hp-=n;e.hit=.12;e.vx=(e.x-player.x>0?1:-1)*140;shake=5;burst(e.x,e.y,'blood')}
function hurtPlayer(n){player.hp-=n;player.inv=.8;shake=9;burst(player.x,player.y,'blood')}
function burst(x,y,type){for(let i=0;i<12;i++)particles.push({x,y,vx:rand(-120,120),vy:rand(-150,40),life:rand(.3,.8),type,r:rand(2,5)})}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function draw(){ctx.save();ctx.clearRect(0,0,W,H);ctx.translate(shake?rand(-shake,shake):0,shake?rand(-shake,shake):0);
 drawWorld();drawEnemies();drawBoss();drawPlayer();drawParticles();drawHUD();ctx.restore();if(player.dead)drawDeath();if(stageClear)drawVictory()}
function drawWorld(){const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#1a1a32');grd.addColorStop(.5,'#3a3041');grd.addColorStop(1,'#17131b');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 // mountains
 ctx.fillStyle='#25243a';ctx.beginPath();ctx.moveTo(0,310);for(let x=-100;x<W+200;x+=180){ctx.lineTo(x-camera*.12,220+((x/180%2)*35));ctx.lineTo(x+95-camera*.12,310)}ctx.lineTo(W,310);ctx.closePath();ctx.fill();
 ctx.fillStyle='#171725';ctx.beginPath();ctx.moveTo(0,340);for(let x=-120;x<W+200;x+=220){ctx.lineTo(x-camera*.25,190+(Math.abs(x)%3)*25);ctx.lineTo(x+110-camera*.25,340)}ctx.lineTo(W,340);ctx.closePath();ctx.fill();
 // moon
 ellipse(760-camera*.05,85,48,48,'#dfaa67');ellipse(760-camera*.05,85,38,38,'#f3ca82');
 // distant towers
 ctx.fillStyle='#17151f';for(let i=0;i<7;i++){let x=i*300-camera*.35+100;rect(x,235,28,125,'#15141d');rect(x-8,228,44,16,'#15141d');for(let y=250;y<330;y+=24){rect(x+7,y,5,12,'#bd7445')}}
 // ground
 rect(0,408,W,132,'#241927');ctx.fillStyle='#342633';ctx.fillRect(0,408,W,18);ctx.fillStyle='#18151c';ctx.fillRect(0,426,W,114);
 ctx.save();ctx.translate(-camera,0);
 rect(0,408,1800,18,'#3b302f');for(let x=20;x<1780;x+=62){ctx.fillStyle='#5a4540';ctx.beginPath();ctx.moveTo(x,408);ctx.lineTo(x+30,408);ctx.lineTo(x+18,426);ctx.lineTo(x-12,426);ctx.fill()}
 // ruin props
 for(let x=350;x<1700;x+=310){rect(x,350,18,58,'#62504d');rect(x-12,342,42,12,'#4d4140');rect(x+110,376,7,32,'#57434a');ellipse(x+113,371,18,7,'#2b202a')}
 ctx.restore()
}
function drawPlayer(){ctx.save();ctx.translate(player.x-camera,player.y);if(player.inv>0&&Math.floor(player.inv*12)%2)return;ctx.scale(player.dir,1);
 // cloak / body
 ctx.fillStyle='#b84f32';ctx.beginPath();ctx.moveTo(-18,-20);ctx.quadraticCurveTo(-28,25,-38,48);ctx.lineTo(24,48);ctx.quadraticCurveTo(18,10,16,-20);ctx.closePath();ctx.fill();ctx.fillStyle='#db6a3e';ctx.beginPath();ctx.moveTo(-10,-14);ctx.lineTo(13,-14);ctx.lineTo(18,26);ctx.lineTo(-16,26);ctx.fill();
 // legs
 rect(-15,43,11,17,'#4b3030');rect(8,43,11,17,'#4b3030');rect(-17,58,16,6,'#15131a');rect(6,58,16,6,'#15131a');
 // head, hair
 ellipse(0,-28,15,18,'#d89a73');ctx.fillStyle='#201923';ctx.beginPath();ctx.moveTo(-16,-38);ctx.quadraticCurveTo(-10,-55,10,-50);ctx.lineTo(17,-38);ctx.lineTo(9,-42);ctx.lineTo(-3,-48);ctx.fill();rect(-4,-30,3,2,'#201923');
 // sword
 ctx.save();ctx.rotate(player.atk>0?-1.05:0.7);ctx.fillStyle='#d9dbcf';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(55,-5);ctx.lineTo(62,0);ctx.lineTo(55,5);ctx.lineTo(12,5);ctx.closePath();ctx.fill();rect(7,-3,9,8,'#d5ad63');ctx.restore();ctx.restore()
}
function drawEnemies(){for(const e of enemies){if(e.dead)continue;ctx.save();ctx.translate(e.x-camera,e.y);ctx.scale(e.dir,1);if(e.hit>0)ctx.globalAlpha=.7;
 if(e.type==='brute'){ellipse(0,35,25,8,'#0c0b10');ctx.fillStyle='#583d50';ctx.beginPath();ctx.moveTo(-20,-25);ctx.lineTo(-28,38);ctx.lineTo(24,38);ctx.lineTo(18,-25);ctx.fill();ellipse(0,-20,21,18,'#846475');ctx.fillStyle='#1d171d';ctx.beginPath();ctx.moveTo(-18,-30);ctx.lineTo(-11,-43);ctx.lineTo(-4,-32);ctx.lineTo(6,-43);ctx.lineTo(20,-28);ctx.fill();rect(17,-5,8,35,'#b08a57')}else{ellipse(0,36,18,6,'#0c0b10');ctx.fillStyle='#7b3a39';ctx.beginPath();ctx.moveTo(-14,-18);ctx.lineTo(-18,35);ctx.lineTo(18,35);ctx.lineTo(13,-18);ctx.fill();ellipse(0,-18,14,15,'#9d6858');ctx.fillStyle='#d0aa70';ctx.beginPath();ctx.moveTo(-13,-20);ctx.lineTo(-8,-34);ctx.lineTo(0,-24);ctx.lineTo(9,-34);ctx.lineTo(15,-19);ctx.fill();rect(-19,-5,8,30,'#9a744c')}
 ctx.restore();drawBar(e.x-camera,e.y-55,e.hp/e.maxHp,44)}
}
function drawBoss(){if(!boss||boss.dead&&stageClear)return;ctx.save();ctx.translate(boss.x-camera,boss.y);ctx.scale(boss.dir,1);if(boss.hit>0)ctx.globalAlpha=.7;
 ellipse(0,55,80,14,'#0c0b10');ctx.fillStyle='#553a3d';ctx.beginPath();ctx.moveTo(-55,20);ctx.quadraticCurveTo(-100,-20,-75,-70);ctx.quadraticCurveTo(-35,-15,-20,5);ctx.fill();ctx.fillStyle='#7d3b3c';ctx.beginPath();ctx.moveTo(-38,-20);ctx.quadraticCurveTo(-15,-75,50,-55);ctx.quadraticCurveTo(90,-20,55,25);ctx.quadraticCurveTo(10,55,-38,20);ctx.fill();
 // wings
 ctx.fillStyle='#4a2d38';ctx.beginPath();ctx.moveTo(-20,-20);ctx.quadraticCurveTo(-70,-100,-130,-82);ctx.quadraticCurveTo(-75,-18,-35,15);ctx.fill();ctx.fillStyle='#2d232f';ctx.beginPath();ctx.moveTo(-25,-20);ctx.quadraticCurveTo(-85,-68,-118,-55);ctx.lineTo(-75,-34);ctx.fill();
 // head
 ctx.fillStyle='#8d4a43';ctx.beginPath();ctx.moveTo(42,-42);ctx.lineTo(76,-29);ctx.lineTo(68,-6);ctx.lineTo(35,-2);ctx.fill();ellipse(58,-38,24,22,'#9b5949');ctx.fillStyle='#efb54f';ctx.beginPath();ctx.moveTo(44,-45);ctx.lineTo(38,-62);ctx.lineTo(55,-48);ctx.fill();ctx.fillStyle='#f6ce69';ellipse(65,-38,3,3,'#f6ce69');ctx.restore();drawBar(boss.x-camera,boss.y-105,boss.hp/boss.maxHp,160)
}
function drawParticles(){for(const p of particles){if(p.type==='fire'){ctx.fillStyle=`rgba(255,${100+Math.floor(p.life*80)},40,.8)`;ellipse(p.x-camera,p.y,p.r,p.r,'rgba(255,111,43,.8)')}else{ctx.fillStyle=p.type==='coin'||p.type==='gold'?'#d7ad50':'#8e2732';ellipse(p.x-camera,p.y,p.r,p.r,ctx.fillStyle)}}}
function drawBar(x,y,pct,w){rect(x-w/2,y,w,5,'#17151a');rect(x-w/2,y,w*clamp(pct,0,1),5,pct<.35?'#dc5b3f':'#c69a50')}
function drawHUD(){ctx.fillStyle='rgba(17,13,19,.72)';ctx.beginPath();ctx.moveTo(30,20);ctx.lineTo(322,20);ctx.lineTo(342,38);ctx.lineTo(342,82);ctx.lineTo(30,82);ctx.closePath();ctx.fill();ctx.strokeStyle='#7e6547';ctx.lineWidth=1;ctx.stroke();ellipse(62,51,30,30,'#7d4639');ctx.fillStyle='#dfc07a';ctx.beginPath();ctx.moveTo(62,28);ctx.lineTo(72,52);ctx.lineTo(62,70);ctx.lineTo(52,52);ctx.fill();rect(100,35,180,10,'#1a151d');ctx.fillStyle='#bb573b';ctx.fillRect(100,35,180*player.hp/player.maxHp,10);rect(100,52,180,7,'#1a151d');ctx.fillStyle='#d3a94e';ctx.fillRect(100,52,180*player.stamina/player.maxStamina,7);
 ctx.textAlign='right';ctx.fillStyle='#d6c29a';ctx.font='900 14px Trebuchet MS';ctx.fillText('ASHES  '+String(coins).padStart(3,'0'),930,42);ctx.fillStyle='#8c7a62';ctx.font='11px Trebuchet MS';ctx.fillText(stageClear?'REALM SAVED':'THE ASHEN KEEP',930,62);}
function drawDeath(){ctx.fillStyle='rgba(12,8,12,.78)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#c6a565';ctx.textAlign='center';ctx.font='700 54px Georgia';ctx.fillText('YOU HAVE FALLEN',W/2,H/2-20);ctx.font='16px Trebuchet MS';ctx.fillStyle='#aa9a82';ctx.fillText('Press J or tap Attack to rise again',W/2,H/2+28);}
function drawVictory(){ctx.fillStyle='rgba(12,8,12,.58)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e1c27a';ctx.textAlign='center';ctx.font='700 52px Georgia';ctx.fillText('THE DRAGON IS VANQUISHED',W/2,H/2-20);ctx.font='16px Trebuchet MS';ctx.fillStyle='#f1dfb1';ctx.fillText('The Ashen Realm is free',W/2,H/2+28)}
canvas.addEventListener('pointerdown',e=>{if(state==='playing')attack()});
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(state==='playing')update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
