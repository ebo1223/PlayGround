const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const mini=document.getElementById('minimap'),mctx=mini.getContext('2d');
let W,H,DPR;function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
const TAU=Math.PI*2,keys={};let started=false,paused=false,last=0,shake=0,time=0;
const world={w:2600,h:1800};
const player={x:650,y:900,vx:0,vy:0,a:-Math.PI/2,hp:100,crew:100,gold:0,rum:0,parts:0,cool:0,inv:0};
const islands=[{x:650,y:900,r:210,name:'Driftwood Cay'},{x:1450,y:520,r:260,name:'Skull Island'},{x:2050,y:1260,r:230,name:'Crimson Isle'},{x:1050,y:1450,r:155,name:'Rum Reef'}];
const palms=[...Array(55)].map((_,i)=>{let isl=islands[i%islands.length];let ang=(i*2.399+isl.x*.01),rad=(isl.r*.25)+(i*37%(isl.r*.65));return{x:isl.x+Math.cos(ang)*rad,y:isl.y+Math.sin(ang)*rad,s:.7+(i%5)*.12}});
const rocks=[...Array(90)].map((_,i)=>({x:(i*367)%world.w,y:(i*571)%world.h,r:5+(i*7)%15,ang:i*.8}));
const treasures=[{x:1490,y:470,taken:false},{x:2050,y:1160,taken:false},{x:1050,y:1420,taken:false}];
let enemies=[],bullets=[],particles=[],wake=[];
function spawnEnemies(){enemies=[];for(let i=0;i<7;i++){let a=i*1.7+1;enemies.push({x:900+i*210,y:400+(i%3)*370,a:a,vx:0,vy:0,hp:3,cool:i*.7,shoot:0,rot:a})}}spawnEnemies();
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'){keys.space=true;e.preventDefault()}if(e.key.toLowerCase()==='e')interact()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.code==='Space')keys.space=false});
function bindDir(el,key){
 let set=v=>keys[key]=v;
 el.addEventListener('pointerdown',e=>{e.preventDefault();set(true);el.setPointerCapture(e.pointerId)});
 el.addEventListener('pointerup',()=>set(false));
 el.addEventListener('pointercancel',()=>set(false));
 el.addEventListener('pointerleave',()=>set(false));
}
document.querySelectorAll('[data-key]').forEach(el=>bindDir(el,el.dataset.key));
document.getElementById('fire').addEventListener('pointerdown',()=>keys.space=true);document.getElementById('fire').addEventListener('pointerup',()=>keys.space=false);
document.getElementById('startBtn').onclick=()=>{document.getElementById('start').classList.add('hidden');started=true};
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function insideIsland(x,y,pad=0){for(const i of islands)if(Math.hypot(x-i.x,y-i.y)<i.r-pad)return i;return null}
function toast(t){let e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function interact(){if(!started)return;for(const t of treasures){if(!t.taken&&dist(player,t)<90){t.taken=true;player.gold+=120;toast('Treasure claimed! +120 gold');return}}for(const r of islands){if(dist(player,r)<r.r+75){player.crew=Math.min(100,player.crew+20);toast('Crew supplies restored')}}}
function shoot(owner,ang){bullets.push({x:owner.x+Math.cos(ang)*32,y:owner.y+Math.sin(ang)*32,vx:Math.cos(ang)*420,vy:Math.sin(ang)*420,life:1.8,enemy:owner!==player});}
function update(dt){if(!started)return;time+=dt;player.cool-=dt;player.inv-=dt;
 let ax=(keys.d||keys.right?1:0)-(keys.a||keys.left?1:0),ay=(keys.s||keys.down?1:0)-(keys.w||keys.up?1:0);
 if(ax||ay){let des=Math.atan2(ay,ax);let diff=Math.atan2(Math.sin(des-player.a),Math.cos(des-player.a));player.a+=diff*Math.min(1,dt*4);player.vx+=Math.cos(player.a)*180*dt;player.vy+=Math.sin(player.a)*180*dt}
 let sp=Math.hypot(player.vx,player.vy);if(sp>150){player.vx*=150/sp;player.vy*=150/sp}player.vx*=Math.pow(.985,dt*60);player.vy*=Math.pow(.985,dt*60);
 if(keys.space&&player.cool<=0){player.cool=.38;shoot(player,player.a);shake=2}
 let nx=player.x+player.vx*dt,ny=player.y+player.vy*dt;if(!insideIsland(nx,ny,18)){player.x=nx;player.y=ny}else{player.vx*=-.25;player.vy*=-.25}
 player.x=Math.max(40,Math.min(world.w-40,player.x));player.y=Math.max(40,Math.min(world.h-40,player.y));
 if((Math.abs(player.vx)+Math.abs(player.vy)>15)&&Math.random()<.35)wake.push({x:player.x-Math.cos(player.a)*25,y:player.y-Math.sin(player.a)*25,r:2,a:Math.atan2(player.vy,player.vx),life:1});
 for(const e of enemies){if(e.hp<=0)continue;e.cool-=dt;let d=dist(e,player);if(d<650){let des=Math.atan2(player.y-e.y,player.x-e.x);let diff=Math.atan2(Math.sin(des-e.a),Math.cos(des-e.a));e.a+=diff*Math.min(1,dt*.8);e.vx+=Math.cos(e.a)*55*dt;e.vy+=Math.sin(e.a)*55*dt}else{e.a+=Math.sin(time*.3+e.x)*dt*.2}let es=Math.hypot(e.vx,e.vy);if(es>80){e.vx*=80/es;e.vy*=80/es}e.x+=e.vx*dt;e.y+=e.vy*dt;if(insideIsland(e.x,e.y,10)){e.vx*=-.5;e.vy*=-.5}if(d<480&&e.cool<=0){e.cool=2+Math.random()*1.5;shoot(e,e.a)}}
 for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.enemy&&dist(b,player)<22&&player.inv<=0){player.hp-=12;player.inv=.6;shake=8;b.life=0;if(player.hp<=0){player.hp=100;player.x=650;player.y=900;toast('The crew recovered you')}}else if(!b.enemy){for(const e of enemies)if(e.hp>0&&dist(b,e)<25){e.hp--;b.life=0;shake=3;if(e.hp<=0){player.gold+=35;player.rum+=1;toast('Enemy captain defeated! +35 gold')}}}}
 bullets=bullets.filter(b=>b.life>0&&b.x>0&&b.y>0&&b.x<world.w&&b.y<world.h);wake.forEach(w=>w.life-=dt*.5);wake=wake.filter(w=>w.life>0);
 for(const t of treasures)if(!t.taken&&dist(player,t)<70){}
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)particles.splice(i,i+1)}
 document.getElementById('hpBar').style.width=player.hp+'%';document.getElementById('crewBar').style.width=player.crew+'%';document.getElementById('hpText').textContent=Math.ceil(player.hp);document.getElementById('crewText').textContent=Math.ceil(player.crew);document.getElementById('gold').textContent=player.gold;document.getElementById('rum').textContent=player.rum;document.getElementById('parts').textContent=player.parts;
 let count=treasures.filter(t=>t.taken).length;document.getElementById('questTitle').textContent=count>=3?'Return to Driftwood Cay':'Find the Sunken Treasure';document.getElementById('questText').textContent=count>=3?'The legendary treasure is yours!':'Explore the islands — '+count+'/3 treasures found';
 if(count===3&&dist(player,{x:650,y:900})<220&&!paused){paused=true;toast('VICTORY! Archipelago Conquered');}}
