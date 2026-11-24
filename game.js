(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const speedEl = document.getElementById('speed');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayEyebrow = document.getElementById('overlayEyebrow');
  const startLabel = document.getElementById('startLabel');

  const size = 20;
  const cell = canvas.width / size;
  let snake, dir, nextDir, food, score, best, level, speed, timer, running, paused, muted;
  let audioCtx = null;
  best = Number(localStorage.getItem('snakeClassicBest') || 0);
  muted = false;

  function beep(freq, duration = .05) {
    if (muted) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq; osc.type = 'square';
      gain.gain.setValueAtTime(.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  function reset() {
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; level = 1; speed = 1; running = false; paused = false;
    placeFood(); updateStats(); draw();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random()*size), y: Math.floor(Math.random()*size) };
    } while (snake.some(p => p.x === food.x && p.y === food.y));
  }

  function updateStats() {
    scoreEl.textContent = String(score).padStart(4,'0');
    bestEl.textContent = String(best).padStart(4,'0');
    levelEl.textContent = String(level).padStart(2,'0');
    speedEl.textContent = speed;
  }

  function draw() {
    ctx.fillStyle = '#dce8c1'; ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.strokeStyle = 'rgba(39,74,60,.10)'; ctx.lineWidth = 1;
    for(let i=1;i<size;i++) {
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke();
    }

    ctx.fillStyle = '#ef7d32';
    const fx=food.x*cell, fy=food.y*cell;
    ctx.beginPath(); ctx.roundRect(fx+5,fy+5,cell-10,cell-10,5); ctx.fill();
    ctx.fillStyle='#5d4b32'; ctx.fillRect(fx+cell*.55,fy+3,3,7);

    snake.forEach((p,i) => {
      const x=p.x*cell, y=p.y*cell;
      ctx.fillStyle = i === 0 ? '#204536' : '#2d5944';
      ctx.strokeStyle='#182b27'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(x+2,y+2,cell-4,cell-4, i===0?7:5); ctx.fill(); ctx.stroke();
      if(i===0) {
        ctx.fillStyle='#dce8c1';
        const ex = dir.x===1 ? x+21 : dir.x===-1 ? x+7 : x+9;
        const ey = dir.y===1 ? y+21 : dir.y===-1 ? y+7 : y+9;
        ctx.beginPath(); ctx.arc(ex,ey,2.2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(dir.y!==0 ? ex+8 : ex,dir.y!==0 ? ey : ey+8,2.2,0,Math.PI*2); ctx.fill();
      }
    });
  }

  function step() {
    if(!running || paused) return;
    dir = nextDir;
    const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    const eating = head.x===food.x && head.y===food.y;
    const body = eating ? snake : snake.slice(0,-1);
    if(head.x<0||head.x>=size||head.y<0||head.y>=size||body.some(p=>p.x===head.x&&p.y===head.y)) {
      endGame(); return;
    }
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y) {
      score += 10; beep(620,.07);
      if(score>best){best=score; localStorage.setItem('snakeClassicBest',String(best));}
      if(score>0 && score%(50)===0) {
        level++; speed=Math.min(10,speed+1); restartLoop(); beep(880,.12);
      }
      placeFood(); updateStats();
    } else snake.pop();
    draw();
  }

  function restartLoop() {
    clearInterval(timer);
    timer=setInterval(step, Math.max(55,150-(speed-1)*11));
  }

  function startGame() {
    if(running && !paused) return;
    if(!running) reset();
    running=true; paused=false;
    overlay.classList.add('hidden'); beep(440,.05); restartLoop();
  }

  function endGame() {
    running=false; clearInterval(timer); beep(120,.18);
    overlayEyebrow.textContent='GAME OVER'; overlayTitle.textContent='TRY AGAIN'; startLabel.textContent='RESTART';
    overlay.classList.remove('hidden');
  }

  function togglePause() {
    if(!running) return;
    paused=!paused;
    if(paused) {
      overlayEyebrow.textContent='TAKE A BREATH'; overlayTitle.textContent='PAUSED'; startLabel.textContent='RESUME'; overlay.classList.remove('hidden');
    } else { overlay.classList.add('hidden'); }
  }

  function setDirection(x,y) {
    if(dir.x===-x && dir.y===-y) return;
    nextDir={x,y};
  }

  document.getElementById('startBtn').addEventListener('click',()=>{
    if(paused) togglePause(); else startGame();
  });
  document.getElementById('pauseBtn').addEventListener('click',togglePause);
  document.getElementById('restartBtn').addEventListener('click',()=>{clearInterval(timer); reset(); overlayEyebrow.textContent='CLASSIC ARCADE'; overlayTitle.textContent='READY?'; startLabel.textContent='PLAY'; overlay.classList.remove('hidden');});
  document.getElementById('soundBtn').addEventListener('click',e=>{muted=!muted;e.currentTarget.classList.toggle('muted',muted);});

  window.addEventListener('keydown',e=>{
    const keys={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
    if(keys[e.key]) {e.preventDefault();setDirection(...keys[e.key]);}
    if(e.code==='Space') {e.preventDefault(); paused ? togglePause() : (running ? togglePause() : startGame());}
  });

  document.querySelectorAll('[data-dir]').forEach(btn=>btn.addEventListener('pointerdown',e=>{
    e.preventDefault();
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[btn.dataset.dir]; setDirection(...d);
  }));

  let touchStart=null;
  canvas.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0];},{passive:true});
  canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  canvas.addEventListener('touchend',e=>{
    if(!touchStart)return; const t=e.changedTouches[0], dx=t.clientX-touchStart.clientX,dy=t.clientY-touchStart.clientY;
    if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;
    if(Math.abs(dx)>Math.abs(dy))setDirection(dx>0?1:-1,0);else setDirection(0,dy>0?1:-1); touchStart=null;
  });

  reset();
})();
