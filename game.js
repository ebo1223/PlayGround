(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540, ground = 421, courseEnd = 5300;
  const obstacles = [
    {x:700,w:54,type:'jump'}, {x:970,w:72,type:'slide'}, {x:1450,w:150,type:'gap'},
    {x:1810,w:58,type:'jump'}, {x:2200,w:72,type:'slide'}, {x:2550,w:160,type:'gap'},
    {x:2860,w:58,type:'jump'}, {x:3260,w:76,type:'slide'}, {x:3550,w:155,type:'gap'},
    {x:3770,w:72,type:'slide'}, {x:4110,w:58,type:'jump'}, {x:4390,w:74,type:'slide'},
    {x:4660,w:58,type:'jump'}, {x:4900,w:58,type:'jump'}
  ];
  const $ = id => document.getElementById(id);
  const screen = $('screen'), startButton = $('startButton');
  const ui = {timer:$('timer'),best:$('bestTime'),fill:$('progressFill'),runner:$('progressRunner'),progress:$('progressText'),count:$('obstacleCount'),record:$('recordStat'),status:$('statusText'),title:$('screenTitle'),copy:$('screenCopy'),button:startButton,toast:$('toast')};
  let state='ready', player={x:150,y:ground,vy:0,slide:0,run:0}, camera=0, elapsed=0, last=0, passed=0, sound=true, audio;
  let particles=[];
  const gapRanges=obstacles.filter(o=>o.type==='gap').map(o=>[o.x,o.x+o.w]);
  const bestKey='ninja-warrior-best';
  let best=Number(localStorage.getItem(bestKey)||0);
  const format=t=>{if(!t)return '--:--.--';const m=Math.floor(t/60),s=Math.floor(t%60),c=Math.floor((t%1)*100);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(c).padStart(2,'0')}`};
  function updateBest(){ui.best.textContent=format(best);ui.record.textContent=best?`${format(best)} BEST`:'SET YOUR RECORD';}
  updateBest();
  function tone(freq=440,duration=.08,type='sine'){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(_){}}
  function reset(){player={x:150,y:ground,vy:0,slide:0,run:0};camera=0;elapsed=0;passed=0;particles=[];ui.timer.textContent='00:00.00';ui.count.innerHTML='0 <small>/ 14</small>';ui.fill.style.width='0%';ui.runner.style.left='0%';ui.progress.textContent='0%';}
  function showScreen(kind){screen.classList.remove('hidden');if(kind==='ready'){ui.title.innerHTML='BECOME<br><span>THE WARRIOR</span>';ui.copy.innerHTML='A course of split-second decisions.<br>Run fast. Read the obstacles. Make it to the end.';ui.button.querySelector('span').textContent='START COURSE';ui.status.textContent='READY WHEN YOU ARE'}else if(kind==='dead'){ui.title.innerHTML='RUN<br><span>COMPLETE</span>';ui.copy.innerHTML='The course waits for no one.<br>Reset your focus and take another shot.';ui.button.querySelector('span').textContent='TRY AGAIN';ui.status.textContent='RUN ENDED — TAKE ANOTHER SHOT'}else if(kind==='won'){ui.title.innerHTML='COURSE<br><span>CONQUERED</span>';ui.copy.innerHTML=`You made it through the Moonlit Gauntlet.<br>Your time: <b style="color:#c8f169">${format(elapsed)}</b>`;ui.button.querySelector('span').textContent='RUN IT AGAIN';ui.status.textContent='COURSE COMPLETE — WARRIOR STATUS: EARNED'}else{ui.title.innerHTML='TAKE A<br><span>BREATHER</span>';ui.copy.innerHTML='The course is paused.<br>Catch your breath. The finish line is still waiting.';ui.button.querySelector('span').textContent='RESUME RUN';ui.status.textContent='PAUSED — PRESS P TO RESUME'}}
  function start(){if(state==='paused'){state='running';screen.classList.add('hidden');last=performance.now();return}reset();state='running';screen.classList.add('hidden');last=performance.now();tone(520,.12,'triangle');}
  function end(won=false){state=won?'won':'dead';showScreen(state);tone(won?760:145,.35,won?'triangle':'sawtooth');if(won&&(!best||elapsed<best)){best=elapsed;localStorage.setItem(bestKey,String(best));updateBest()}}
  startButton.addEventListener('click',start);
  $('pauseButton').addEventListener('click',()=>togglePause());
  function togglePause(){if(state==='running'){state='paused';showScreen('paused')}else if(state==='paused')start()}
  $('soundToggle').addEventListener('click',()=>{sound=!sound;$('soundLabel').textContent=sound?'SOUND ON':'SOUND OFF';$('soundIcon').textContent=sound?'♪':'♫';if(sound)tone(620,.08)});
  function jump(){if(state!=='running')return;if(player.y>=ground-1&&!player.slide){player.vy=-650;tone(360,.09,'triangle');for(let i=0;i<5;i++)particles.push({x:player.x,y:ground-5,vx:-Math.random()*65,vy:-Math.random()*90,life:.35})}}
  function slideStart(){if(state==='running')player.slide=.65}
  function keyDown(e){if(['Space','ArrowUp','ArrowDown','KeyS','KeyP','Enter'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')jump();if(e.code==='ArrowDown'||e.code==='KeyS')slideStart();if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='Enter'&&(state==='ready'||state==='dead'||state==='won'))start()}
  window.addEventListener('keydown',keyDown);
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;if(x>0.72)slideStart();else jump()});
  $('touchJump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
  $('touchSlide').addEventListener('pointerdown',e=>{e.preventDefault();slideStart()});
  function inGap(x){return gapRanges.some(g=>x+17>g[0]&&x-17<g[1])}
  function update(dt){if(state!=='running')return;elapsed+=dt;player.x+=262*dt;player.run+=dt*13;player.slide=Math.max(0,player.slide-dt);player.vy+=1550*dt;player.y+=player.vy*dt;
    if(player.y>=ground&&!inGap(player.x)){player.y=ground;player.vy=0}else if(player.y>ground+110){end(false);return}
    camera=Math.max(0,player.x-235);
    for(let i=passed;i<obstacles.length;i++){const o=obstacles[i],px=player.x+16;if(px>o.x+o.w){passed++;ui.count.innerHTML=`${passed} <small>/ 14</small>`;if(passed===7){toast('HALFWAY');}continue}if(px+4>o.x&&player.x-13<o.x+o.w){if(o.type==='jump'&&player.y>ground-34){end(false);return}if(o.type==='slide'&&!player.slide){end(false);return}}break}
    if(player.x>=courseEnd)end(true);
    const pct=Math.min(100,Math.floor(player.x/courseEnd*100));ui.progress.textContent=`${pct}%`;ui.fill.style.width=`${pct}%`;ui.runner.style.left=`${pct}%`;ui.timer.textContent=format(elapsed);
    particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt});
  }
  let toastTimer;function toast(text){ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1100)}
  const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill()};
  function drawBackground(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#101b25');sky.addColorStop(.54,'#24343a');sky.addColorStop(1,'#405145');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // moon and star field
    ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#e7e5c7';ctx.beginPath();ctx.arc(756,91,34,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(770,80,34,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalCompositeOperation='source-over';
    for(let i=0;i<42;i++){let x=((i*137+34-camera*.035)%W+W)%W,y=(i*67+23)%220;ctx.fillStyle=`rgba(231,239,215,${.17+(i%4)*.1})`;ctx.fillRect(x,y,1.5,1.5)}
    // distant mountains
    poly([[0,310],[0,245],[75,192],[130,248],[210,178],[290,256],[370,205],[450,273],[540,185],[630,250],[720,190],[810,257],[900,205],[960,244],[960,380],[0,380]],'#26363a');
    poly([[0,329],[0,285],[80,253],[146,284],[225,222],[300,292],[390,240],[470,303],[560,231],[635,290],[720,238],[790,294],[882,239],[960,287],[960,390],[0,390]],'#30423e');
    // stadium light structures
    ctx.strokeStyle='#9ca99b33';ctx.lineWidth=2;for(let i=0;i<5;i++){let x=((i*280-camera*.2)%1150+1150)%1150-80;ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x,105);ctx.lineTo(x+95,105);ctx.stroke();ctx.fillStyle='#d7edb5aa';for(let j=0;j<5;j++)ctx.fillRect(x+8+j*17,110,7,3)}
    // crowd silhouettes
    ctx.fillStyle='#202e2c';for(let i=0;i<58;i++){let x=((i*29-camera*.42)%W+W)%W,y=356+(i%4)*8;ctx.fillRect(x,y,11,30);ctx.beginPath();ctx.arc(x+5,y-3,5,0,Math.PI*2);ctx.fill()}
    // stadium banners
    ctx.fillStyle='#bfdb7270';for(let i=0;i<9;i++){let x=((i*135-camera*.5)%1100+1100)%1100-40;poly([[x,295],[x+38,295],[x+34,330],[x+4,330]],i%2?'#a6c85b77':'#d18b6570')}
  }
  function drawGround(){const offset=-(camera%100);ctx.fillStyle='#18211e';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#829568';ctx.fillRect(0,ground,W,3);ctx.fillStyle='#c8f169';ctx.fillRect(0,ground,W,2);
    // textured track panels
    for(let i=-1;i<12;i++){let x=i*100+offset;ctx.fillStyle=i%2?'#1a2420':'#1d2823';ctx.fillRect(x,ground+3,98,90);ctx.strokeStyle='#ffffff09';ctx.beginPath();ctx.moveTo(x+12,ground+24);ctx.lineTo(x+80,ground+24);ctx.stroke()}
    // cut away gaps
    for(const [a,b] of gapRanges){let x=a-camera,w=b-a;if(x>-w&&x<W){ctx.fillStyle='#0c1317';ctx.fillRect(x,ground,w,H-ground);ctx.fillStyle='#11191b';ctx.fillRect(x,ground,w,10);ctx.strokeStyle='#cf7753';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+8,ground+5);ctx.moveTo(x+w,ground);ctx.lineTo(x+w-8,ground+5);ctx.stroke();for(let j=0;j<4;j++){ctx.fillStyle='#ef8c63';ctx.globalAlpha=.7-j*.14;ctx.fillRect(x+15+j*32,ground+38+(j%2)*18,3,7)}ctx.globalAlpha=1}}
  }
  function drawObstacle(o){let x=o.x-camera;if(x<-100||x>W+100)return;ctx.save();if(o.type==='jump'){
      ctx.shadowColor='#f08d61';ctx.shadowBlur=15;ctx.fillStyle='#e77d55';ctx.fillRect(x,ground-36,o.w,36);ctx.shadowBlur=0;ctx.fillStyle='#f9b17c';ctx.fillRect(x+4,ground-32,o.w-8,4);ctx.fillStyle='#27302b';for(let i=0;i<3;i++)ctx.fillRect(x+9+i*16,ground-21,8,7);ctx.fillStyle='#f7d29a';ctx.font='700 8px sans-serif';ctx.fillText('VAULT',x+8,ground-43)
    }else if(o.type==='slide'){
      ctx.shadowColor='#c8f169';ctx.shadowBlur=12;ctx.fillStyle='#a9d655';ctx.fillRect(x,ground-73,o.w,11);ctx.shadowBlur=0;ctx.fillStyle='#617e38';ctx.fillRect(x+6,ground-62,5,62);ctx.fillRect(x+o.w-11,ground-62,5,62);ctx.fillStyle='#e2f6aa';ctx.fillRect(x+5,ground-73,o.w-10,3);ctx.fillStyle='#d6ec99';ctx.font='700 8px sans-serif';ctx.fillText('SLIDE',x+10,ground-78)
    }else{
      ctx.fillStyle='#30433c';ctx.fillRect(x,ground-5,o.w,5);ctx.fillStyle='#405348';for(let j=0;j<5;j++)ctx.fillRect(x+j*35,ground-5,17,5);ctx.strokeStyle='#f08d61';ctx.setLineDash([5,7]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,ground+13);ctx.lineTo(x+o.w,ground+13);ctx.stroke();ctx.setLineDash([])
    }ctx.restore()}
  function drawFinish(){let x=courseEnd-camera;if(x>-60&&x<W+70){ctx.fillStyle='#e5ebd6';ctx.fillRect(x,ground-148,9,148);ctx.fillRect(x+84,ground-148,9,148);ctx.fillStyle='#c8f169';ctx.fillRect(x,ground-148,93,33);ctx.fillStyle='#18231c';ctx.font='900 15px "Barlow Condensed",sans-serif';ctx.fillText('FINISH',x+15,ground-126);ctx.strokeStyle='#e5ebd6';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+5,ground-115);ctx.lineTo(x+87,ground-115);ctx.stroke()}}
  function drawNinja(){const sx=player.x-camera, feet=player.y, sliding=player.slide>0;ctx.save();ctx.translate(sx,feet);const bob=(!sliding&&player.y>=ground-1)?Math.abs(Math.sin(player.run))*3:0;ctx.translate(0,-bob);
    // ground shadow
    ctx.fillStyle='#0b1110aa';ctx.beginPath();ctx.ellipse(0,3,sliding?25:17,4,0,0,Math.PI*2);ctx.fill();
    ctx.lineCap='round';ctx.lineJoin='round';const dark='#111820',red='#e85f56',edge='#d8e2cd';
    if(sliding){ctx.rotate(-.05);ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(0,-17,25,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=red;ctx.beginPath();ctx.moveTo(-2,-24);ctx.lineTo(-16,-28);ctx.lineTo(-28,-20);ctx.lineTo(-15,-21);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(5,-9);ctx.lineTo(22,-4);ctx.moveTo(-7,-8);ctx.lineTo(-23,-4);ctx.stroke();ctx.fillStyle='#e8eee1';ctx.fillRect(11,-21,8,3);ctx.fillStyle=red;ctx.fillRect(14,-21,3,2)
    }else{
      // trailing scarf
      ctx.fillStyle=red;ctx.beginPath();ctx.moveTo(-5,-52);ctx.quadraticCurveTo(-23,-51,-34,-59+Math.sin(player.run)*3);ctx.lineTo(-24,-49);ctx.lineTo(-38,-45);ctx.lineTo(-15,-43);ctx.fill();
      // legs swing while running
      let swing=Math.sin(player.run)*8;ctx.strokeStyle=dark;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-2,-17);ctx.lineTo(-7+swing,-8);ctx.lineTo(-12+swing,-1);ctx.moveTo(4,-17);ctx.lineTo(8-swing,-9);ctx.lineTo(14-swing,-1);ctx.stroke();ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18+swing,-1);ctx.lineTo(-8+swing,-1);ctx.moveTo(8-swing,-1);ctx.lineTo(19-swing,-1);ctx.stroke();
      // torso and arms
      ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-12,-47);ctx.lineTo(10,-48);ctx.lineTo(12,-18);ctx.lineTo(-10,-16);ctx.closePath();ctx.fill();ctx.fillStyle='#344349';ctx.fillRect(-10,-44,17,3);ctx.strokeStyle=dark;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-7,-41);ctx.lineTo(-15,-32+Math.cos(player.run)*3);ctx.lineTo(-18,-29+Math.cos(player.run)*3);ctx.moveTo(8,-41);ctx.lineTo(16,-34-Math.cos(player.run)*3);ctx.lineTo(19,-31-Math.cos(player.run)*3);ctx.stroke();
      // head wrap
      ctx.fillStyle=dark;ctx.beginPath();ctx.arc(0,-57,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9eee2';ctx.fillRect(2,-60,8,3);ctx.fillStyle=red;ctx.fillRect(4,-60,4,2);ctx.fillStyle=red;ctx.fillRect(-11,-51,22,3)
    }ctx.restore()}
  function render(){drawBackground();drawGround();obstacles.forEach(drawObstacle);drawFinish();particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle='#c8f169';ctx.fillRect(p.x-camera,p.y,3,3)});ctx.globalAlpha=1;drawNinja();
    if(state==='dead'){ctx.fillStyle='#f48b64';ctx.font='700 10px sans-serif';ctx.fillText('WIPEOUT',player.x-camera-25,player.y-80)}
  }
  function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;update(dt);render();requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
})();
