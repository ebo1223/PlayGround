import './style.css';

const $ = (s) => document.querySelector(s);

document.querySelector('#app').innerHTML = `
<div class="shell">
  <header>
    <div class="brand"><span class="mark">◆</span><div><b>IRON FRONT</b><small>TACTICAL COMMAND</small></div></div>
    <div class="turn"><span>TURN</span><b id="turn">08</b></div>
    <div class="resources">
      <div><span>◈</span><small>SUPPLY</small><b id="sup">720</b></div>
      <div><span>⬡</span><small>FUEL</small><b id="fuel">440</b></div>
      <div><span>△</span><small>INTEL</small><b id="intel">180</b></div>
    </div>
  </header>

  <main>
    <aside class="left">
      <div class="panel objectives">
        <p class="eyebrow">MISSION OBJECTIVES</p>
        <label><input type="checkbox"><span></span> Secure the northern bridge</label>
        <label><input type="checkbox"><span></span> Capture Kestrel Station</label>
        <label><input type="checkbox"><span></span> Eliminate enemy HQ</label>
      </div>
      <div class="panel log">
        <p class="eyebrow">BATTLE LOG</p>
        <div id="log"><p><i>08:40</i> Recon detected armor movement.</p><p><i>08:35</i> Supply convoy reached base.</p><p><i>08:21</i> Enemy recon pulled back.</p></div>
      </div>
    </aside>

    <section class="battlefield">
      <div class="map-head"><div><small>THEATER</small><b>SECTOR 7 — THE GREYLINE</b></div><button id="zoom">⌗ 100%</button></div>
      <div class="map" id="map">
        <div class="grid"></div><div class="terrain river"></div><div class="terrain ridge r1"></div><div class="terrain ridge r2"></div>
        <div class="road road1"></div><div class="road road2"></div>
        <div class="contour c1">A</div><div class="contour c2">B</div><div class="contour c3">C</div>
        <div class="node base own" data-kind="base" data-name="Forward Base" style="left:17%;top:68%"><span>⌂</span><b>FORWARD BASE</b></div>
        <div class="node bridge own" data-kind="bridge" data-name="Northern Bridge" style="left:48%;top:42%"><span>Ⅱ</span><b>BRIDGE</b></div>
        <div class="node station neutral" data-kind="station" data-name="Kestrel Station" style="left:70%;top:31%"><span>▦</span><b>Kestrel Station</b></div>
        <div class="node hq enemy" data-kind="hq" data-name="Enemy HQ" style="left:82%;top:68%"><span>⚑</span><b>ENEMY HQ</b></div>
        <div class="unit own-unit tank" data-unit="M1 Tank" style="left:26%;top:58%"><span>▲</span><i></i></div>
        <div class="unit own-unit infantry" data-unit="Ranger Squad" style="left:36%;top:71%"><span>●</span><i></i></div>
        <div class="unit enemy-unit" data-unit="Enemy Armor" style="left:72%;top:53%"><span>▲</span><i></i></div>
        <div class="scan"></div>
      </div>
      <div class="map-foot"><span><i class="dot cyan"></i> ALLIED</span><span><i class="dot red"></i> ENEMY</span><span><i class="dot gray"></i> NEUTRAL</span><b id="coord">X 04.82 / Y 11.36</b></div>
    </section>

    <aside class="right">
      <div class="panel orders">
        <p class="eyebrow">COMMAND</p>
        <div class="selection"><small>SELECTED UNIT</small><b id="selected">M1 Tank</b><span id="status">READY</span></div>
        <button class="order" data-order="MOVE"><b>Move</b><small>4 AP</small><kbd>M</kbd></button>
        <button class="order" data-order="ATTACK"><b>Attack</b><small>6 AP</small><kbd>A</kbd></button>
        <button class="order" data-order="DEFEND"><b>Defend</b><small>2 AP</small><kbd>D</kbd></button>
        <button class="order" data-order="SUPPLY"><b>Resupply</b><small>1 AP</small><kbd>R</kbd></button>
      </div>
      <button id="endTurn" class="end">END TURN <span>→</span></button>
    </aside>
  </main>
</div>
<div id="toast"></div>
`;

let selected = document.querySelector('.tank');
let turn = 8, supply = 720, fuel = 440, intel = 180;
const toast = (t) => { const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1600)};

function select(el){document.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));selected=el;el.classList.add('selected');$('#selected').textContent=el.dataset.unit;$('#status').textContent='READY';}
document.querySelectorAll('.unit').forEach(el=>el.onclick=()=>select(el));
select(selected);

document.querySelectorAll('.order').forEach(btn=>btn.onclick=()=>{
  if(!selected||!selected.classList.contains('own-unit')){toast('SELECT AN ALLIED UNIT');return}
  const name=btn.dataset.order;
  $('#status').textContent=name;
  selected.classList.add('pulse');setTimeout(()=>selected.classList.remove('pulse'),600);
  toast(name+' ORDER ISSUED');
  addLog(name+' order: '+selected.dataset.unit);
});

function addLog(text){const p=document.createElement('p');p.innerHTML=`<i>08:${String(40+(turn%20)).padStart(2,'0')}</i> ${text}`;$('#log').prepend(p)}

$('#endTurn').onclick=()=>{turn++;$('#turn').textContent=String(turn).padStart(2,'0');supply+=85;fuel+=30;$('#sup').textContent=supply;$('#fuel').textContent=fuel;$('#status').textContent='READY';toast('TURN '+turn+' — COMMAND READY');addLog('Turn '+turn+' begins. Supplies received.')};

$('#map').onclick=(e)=>{
 const r=$('#map').getBoundingClientRect();const x=((e.clientX-r.left)/r.width*100).toFixed(1),y=((e.clientY-r.top)/r.height*100).toFixed(1);$('#coord').textContent=`X ${x} / Y ${y}`;
 if(selected&&selected.classList.contains('own-unit')&&($('#status').textContent==='MOVE'||$('#status').textContent==='READY')){
  selected.style.left=x+'%';selected.style.top=y+'%';fuel-=15;$('#fuel').textContent=fuel;$('#status').textContent='READY';addLog(selected.dataset.unit+' repositioned.');
 }
};

document.querySelectorAll('.node').forEach(n=>n.onclick=(e)=>{e.stopPropagation();toast(n.dataset.name+' — '+(n.classList.contains('own')?'ALLIED':n.classList.contains('enemy')?'ENEMY':'NEUTRAL'));});