function drawShip(x,y,a,enemy=false){ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);if(enemy){ctx.fillStyle='#ede0c1'}else ctx.fillStyle='#d8b77d';ctx.strokeStyle='#503822';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-27);ctx.bezierCurveTo(-17,-10,-17,19,0,30);ctx.quadraticCurveTo(17,19,17,-10);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=enemy?'#4d2d28':'#62452d';ctx.fillRect(-15,-8,30,36);ctx.fillStyle='#2b4e4c';ctx.fillRect(-13,11,26,8);ctx.fillStyle='#171c1c';ctx.beginPath();ctx.arc(-8,-2,3,0,TAU);ctx.arc(8,-2,3,0,TAU);ctx.fill();ctx.strokeStyle='#4a3928';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,-57);ctx.stroke();ctx.fillStyle=enemy?'#6d2928':'#d9d0ae';ctx.beginPath();ctx.moveTo(2,-52);ctx.quadraticCurveTo(23,-40,18,-20);ctx.lineTo(2,-20);ctx.fill();ctx.restore()}
function draw(){ctx.clearRect(0,0,W,H);ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.86;if(shake<.2)shake=0}
 const camX=started?Math.max(W/2,Math.min(world.w-W/2,player.x)):world.w*.36,camY=started?Math.max(H/2,Math.min(world.h-H/2,player.y)):world.h*.5;ctx.translate(W/2-camX,H/2-camY);
 // sea
 ctx.fillStyle='#397f80';ctx.fillRect(0,0,world.w,world.h);
 ctx.strokeStyle='rgba(188,225,207,.16)';ctx.lineWidth=2;for(let y=-100;y<world.h;y+=34){ctx.beginPath();for(let x=-100;x<world.w;x+=18){let yy=y+Math.sin(x*.025+time*1.2+y*.02)*4;if(x===-100)ctx.moveTo(x,yy);else ctx.lineTo(x,yy)}ctx.stroke()} 
 // islands
 islands.forEach((isl,idx)=>{ctx.beginPath();ctx.arc(isl.x,isl.y,isl.r+15,0,TAU);ctx.fillStyle='rgba(235,210,155,.35)';ctx.fill();ctx.beginPath();ctx.arc(isl.x,isl.y,isl.r,0,TAU);ctx.fillStyle=idx===2?'#6d6947':'#747751';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#a7a45e';ctx.stroke();ctx.beginPath();ctx.arc(isl.x,isl.y,isl.r*.72,0,TAU);ctx.fillStyle='#9d965f';ctx.fill();});
 palms.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);ctx.fillStyle='#715b35';ctx.fillRect(-3,-4,6,18);ctx.translate(0,-2);for(let i=0;i<6;i++){ctx.rotate(TAU/6);ctx.fillStyle=i%2?'#66804a':'#527240';ctx.beginPath();ctx.ellipse(0,-10,5,17,-.5,0,TAU);ctx.fill()}ctx.restore()});
 rocks.forEach(r=>{ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.ang);ctx.fillStyle='#88836b';ctx.beginPath();ctx.moveTo(-r.r,0);ctx.lineTo(-r.r*.3,-r.r*.7);ctx.lineTo(r.r*.7,-r.r*.3);ctx.lineTo(r.r,3);ctx.lineTo(r.r*.2,r.r*.6);ctx.closePath();ctx.fill();ctx.restore()});
 treasures.forEach(t=>{if(t.taken)return;ctx.save();ctx.translate(t.x,t.y);ctx.fillStyle='rgba(244,190,67,.18)';ctx.beginPath();ctx.arc(0,0,32+Math.sin(time*3)*3,0,TAU);ctx.fill();ctx.fillStyle='#c58b32';ctx.fillRect(-18,-12,36,24);ctx.strokeStyle='#68431f';ctx.lineWidth=3;ctx.strokeRect(-18,-12,36,24);ctx.fillStyle='#f6d66f';ctx.beginPath();ctx.arc(0,-12,5,0,TAU);ctx.fill();ctx.restore()});
 wake.forEach(w=>{ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.a);ctx.strokeStyle=`rgba(225,242,220,${w.life*.45})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,13*w.life,5,0,0,TAU);ctx.stroke();ctx.restore()});
 bullets.forEach(b=>{ctx.fillStyle=b.enemy?'#4a1c1b':'#ffcf63';ctx.beginPath();ctx.arc(b.x,b.y,4,0,TAU);ctx.fill();ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=7;ctx.fill();ctx.shadowBlur=0});
 enemies.forEach(e=>{if(e.hp>0)drawShip(e.x,e.y,e.a,true)});drawShip(player.x,player.y,player.a,false);
 ctx.restore();drawMinimap();}
function drawMinimap(){mctx.clearRect(0,0,180,180);mctx.fillStyle='#397f80';mctx.fillRect(0,0,180,180);for(const i of islands){mctx.beginPath();mctx.arc(i.x/world.w*180,i.y/world.h*180,i.r/world.w*180,0,TAU);mctx.fillStyle='#aaa261';mctx.fill()}for(const e of enemies)if(e.hp>0){mctx.fillStyle='#bc4b3d';mctx.beginPath();mctx.arc(e.x/world.w*180,e.y/world.h*180,3,0,TAU);mctx.fill()}for(const t of treasures)if(!t.taken){mctx.fillStyle='#ffe28a';mctx.fillRect(t.x/world.w*180-3,t.y/world.h*180-3,6,6)}mctx.save();mctx.translate(player.x/world.w*180,player.y/world.h*180);mctx.rotate(player.a+Math.PI/2);mctx.fillStyle='#fff3ba';mctx.beginPath();mctx.moveTo(0,-7);mctx.lineTo(5,6);mctx.lineTo(-5,6);mctx.closePath();mctx.fill();mctx.restore()}
function loop(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);