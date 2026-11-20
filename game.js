(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const mapCanvas = document.getElementById('mapCanvas');
  const mapCtx = mapCanvas.getContext('2d');
  const W = 960, H = 600;
  const keys = new Set();
  const pointer = { x: 480, y: 300, down: false, touchStart: null, touchMove: null };
  const ui = {
    start: document.getElementById('startModal'), end: document.getElementById('endModal'), begin: document.getElementById('beginHunt'), restart: document.getElementById('restartHunt'),
    pause: document.getElementById('pauseButton'), health: document.getElementById('healthFill'), healthText: document.getElementById('healthText'), stamina: document.getElementById('staminaFill'),
    boss: document.getElementById('bossFill'), phase: document.getElementById('bossPhase'), behavior: document.getElementById('behaviorText'), potion: document.getElementById('potionCount'),
    clock: document.getElementById('clock'), progress: document.getElementById('progressFill'), percent: document.getElementById('progressPercent'), message: document.getElementById('centerMessage'),
    tip: document.getElementById('controlTip'), sound: document.getElementById('soundToggle')
  };
  let game = { active:false, paused:false, ended:false, won:false, elapsed:0, potions:3, potionUsed:0, messageTime:0, sound:true, last:0, shake:0, particles:[], decals:[], flash:0 };
  const player = { x:480,y:435,vx:0,vy:0,r:14,hp:100,stamina:100,face:-Math.PI/2,attack:0,attackCd:0,attackHit:false,dodge:0,dodgeCd:0,invuln:0,tonic:0,hurt:0 };
  const beast = { x:480,y:213,vx:0,vy:0,r:34,hp:1000,maxHp:1000,state:'stalk',timer:1.6,face:Math.PI/2,hitFlash:0,attackCount:0,phase:1,roar:0 };
  const decor = [];
  let audio;

  function seeded(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
  function initDecor(){
    for(let i=0;i<140;i++){let a=seeded(i+4)*Math.PI*2,r=270+seeded(i+80)*260;decor.push({x:480+Math.cos(a)*r,y:300+Math.sin(a)*r,kind:i%5,scale:.55+seeded(i+120)*1.15,rot:seeded(i+180)*6.28,alpha:.35+seeded(i+260)*.45})}
    for(let i=0;i<32;i++)game.decals.push({x:100+seeded(i+420)*760,y:80+seeded(i+510)*440,r:2+seeded(i+600)*9,rot:seeded(i+700)*6.28})
  }
  initDecor();
  function audioTone(freq=240,dur=.08,type='sine',vol=.035){
    if(!game.sound)return;
    try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch(e){}
  }
  function setMessage(text,seconds=1.6){ui.message.textContent=text;ui.message.classList.add('visible');game.messageTime=seconds}
  function begin(){reset();game.active=true;game.paused=false;game.ended=false;ui.start.classList.add('hidden');ui.end.classList.add('hidden');ui.tip.style.display='';setMessage('THE HUNT BEGINS',1.8);audioTone(330,.12,'triangle',.04)}
  function reset(){Object.assign(player,{x:480,y:435,vx:0,vy:0,hp:100,stamina:100,face:-Math.PI/2,attack:0,attackCd:0,attackHit:false,dodge:0,dodgeCd:0,invuln:0,tonic:0,hurt:0});Object.assign(beast,{x:480,y:213,vx:0,vy:0,hp:1000,state:'stalk',timer:1.5,face:Math.PI/2,hitFlash:0,attackCount:0,phase:1,roar:0});Object.assign(game,{elapsed:0,potions:3,potionUsed:0,messageTime:0,shake:0,particles:[],flash:0});ui.potion.textContent='3';ui.clock.textContent='00:00';ui.progress.style.width='0%';ui.percent.textContent='0%';ui.health.style.width='100%';ui.healthText.textContent='100 / 100';ui.stamina.style.width='100%';ui.boss.style.width='100%';ui.behavior.textContent='Stalking';ui.phase.textContent='STALKING';ui.tip.style.display='';}
  function togglePause(){if(!game.active||game.ended)return;game.paused=!game.paused;ui.pause.textContent=game.paused?'▶':'Ⅱ';setMessage(game.paused?'HUNT PAUSED':'',game.paused?99:.01)}
  function end(won){game.ended=true;game.active=false;game.won=won;game.paused=false;document.getElementById('endEyebrow').textContent=won?'THE HUNT IS WON':'THE HUNT IS LOST';document.getElementById('endTitle').innerHTML=won?'A legend<br><em>remembered.</em>':'The wilds<br><em>remain.</em>';document.getElementById('endCopy').textContent=won?'The Gloamwood grows quiet. The Guild will hear of this.':'The forest keeps its secrets. Regroup, hunter, and try again.';document.getElementById('resultTime').textContent=formatTime(game.elapsed);document.getElementById('resultPotions').textContent=game.potionUsed;document.getElementById('resultReward').textContent=won?`${Math.max(180,480-Math.floor(game.elapsed/12)*5)} G`:'—';ui.end.classList.remove('hidden');ui.pause.textContent='Ⅱ';audioTone(won?523:110,.35,'triangle',.05)}
  function formatTime(s){let m=Math.floor(s/60),sec=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
  function getCanvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
  function attack(){if(!game.active||game.paused||game.ended||player.attackCd>0||player.stamina<9)return;player.attack=.36;player.attackCd=.47;player.attackHit=false;player.stamina=Math.max(0,player.stamina-9);audioTone(185,.06,'sawtooth',.018)}
  function dodge(){if(!game.active||game.paused||game.ended||player.dodgeCd>0||player.stamina<24)return;let dx=(keys.has('d')?1:0)-(keys.has('a')?1:0),dy=(keys.has('s')?1:0)-(keys.has('w')?1:0);if(pointer.touchMove){dx=pointer.touchMove.x;dy=pointer.touchMove.y}if(!dx&&!dy){dx=Math.cos(player.face);dy=Math.sin(player.face)}let l=Math.hypot(dx,dy)||1;player.vx=dx/l*410;player.vy=dy/l*410;player.dodge=.24;player.dodgeCd=.8;player.invuln=.48;player.stamina-=24;audioTone(420,.09,'triangle',.03);for(let i=0;i<7;i++)spawnParticle(player.x,player.y,'#c7cead',.6)}
  function heal(){if(!game.active||game.paused||game.ended||game.potions<=0||player.hp>=100)return;game.potions--;game.potionUsed++;player.hp=Math.min(100,player.hp+38);player.tonic=.7;ui.potion.textContent=game.potions;setMessage('VITALITY RESTORED',.8);audioTone(640,.16,'sine',.04)}
  function startAttackFromPointer(){const p=getCanvasPoint({clientX:event.clientX,clientY:event.clientY});pointer.x=p.x;pointer.y=p.y;player.face=Math.atan2(p.y-player.y,p.x-player.x);attack()}
  function spawnParticle(x,y,color,life=.4){game.particles.push({x,y,vx:(Math.random()-.5)*140,vy:(Math.random()-.5)*130,life,max:life,r:2+Math.random()*3,color})}

  function update(dt){
    if(!game.active||game.paused||game.ended)return;
    game.elapsed+=dt;game.shake=Math.max(0,game.shake-dt*18);game.flash=Math.max(0,game.flash-dt*2.7);
    if(game.messageTime>0){game.messageTime-=dt;if(game.messageTime<=0)ui.message.classList.remove('visible')}
    player.attackCd=Math.max(0,player.attackCd-dt);player.attack=Math.max(0,player.attack-dt);player.dodgeCd=Math.max(0,player.dodgeCd-dt);player.dodge=Math.max(0,player.dodge-dt);player.invuln=Math.max(0,player.invuln-dt);player.tonic=Math.max(0,player.tonic-dt);player.hurt=Math.max(0,player.hurt-dt);
    player.stamina=Math.min(100,player.stamina+dt*(player.dodge>0?0:14));
    let dx=(keys.has('d')?1:0)-(keys.has('a')?1:0),dy=(keys.has('s')?1:0)-(keys.has('w')?1:0);
    if(pointer.touchMove){dx=pointer.touchMove.x;dy=pointer.touchMove.y}
    let len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}
    if(player.dodge<=0){const speed=178;player.vx+=(dx*speed-player.vx)*Math.min(1,dt*12);player.vy+=(dy*speed-player.vy)*Math.min(1,dt*12)}
    player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=Math.max(42,Math.min(W-42,player.x));player.y=Math.max(66,Math.min(H-42,player.y));
    if(!pointer.down&&len>0.1&&player.attack<=0)player.face=Math.atan2(dy,dx);
    if(player.attack>0&&!player.attackHit&&player.attack<.25){const d=Math.hypot(beast.x-player.x,beast.y-player.y),a=Math.atan2(beast.y-player.y,beast.x-player.x),ad=Math.abs(angleDelta(a,player.face));if(d<77&&ad<1.38){let dmg=95+(Math.random()*25|0);if(beast.state==='recover'||beast.state==='stagger')dmg*=1.38;beast.hp=Math.max(0,beast.hp-dmg);beast.hitFlash=.14;beast.vx+=Math.cos(a)*75;beast.vy+=Math.sin(a)*75;player.attackHit=true;game.shake=5;audioTone(110,.07,'square',.03);for(let i=0;i<10;i++)spawnParticle(beast.x+Math.cos(a)*20,beast.y+Math.sin(a)*20,'#e1c276',.48);if(beast.hp<=0){end(true);return}}}
    updateBeast(dt);
    for(const p of game.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97}game.particles=game.particles.filter(p=>p.life>0);
    ui.health.style.width=`${player.hp}%`;ui.healthText.textContent=`${Math.ceil(player.hp)} / 100`;ui.stamina.style.width=`${player.stamina}%`;ui.boss.style.width=`${beast.hp/beast.maxHp*100}%`;const prog=Math.round((1-beast.hp/beast.maxHp)*100);ui.progress.style.width=`${prog}%`;ui.percent.textContent=`${prog}%`;ui.clock.textContent=formatTime(game.elapsed);
  }
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
  function updateBeast(dt){
    beast.timer-=dt;beast.hitFlash=Math.max(0,beast.hitFlash-dt);beast.roar=Math.max(0,beast.roar-dt);
    const dx=player.x-beast.x,dy=player.y-beast.y,d=Math.hypot(dx,dy)||1;beast.face=Math.atan2(dy,dx);
    beast.phase=beast.hp<beast.maxHp*.5?2:1;
    if(beast.phase===2&&beast.state!=='roar'&&beast.state!=='charge'&&beast.state!=='recover'&&beast.state!=='stagger'){beast.state='roar';beast.timer=1.05;beast.roar=1.05;setMessage('THE MIRE FANG ENRAGES',1.2);game.shake=6}
    if(beast.state==='stalk'){
      ui.phase.textContent=beast.phase===2?'ENRAGED':'STALKING';ui.behavior.textContent=beast.phase===2?'Enraged':'Stalking';
      const speed=beast.phase===2?76:49;if(d>88){beast.vx+=(dx/d*speed-beast.vx)*dt*2;beast.vy+=(dy/d*speed-beast.vy)*dt*2}else{beast.vx*=.88;beast.vy*=.88}
      if(beast.timer<=0){beast.state='windup';beast.timer=beast.phase===2?.56:.78;beast.vx=beast.vy=0;setMessage('');ui.phase.textContent='WINDING UP';ui.behavior.textContent='Winding up';audioTone(120,.18,'sawtooth',.023)}
    } else if(beast.state==='windup'){
      beast.vx*=.9;beast.vy*=.9;ui.phase.textContent='TELEGRAPH';ui.behavior.textContent='Preparing a lunge';
      if(beast.timer<=0){beast.state='charge';beast.timer=.43;beast.attackCount++;let a=Math.atan2(player.y-beast.y,player.x-beast.x);beast.vx=Math.cos(a)*(beast.phase===2?405:335);beast.vy=Math.sin(a)*(beast.phase===2?405:335);ui.phase.textContent='LUNGING';ui.behavior.textContent='Lunging';audioTone(76,.24,'sawtooth',.045)}
    } else if(beast.state==='charge'){
      ui.phase.textContent='LUNGING';ui.behavior.textContent='Lunging';beast.vx*=Math.pow(.12,dt);beast.vy*=Math.pow(.12,dt);
      if(d<48&&player.invuln<=0){player.hp=Math.max(0,player.hp-(beast.phase===2?30:24));player.hurt=.32;player.invuln=.75;game.shake=10;game.flash=.35;setMessage('HIT! DODGE THE LUNGE',.8);audioTone(70,.25,'sawtooth',.06);if(player.hp<=0){end(false);return}}
      if(beast.timer<=0||beast.x<40||beast.x>W-40||beast.y<55||beast.y>H-40){beast.state='recover';beast.timer=beast.phase===2?.72:1.02;beast.vx*=.25;beast.vy*=.25;ui.phase.textContent='RECOVERING';ui.behavior.textContent='Recovering'}
    } else if(beast.state==='recover'){
      beast.vx*=.84;beast.vy*=.84;ui.phase.textContent='RECOVERING';ui.behavior.textContent='Open to attack!';if(beast.timer<=0){beast.state='stalk';beast.timer=beast.phase===2?.65:1.15}
    } else if(beast.state==='roar'){
      beast.vx=beast.vy=0;ui.phase.textContent='ENRAGED';ui.behavior.textContent='Enraging';if(beast.timer<=0){beast.state='stalk';beast.timer=.25;for(let i=0;i<18;i++)spawnParticle(beast.x,beast.y,'#c15e43',.65)}
    }
    beast.x+=beast.vx*dt;beast.y+=beast.vy*dt;beast.x=Math.max(37,Math.min(W-37,beast.x));beast.y=Math.max(70,Math.min(H-37,beast.y));
  }
  function draw(){ctx.clearRect(0,0,W,H);ctx.save();if(game.shake>0)ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);drawArena();drawDecor();drawGroundEffects();drawBeast();drawPlayer();drawParticles();ctx.restore();if(game.flash>0){ctx.fillStyle=`rgba(190,55,42,${game.flash*.32})`;ctx.fillRect(0,0,W,H)}drawMap()}
  function drawArena(){
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#304936');bg.addColorStop(.52,'#486448');bg.addColorStop(1,'#334a38');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // layered woodland silhouettes
    for(let i=0;i<15;i++){let x=i*76-28;let h=90+seeded(i+900)*100;ctx.fillStyle=i%2?'#253a2d':'#2a402f';ctx.beginPath();ctx.moveTo(x-33,0);ctx.lineTo(x+7,0);ctx.lineTo(x+14,h);ctx.lineTo(x-23,h+28);ctx.closePath();ctx.fill();ctx.fillStyle='#567050';ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(x+6,30,39,66,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
    const clearing=ctx.createRadialGradient(480,293,76,480,300,455);clearing.addColorStop(0,'#829367');clearing.addColorStop(.56,'#647b56');clearing.addColorStop(1,'#40583f');ctx.fillStyle=clearing;ctx.fillRect(0,0,W,H);
    // faint path and concentric hunting ground
    ctx.save();ctx.globalAlpha=.17;ctx.strokeStyle='#d5d5a5';ctx.lineWidth=1;ctx.setLineDash([2,8]);ctx.beginPath();ctx.ellipse(480,300,398,235,-.05,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    ctx.save();ctx.globalAlpha=.09;ctx.fillStyle='#d5d2a7';ctx.beginPath();ctx.ellipse(492,320,270,146,-.1,0,Math.PI*2);ctx.fill();ctx.restore();
    // dappled moonlight
    for(let i=0;i<20;i++){let x=seeded(i+2100)*W,y=seeded(i+2200)*H,r=22+seeded(i+2300)*38;let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(215,220,154,.10)');g.addColorStop(1,'rgba(215,220,154,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
  }
  function drawDecor(){
    for(const o of decor){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ctx.globalAlpha=o.alpha;
      if(o.kind===0||o.kind===1){ctx.fillStyle=o.kind?'#293e31':'#314b37';ctx.beginPath();ctx.ellipse(0,0,8*o.scale,18*o.scale,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#799069';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,13*o.scale);ctx.lineTo(0,-12*o.scale);ctx.stroke()}
      else if(o.kind===2){ctx.fillStyle='#7d8058';ctx.beginPath();ctx.ellipse(0,0,12*o.scale,6*o.scale,.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#abb17a';ctx.beginPath();ctx.ellipse(-3*o.scale,-2*o.scale,3*o.scale,1.3*o.scale,.5,0,Math.PI*2);ctx.fill()}
      else if(o.kind===3){ctx.strokeStyle='#394c32';ctx.lineWidth=3*o.scale;ctx.beginPath();ctx.moveTo(0,12*o.scale);ctx.quadraticCurveTo(-3*o.scale,1*o.scale,4*o.scale,-12*o.scale);ctx.stroke();ctx.fillStyle='#73875a';ctx.beginPath();ctx.ellipse(2*o.scale,-7*o.scale,7*o.scale,3*o.scale,-.6,0,Math.PI*2);ctx.fill()}
      else{ctx.fillStyle='#87916a';ctx.beginPath();ctx.ellipse(0,1*o.scale,8*o.scale,5*o.scale,.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c2bd81';ctx.beginPath();ctx.arc(4*o.scale,-2*o.scale,1.4*o.scale,0,Math.PI*2);ctx.fill()}
      ctx.restore()}
  }
  function drawGroundEffects(){
    for(const d of game.decals){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.strokeStyle='#303f2d';ctx.globalAlpha=.22;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-d.r,0);ctx.quadraticCurveTo(0,-d.r*.45,d.r,d.r*.2);ctx.stroke();ctx.restore()}
    // fireflies
    for(let i=0;i<13;i++){let t=game.elapsed*0.6+i*7.31,x=(seeded(i+3000)*W+Math.sin(t+i)*20),y=(seeded(i+3200)*H+Math.cos(t*1.3+i)*16);ctx.globalAlpha=.3+.3*Math.sin(game.elapsed*2+i);ctx.fillStyle='#d8d78a';ctx.shadowColor='#d6da8a';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(x,y,1.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}ctx.globalAlpha=1;
  }
  function drawBeast(){
    const b=beast;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.face);const enraged=b.phase===2;let bob=Math.sin(game.elapsed*5)*1.6;
    // telegraph warning underfoot
    if(b.state==='windup'){ctx.save();ctx.rotate(-b.face);let pulse=.75+.2*Math.sin(game.elapsed*18);ctx.strokeStyle=`rgba(204,70,50,${pulse})`;ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.ellipse(0,0,80,54,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
    if(b.state==='charge'){ctx.globalAlpha=.23;ctx.fillStyle='#d9674b';ctx.beginPath();ctx.ellipse(-27,0,40,26,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
    ctx.fillStyle='#26382a';ctx.beginPath();ctx.ellipse(-1,13,39,22,0,0,Math.PI*2);ctx.fill();
    // back limbs
    for(let side of [-1,1]){ctx.save();ctx.rotate(side*.38);ctx.fillStyle='#394a34';ctx.beginPath();ctx.ellipse(-18,side*23+bob,16,10,side*.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#28392c';ctx.beginPath();ctx.ellipse(-25,side*28+bob,11,7,side*.4,0,Math.PI*2);ctx.fill();ctx.restore()}
    // heavy briarback body
    let body=ctx.createLinearGradient(-18,-28,18,30);body.addColorStop(0,enraged?'#7b5541':'#647052');body.addColorStop(.48,enraged?'#704638':'#4c6245');body.addColorStop(1,'#303e32');ctx.fillStyle=b.hitFlash>0?'#ead9a5':body;ctx.beginPath();ctx.ellipse(0,0,35,27,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#819064';ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(-7,-8,20,11,-.15,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // rows of thorn spikes
    for(let i=0;i<7;i++){let x=-23+i*7,side=(i%2?1:-1);ctx.fillStyle=i%2?'#988353':'#b09a5e';ctx.beginPath();ctx.moveTo(x,-12);ctx.lineTo(x+3,-29-(i%3)*3);ctx.lineTo(x+8,-10);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x+2,27+(i%3)*2);ctx.lineTo(x+8,10);ctx.closePath();ctx.fill()}
    // neck and skull
    ctx.fillStyle=b.hitFlash>0?'#ead9a5':enraged?'#80503f':'#66704e';ctx.beginPath();ctx.ellipse(25,0,21,19,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8c7650';ctx.beginPath();ctx.ellipse(39,1,16,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#364235';ctx.beginPath();ctx.ellipse(46,5,10,7,0,0,Math.PI*2);ctx.fill();
    // eyes and horns
    ctx.fillStyle=enraged?'#f68c4d':'#e9cd75';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(32,-10,3.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#c2b17b';ctx.beginPath();ctx.moveTo(25,-12);ctx.lineTo(17,-26);ctx.lineTo(31,-16);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(27,12);ctx.lineTo(18,26);ctx.lineTo(34,16);ctx.closePath();ctx.fill();
    // front legs
    for(let side of [-1,1]){ctx.fillStyle='#344333';ctx.beginPath();ctx.ellipse(15,side*23,10,8,side*.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2d392e';ctx.beginPath();ctx.ellipse(21,side*27,9,5,side*.25,0,Math.PI*2);ctx.fill();for(let j=0;j<2;j++){ctx.strokeStyle='#b9a875';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(26,side*(25+j*3));ctx.lineTo(31,side*(26+j*3));ctx.stroke()}}
    ctx.restore();
  }
  function drawPlayer(){
    ctx.save();ctx.translate(player.x,player.y);const a=player.face;ctx.rotate(a);const inv=player.invuln>0;ctx.globalAlpha=inv&&Math.floor(game.elapsed*24)%2===0?.45:1;
    ctx.fillStyle='#26372b';ctx.beginPath();ctx.ellipse(0,8,14,9,0,0,Math.PI*2);ctx.fill();
    // hunter's cloak
    ctx.fillStyle=player.hurt>0?'#bd6250':'#526a4a';ctx.beginPath();ctx.moveTo(-12,-7);ctx.quadraticCurveTo(-18,4,-12,16);ctx.lineTo(0,11);ctx.lineTo(9,15);ctx.quadraticCurveTo(15,2,9,-8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#c6a575';ctx.beginPath();ctx.arc(0,-8,7.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3c4937';ctx.beginPath();ctx.arc(0,-11,8,Math.PI,Math.PI*2);ctx.lineTo(7,-9);ctx.lineTo(-7,-9);ctx.fill();
    // sword slash / blade
    if(player.attack>0){let prog=1-player.attack/.36;ctx.save();ctx.rotate(-.8+prog*1.55);ctx.strokeStyle='rgba(236,230,184,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,54,-.74,.74);ctx.stroke();ctx.restore()}
    ctx.strokeStyle='#d2d1bd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(7,1);ctx.lineTo(22,-3);ctx.stroke();ctx.strokeStyle='#8f825d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(7,-3);ctx.lineTo(8,5);ctx.stroke();ctx.restore();
    if(player.tonic>0){ctx.globalAlpha=player.tonic;ctx.strokeStyle='#d9e797';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,20+(1-player.tonic)*20,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  }
  function drawParticles(){for(const p of game.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  function drawMap(){const c=mapCtx,w=180,h=180;c.clearRect(0,0,w,h);c.fillStyle='#dce4d3';c.fillRect(0,0,w,h);c.strokeStyle='#becab5';c.lineWidth=1;
    for(let i=0;i<5;i++){c.beginPath();c.ellipse(90,90,25+i*18,23+i*16,-.16,0,Math.PI*2);c.stroke()}
    c.fillStyle='#c6d0bc';for(let i=0;i<20;i++){let x=seeded(i+42)*w,y=seeded(i+90)*h;c.beginPath();c.arc(x,y,3+seeded(i+120)*4,0,Math.PI*2);c.fill()}
    c.strokeStyle='#b0bd9e';c.lineWidth=7;c.beginPath();c.moveTo(10,151);c.quadraticCurveTo(80,115,98,90);c.quadraticCurveTo(126,55,170,31);c.stroke();
    const mx=x=>10+x/W*160,my=y=>10+y/H*160;
    c.fillStyle='#c25645';c.beginPath();c.arc(mx(beast.x),my(beast.y),5,0,Math.PI*2);c.fill();c.strokeStyle='#c2564588';c.lineWidth=2;c.beginPath();c.arc(mx(beast.x),my(beast.y),9+Math.sin(game.elapsed*3)*2,0,Math.PI*2);c.stroke();
    c.fillStyle='#66864e';c.beginPath();c.arc(mx(player.x),my(player.y),4,0,Math.PI*2);c.fill();c.strokeStyle='#66864e';c.lineWidth=1.5;c.beginPath();c.moveTo(mx(player.x),my(player.y));c.lineTo(mx(player.x)+Math.cos(player.face)*8,my(player.y)+Math.sin(player.face)*8);c.stroke();
  }

  function frame(t){let dt=Math.min(.034,(t-game.last)/1000||0);game.last=t;update(dt);draw();requestAnimationFrame(frame)}
  ui.begin.addEventListener('click',begin);ui.restart.addEventListener('click',begin);ui.pause.addEventListener('click',togglePause);
  document.getElementById('soundToggle').addEventListener('click',()=>{game.sound=!game.sound;ui.sound.innerHTML=`♫ <span>SOUND ${game.sound?'ON':'OFF'}</span>`;if(game.sound)audioTone(440,.08)});
  document.getElementById('mobileAttack').addEventListener('click',attack);document.getElementById('mobileDodge').addEventListener('click',dodge);document.getElementById('mobileHeal').addEventListener('click',heal);
  canvas.addEventListener('pointermove',e=>{const p=getCanvasPoint(e);pointer.x=p.x;pointer.y=p.y;if(e.pointerType==='touch'&&pointer.touchStart){let dx=p.x-pointer.touchStart.x,dy=p.y-pointer.touchStart.y,l=Math.hypot(dx,dy);if(l>9)pointer.touchMove={x:dx/Math.max(30,l),y:dy/Math.max(30,l)}}else if(!pointer.down&&game.active){player.face=Math.atan2(p.y-player.y,p.x-player.x)}});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){canvas.setPointerCapture(e.pointerId);const p=getCanvasPoint(e);pointer.touchStart=p;pointer.touchMove=null;return}if(e.button===0){pointer.down=true;const p=getCanvasPoint(e);pointer.x=p.x;pointer.y=p.y;player.face=Math.atan2(p.y-player.y,p.x-player.x);attack()}});
  canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){pointer.touchStart=null;pointer.touchMove=null}pointer.down=false});canvas.addEventListener('pointerleave',()=>{pointer.down=false});
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(k===' '&&!e.repeat)dodge();if(k==='q'&&!e.repeat)heal();if(k==='escape'&&!e.repeat)togglePause();if(k==='enter'&&!game.active&&!game.ended)begin()});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pointer.down=false;if(game.active&&!game.paused)togglePause()});
  requestAnimationFrame(frame);
})();
