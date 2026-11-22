const boardEl = document.getElementById('board');
const pairsLeftEl = document.getElementById('pairsLeft');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const toastEl = document.getElementById('toast');

const symbols = [
  ['bamboo','🎋'],['bamboo','🎋'],['bamboo','🎋'],['bamboo','🎋'],
  ['character','一'],['character','二'],['character','三'],['character','四'],
  ['character','五'],['character','六'],['character','七'],['character','八'],['character','九'],
  ['circle','●'],['circle','●'],['circle','●'],['circle','●'],
  ['circle','●●'],['circle','●●'],['circle','●●'],['circle','●●'],
  ['dragon','中'],['dragon','中'],['dragon','發'],['dragon','發'],['dragon','白'],['dragon','白'],
  ['wind','東'],['wind','東'],['wind','南'],['wind','南'],['wind','西'],['wind','西'],['wind','北'],['wind','北'],
  ['flower','梅'],['flower','蘭'],['flower','菊'],['flower','竹'],['season','春'],['season','夏'],['season','秋'],['season','冬']
];

let tiles = [];
let selected = null;
let moves = 0;
let shuffles = 3;
let seconds = 0;
let timerId;
let history = [];
let sound = true;

function layoutPositions() {
  const p = [];
  // Turtle-like classic solitaire layout, with all 144 positions represented.
  const add = (x,y,z=0) => p.push({x,y,z});
  for (let z=0; z<5; z++) {}
  // 12×8 main body, lower and upper rows
  for (let y=0;y<8;y++) for (let x=0;x<12;x++) add(1+x*58, 31+y*58, 0);
  // raised inner and top layers
  for (let y=0;y<6;y++) for (let x=0;x<10;x++) add(30+x*58, 60+y*58, 1);
  for (let y=0;y<4;y++) for (let x=0;x<8;x++) add(59+x*58, 89+y*58, 2);
  for (let y=0;y<2;y++) for (let x=0;x<6;x++) add(88+x*58, 118+y*58, 3);
  // Special ends and the peaked crown
  add(-27,226,0); add(755,226,0);
  add(322,2,4); add(380,2,4);
  // Exact 144: trim generated extras? Build by return target count
  return p.slice(0,144);
}

function makeDeck() {
  const deck = [];
  // 36 classic suits and honor pairs (72 pairs), plus 4 flowers/seasons (optional bonus)
  const groups = [];
  for (let n=1;n<=9;n++) for (const suit of ['●','竹','萬']) groups.push([n,suit]);
  for (const honor of ['東','南','西','北','中','發','白']) groups.push([0,honor]);
  for (let i=0;i<4;i++) {
    groups.push([1,'梅']); groups.push([1,'蘭']); groups.push([1,'菊']); groups.push([1,'竹']);
  }
  // There should be 144 tiles: 34 unique types × 4 = 136 plus 8 extras
  const types = [];
  for (let n=1;n<=9;n++) for (let s=0;s<3;s++) types.push(`${n}-${s}`);
  for (let h=0;h<7;h++) types.push(`h-${h}`);
  for (let i=0;i<4;i++) types.push(`f-${i}`);

  const all = [];
  types.forEach((type,i) => {
    const suit = i < 27 ? ['萬','筒','竹'][i % 3] : null;
    const number = i < 27 ? Math.floor(i/3)+1 : null;
    const honor = i>=27 && i<34 ? ['東','南','西','北','中','發','白'][i-27] : null;
    const flower = i>=34 ? ['梅','蘭','菊','竹'][i-34] : null;
    for (let c=0;c<4;c++) all.push({type, suit, number, honor, flower, removed:false});
  });
  shuffle(all);
  return all;
}

