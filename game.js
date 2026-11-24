const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const bestEl = document.getElementById('best');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const finalScore = document.getElementById('finalScore');
const endTitle = document.getElementById('endTitle');
const comboDots = [...document.querySelectorAll('#comboDots i')];

let score = 0;
let combo = 0;
let time = 30;
let playing = false;
let active = new Set();
let timers = [];
let best = Number(localStorage.getItem('whackBest') || 0);
let muted = false;
bestEl.textContent = String(best).padStart(3,'0');

for (let i=0;i<9;i++) {
  const hole = document.createElement('button');
  hole.className = 'hole';
  hole.setAttribute('aria-label','Mole hole');
  hole.innerHTML = `<div class="mole"><div class="ear left"></div><div class="ear right"></div><div class="mole-body"><div class="face"><i class="eye left"></i><i class="eye right"></i><div class="nose"></div><i class="whisker left"></i><i class="whisker right"></i><div class="tooth"></div></div></div></div>`;
  hole.addEventListener('pointerdown', () => hit(i, hole));
  board.appendChild(hole);
}

function tone(freq, duration=.07) {
  if (muted) return;
  try {
    const ctx = tone.ctx || (tone.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='square'; osc.frequency.value=freq; gain.gain.setValueAtTime(.035,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);
  } catch {}
}

function hit(i, hole) {
  if (!playing || !active.has(i)) return;
  active.delete(i); hole.classList.remove('active'); hole.classList.add('hit');
  setTimeout(()=>hole.classList.remove('hit'),180);
  combo++;
  const points = combo >= 5 ? 20 : 10;
  score += points;
  scoreEl.textContent = String(score).padStart(3,'0');
  const pop=document.createElement('span'); pop.className='pop'; pop.textContent='+'+points; hole.appendChild(pop); setTimeout(()=>pop.remove(),550);
  tone(180+combo*18,.08);
  comboDots.forEach((dot,n)=>dot.classList.toggle('on',n < Math.min(combo,5)));
}

function updateCombo() {
  if (combo>0) { combo=0; comboDots.forEach(d=>d.classList.remove('on')); }
}

function showMole() {
  if (!playing) return;
  const available=[...board.children].map((_,i)=>i).filter(i=>!active.has(i));
  if (!available.length) return;
  const i=available[Math.floor(Math.random()*available.length)];
  const hole=board.children[i]; active.add(i); hole.classList.add('active');
  tone(80,.025);
  const lifetime=Math.max(430,900-time*10-(combo>4?120:0));
  setTimeout(()=>{ if(active.has(i)){ active.delete(i);hole.classList.remove('active');updateCombo(); }},lifetime);
}

function spawnLoop() {
  showMole();
  if (time<20 && Math.random()<.35) setTimeout(showMole,170);
  const next=Math.max(360,720-time*9)+Math.random()*180;
  timers.push(setTimeout(spawnLoop,next));
}

function startGame() {
  timers.forEach(clearTimeout); timers=[];
  score=0; combo=0; time=30; playing=true; active.clear();
  [...board.children].forEach(h=>h.classList.remove('active','hit'));
  scoreEl.textContent='000';timerEl.textContent='30';comboDots.forEach(d=>d.classList.remove('on'));
  startOverlay.classList.add('hidden'); endOverlay.classList.add('hidden');
  tone(260,.05);
  spawnLoop();
  timers.push(setInterval(()=>{
    time--; timerEl.textContent=String(time).padStart(2,'0');
    if(time<=0) endGame();
  },1000));
}

function endGame() {
  if(!playing) return;
  playing=false; timers.forEach(clearTimeout); timers=[]; active.clear();
  [...board.children].forEach(h=>h.classList.remove('active','hit'));
  if(score>best){best=score;localStorage.setItem('whackBest',best);bestEl.textContent=String(best).padStart(3,'0');endTitle.textContent='New high score!';}
  else endTitle.textContent=score>=150?'Mole master!':score>0?'Nice whacking!':'So close!';
  finalScore.textContent=String(score); endOverlay.classList.remove('hidden'); tone(130,.18);
}

document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('againBtn').addEventListener('click',startGame);
document.getElementById('soundBtn').addEventListener('click',e=>{muted=!muted;e.currentTarget.classList.toggle('muted',muted);});
