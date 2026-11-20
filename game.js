const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,dpr,playing=false,last=0,crystals=0,distance=0,health=100,boost=100;
const keys={};let ship={x:0,y:0,vx:0,vy:0,a:-Math.PI/2,r:14,inv:0};
const stars=[],dust=[],asteroids=[],gems=[],gates=[];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(!ship.x){ship.x=W/2;ship.y=H*.58}}
addEventListener('resize',resize);resize();
for(let i=0;i<260;i++)stars.push({x:Math.random()*2000,y:Math.random()*1200,z:Math.random()*1+.2,s:Math.random()*1.4+.2});
for(let i=0;i<70;i++)dust.push({x:Math.random()*2000,y:Math.random()*1200,r:Math.random()*2+0.3,a:Math.random()*.15});
function rand(){return {x:Math.random()*W,y:-80-Math.random()*H*.8,r:18+Math.random()*38,spin:Math.random()*6,v:20+Math.random()*28,hit:false}}
for(let i=0;i<12;i++)asteroids.push(rand());for(let i=0;i<8;i++)gems.push({x:Math.random()*W,y:-100-Math.random()*900,r:7,spin:Math.random()*6,v:26+Math.random()*18});
function reset(){crystals=0;distance=0;health=100;boost=100;ship={x:W/2,y:H*.58,vx:0,vy:0,a:-Math.PI/2,r:14,inv:0};asteroids.length=0;gems.length=0;gates.length=[];for(let i=0;i<12;i++)asteroids.push(rand());for(let i=0;i<8;i++)gems.push({x:Math.random()*W,y:-100-Math.random()*900,r:7,spin:Math.random()*6,v:26+Math.random()*18});updateHud()}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLower()]=false);
canvas.addEventListener('pointermove',e=>{if(playing){const dx=e.clientX-ship.x,dy=e.clientY-ship.y;if(Math.hypot(dx,dy)>12){ship.vx+=dx*.012;ship.vy+=dy*.012}}});
function updateHud(){document.getElementById('crystals').textContent=crystals;document.getElementById('distance').textContent=Math.floor(distance);document.getElementById('healthBar').style.width=Math.max(0,health)+'%';document.querySelectorAll('#boostBars i').forEach((e,i)=>e.classList.toggle('off',i>=Math.ceil(boost/20)))}
function spawnGem(){gems.push({x:50+Math.random()*(W-100),y:-30,r:7,spin:Math.random()*6,v:28+Math.random()*18})}
function endGame(){playing=false;document.getElementById('overTitle').innerHTML='SIGNAL<br><em>LOST</em>';document.getElementById('overText').textContent=`Distance: ${Math.floor(distance)} LY  •  Crystals: ${crystals}`;document.getElementById('gameOver').classList.remove('hidden')}
function winGame(){playing=false;document.getElementById('overTitle').innerHTML='SECTOR<br><em>DISCOVERED</em>';document.getElementById('overText').textContent=`You found the Orion jump gate with ${crystals} crystals.`;document.getElementById('gameOver').classList.remove('hidden')}
document.getElementById('startBtn').onclick=()=>{document.getElementById('start').classList.add('hidden');reset();playing=true;last=performance.now()};document.getElementById('againBtn').onclick=()=>{document.getElementById('gameOver').classList.add('hidden');reset();playing=true;last=performance.now()};
function update(dt){
 const left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright,up=keys.w||keys.arrowup,down=keys.s||keys.arrowdown;let ax=(right?1:0)-(left?1:0),ay=(down?1:0)-(up?1:0);const boosting=(keys.shift||keys[' '])&&boost>1&&playing;
 if(ax||ay){const l=Math.hypot(ax,ay);ax/=l;ay/=l;const power=boosting?420:260;ship.vx+=ax*power*dt;ship.vy+=ay*power*dt;if(boosting)boost-=30*dt}else{ship.vx*=Math.pow(.16,dt);ship.vy*=Math.pow(.16,dt)}
 if(!boosting)boost=Math.min(100,boost+8*dt);const max=boosting?260:170,s=Math.hypot(ship.vx,ship.vy);if(s>max){ship.vx*=max/s;ship.vy*=max/s}
 ship.x+=ship.vx*dt;ship.y+=ship.vy*dt;ship.x=Math.max(28,Math.min(W-28,ship.x));ship.y=Math.max(85,Math.min(H-75,ship.y));if(s>5)ship.a=Math.atan2(ship.vy,ship.vx)+Math.PI/2;if(ship.inv>0)ship.inv-=dt;
 distance+=dt*(16+speedShip()/170*3);document.getElementById('status').textContent=distance>65?'JUMP GATE DETECTED':'SCANNING SECTOR...';
 if(distance>65&&gates.length===0)gates.push({x:W/2,y:-180,r:38,active:false});
 for(const a of asteroids){a.y+=a.v*dt;a.spin+=dt*.35;if(a.y>aH()+80||a.y>H+80){Object.assign(a,rand());a.y=-50-Math.random()*300}if(Math.hypot(a.x-ship.x,a.y-ship.y)<a.r*.65+ship.r&&ship.inv<=0){health-=18;ship.inv=1.2;ship.vx*=-.7;ship.vy*=-.7}}
 for(let i=gems.length-1;i>=0;i--){const g=gems[i];g.y+=g.v*dt;g.spin+=dt*2;if(g.y>H+30)gems.splice(i,1);else if(Math.hypot(g.x-ship.x,g.y-ship.y)<20){crystals++;gems.splice(i,1);spawnGem()}}
 for(const g of gates){g.y+=22*dt;if(Math.hypot(g.x-ship.x,g.y-ship.y)<55)winGame()}
 if(Math.random()<dt*.8)spawnGem();if(health<=0)endGame();updateHud();
}
function aH(){return H}function speedShip(){return Math.hypot(ship.vx,ship.vy)}
function drawBackground(t){ctx.fillStyle='#050912';ctx.fillRect(0,0,W,H);
 // nebula
 let g=ctx.createRadialGradient(W*.72,H*.38,20,W*.72,H*.38,H*.65);g.addColorStop(0,'rgba(41,91,105,.24)');g.addColorStop(.45,'rgba(21,48,67,.12)');g.addColorStop(1,'rgba(5,9,18,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 g=ctx.createRadialGradient(W*.18,H*.72,10,W*.18,H*.72,H*.45);g.addColorStop(0,'rgba(31,74,83,.16)');g.addColorStop(1,'rgba(5,9,18,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(const s of stars){let x=(s.x-t*speedShip()*.002*0.15)%2000;if(x<0)x+=2000;if(x>W)x-=2000;let y=(s.y+t*(speedShip()*0.04+s.z*3))%1200;if(y>H)y-=1200;ctx.globalAlpha=.25+s.z*.55;ctx.fillStyle=s.z>.9?'#bdeaf1':'#73909b';ctx.fillRect(x,y,s.s,s.s)}ctx.globalAlpha=1;
 // distant planet
 ctx.save();ctx.translate(W*.78,H*.22);ctx.globalAlpha=.75;let pg=ctx.createRadialGradient(-35,-25,5,-10,-10,115);pg.addColorStop(0,'#86a4a3');pg.addColorStop(.3,'#496869');pg.addColorStop(.72,'#17292e');pg.addColorStop(1,'#081017');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(0,0,88,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(-110,12,88,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.restore();
 // dust cloud
 ctx.fillStyle='rgba(87,145,151,.025)';for(const d of dust){ctx.beginPath();ctx.arc((d.x+t*.002)%W,(d.y+t*.006)%H,d.r,0,7);ctx.fill()}
}
function drawAsteroid(a){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.spin);ctx.beginPath();for(let i=0;i<9;i++){let ang=i/9*Math.PI*2,r=a.r*(.82+((i*7)%5)*.055);let x=Math.cos(ang)*r,y=Math.sin(ang)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();let g=ctx.createRadialGradient(-a.r*.3,-a.r*.35,2,0,0,a.r);g.addColorStop(0,'#7a8584');g.addColorStop(.35,'#39484a');g.addColorStop(1,'#11191d');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(170,205,204,.12)';ctx.stroke();ctx.fillStyle='rgba(10,20,22,.45)';ctx.beginPath();ctx.arc(-a.r*.18,a.r*.12,a.r*.12,0,7);ctx.fill();ctx.restore()}
function drawGem(g){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.spin);ctx.shadowColor='#74f4ce';ctx.shadowBlur=18;ctx.fillStyle='#99f9d5';ctx.beginPath();ctx.moveTo(0,-g.r);ctx.lineTo(g.r*.7,0);ctx.lineTo(0,g.r);ctx.lineTo(-g.r*.7,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#d7fff0';ctx.stroke();ctx.restore()}
function drawGate(g,t){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(t*.0005);ctx.strokeStyle='rgba(115,230,239,.8)';ctx.lineWidth=2;ctx.shadowColor='#73e6ef';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,0,g.r,0,7);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,g.r-9,0,7);ctx.stroke();ctx.rotate(-t*.001);ctx.setLineDash([4,11]);ctx.beginPath();ctx.arc(0,0,g.r+12,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
function drawShip(t){ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.a);if(ship.inv>0&&Math.floor(t/70)%2)return ctx.restore();ctx.shadowColor='rgba(102,225,232,.35)';ctx.shadowBlur=12;
 // thruster
 ctx.fillStyle='rgba(92,224,220,.7)';ctx.beginPath();ctx.moveTo(-5,14);ctx.lineTo(0,34+Math.sin(t*.02)*5);ctx.lineTo(5,14);ctx.fill();ctx.fillStyle='#d8ffff';ctx.beginPath();ctx.moveTo(-2,13);ctx.lineTo(0,24);ctx.lineTo(2,13);ctx.fill();
 ctx.fillStyle='#b8ccd0';ctx.strokeStyle='#dff8f5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(9,-5);ctx.lineTo(20,11);ctx.lineTo(5,7);ctx.lineTo(0,14);ctx.lineTo(-5,7);ctx.lineTo(-20,11);ctx.lineTo(-9,-5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#26383e';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(5,-3);ctx.lineTo(0,4);ctx.lineTo(-5,-3);ctx.closePath();ctx.fill();ctx.restore()}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;drawBackground(t);if(playing)update(dt);for(const a of asteroids)drawAsteroid(a);for(const g of gems)drawGem(g);for(const g of gates)drawGate(g,t);drawShip(t);requestAnimationFrame(loop)}requestAnimationFrame(loop);