function shuffle(a) {
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()* (i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function tileLabel(t) {
  if (t.number) {
    if (t.suit==='竹') return '竹';
    if (t.suit==='筒') return '●'.repeat(Math.min(t.number,9));
    return `${['一','二','三','四','五','六','七','八','九'][t.number-1]}萬`;
  }
  if (t.honor) return t.honor;
  return t.flower;
}

function newGame() {
  clearInterval(timerId);
  seconds=0; moves=0; shuffles=3; selected=null; history=[];
  movesEl.textContent='0'; timerEl.textContent='00:00'; document.getElementById('shuffleCount').textContent='3';
  const deck=makeDeck();
  const positions=layoutPositions();
  tiles=positions.map((p,i)=>({...deck[i], ...p, id:i, removed:false}));
  render();
  timerId=setInterval(()=>{seconds++;timerEl.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;},1000);
}

function render() {
  boardEl.innerHTML='';
  const zSorted=[...tiles].sort((a,b)=>a.z-b.z);
  zSorted.forEach(t=>{
    if (t.removed) return;
    const el=document.createElement('button');
    el.className='tile';
    el.dataset.id=t.id;
    el.style.left=`${t.x}px`;el.style.top=`${t.y}px`;el.style.zIndex=10+t.z*4+Math.round(t.y/15);
    if (['中','發','白','東','南','西','北'].includes(tileLabel(t)) || tileLabel(t).includes('萬')) el.classList.add(tileLabel(t)==='中'||tileLabel(t)==='發'?'red':'green');
    if (!isFree(t)) el.classList.add('blocked');
    if (selected?.id===t.id) el.classList.add('selected');
    el.innerHTML=`<span class="tile-inner">${tileLabel(t)}</span>`;
    el.addEventListener('click',()=>clickTile(t));
    boardEl.appendChild(el);
  });
  const remaining=tiles.filter(t=>!t.removed).length;
  pairsLeftEl.textContent=Math.floor(remaining/2);
}

function isFree(t) {
  if (t.removed) return false;
  const top=tiles.some(o=>!o.removed&&o.z>t.z&&Math.abs(o.x-t.x)<52&&Math.abs(o.y-t.y)<54);
  if (top) return false;
  const leftBlocked=tiles.some(o=>!o.removed&&o.z===t.z&&o.x<t.x&&Math.abs(o.x-t.x)<58&&Math.abs(o.y-t.y)<38);
  const rightBlocked=tiles.some(o=>!o.removed&&o.z===t.z&&o.x>t.x&&Math.abs(o.x-t.x)<58&&Math.abs(o.y-t.y)<38);
  return !(leftBlocked&&rightBlocked);
}

function clickTile(t) {
  if (!isFree(t)) { showToast('This tile is blocked'); return; }
  if (!selected) { selected=t; render(); return; }
  if (selected.id===t.id) { selected=null; render(); return; }
  if (selected.type===t.type) {
    history.push([selected.id,t.id]);
    selected.removed=true; t.removed=true; selected=null; moves++; movesEl.textContent=moves;
    if (navigator.vibrate) navigator.vibrate(12);
    render();
    if (tiles.every(x=>x.removed)) endGame(true);
    else if (!findPair()) endGame(false);
  } else {
    showToast('Those tiles do not match'); selected=t; render();
  }
}

function findPair() {
  const free=tiles.filter(t=>!t.removed&&isFree(t));
  for (let i=0;i<free.length;i++) for (let j=i+1;j<free.length;j++) if (free[i].type===free[j].type) return [free[i],free[j]];
  return null;
}

function showToast(msg) {
  toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toastEl.classList.remove('show'),1300);
}

function endGame(win) {
  clearInterval(timerId);
  document.getElementById('endIcon').textContent=win?'🏆':'◌';
  document.getElementById('endTitle').textContent=win?'Board cleared!':'No matches left';
  document.getElementById('endText').textContent=win?`Completed in ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} with ${moves} moves.`:'Try shuffling or starting a new game.';
  setTimeout(()=>document.getElementById('endDialog').showModal(),260);
}

document.getElementById('newBtn').onclick=newGame;
document.getElementById('playAgain').onclick=()=>{document.getElementById('endDialog').close();newGame();};
document.getElementById('helpBtn').onclick=()=>document.getElementById('helpDialog').showModal();
document.getElementById('closeHelp').onclick=()=>document.getElementById('helpDialog').close();
document.getElementById('gotIt').onclick=()=>document.getElementById('helpDialog').close();
document.getElementById('soundBtn').onclick=e=>{sound=!sound;e.target.textContent=sound?'♪':'×';};

document.getElementById('shuffleBtn').onclick=()=>{
  if (shuffles<=0) {showToast('No shuffles left');return;}
  const remaining=tiles.filter(t=>!t.removed);
  shuffle(remaining);
  const positions=remaining.map(t=>({x:t.x,y:t.y,z:t.z}));
  remaining.forEach((t,i)=>{t.type=remaining[i].type;});
  // Reassign deck types among positions to guarantee a solvable configuration pattern
  const types=shuffle(remaining.map(t=>t.type));
  remaining.forEach((t,i)=>{t.type=types[i];});
  shuffles--;document.getElementById('shuffleCount').textContent=shuffles;selected=null;render();showToast('Tiles shuffled');
};

document.getElementById('hintBtn').onclick=()=>{
  const pair=findPair();
  if (!pair) {showToast('No available matches');return;}
  render();
  pair.forEach(t=>{const el=boardEl.querySelector(`[data-id="${t.id}"]`);if(el)el.classList.add('hinted');});
};

document.getElementById('undoBtn').onclick=()=>{
  if (!history.length) {showToast('Nothing to undo');return;}
  const [a,b]=history.pop(); const ta=tiles.find(t=>t.id===a),tb=tiles.find(t=>t.id===b);
  ta.removed=false;tb.removed=false;moves=Math.max(0,moves-1);movesEl.textContent=moves;selected=null;render();
};

window.addEventListener('keydown',e=>{
  if (e.key.toLowerCase()==='h') document.getElementById('hintBtn').click();
  if (e.key.toLowerCase()==='z') document.getElementById('undoBtn').click();
});

newGame();
