(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=e=>document.querySelector(e);document.querySelector(`#app`).innerHTML=`
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
`;var t=document.querySelector(`.tank`),n=8,r=720,i=440,a=t=>{let n=e(`#toast`);n.textContent=t,n.classList.add(`show`),setTimeout(()=>n.classList.remove(`show`),1600)};function o(n){document.querySelectorAll(`.selected`).forEach(e=>e.classList.remove(`selected`)),t=n,n.classList.add(`selected`),e(`#selected`).textContent=n.dataset.unit,e(`#status`).textContent=`READY`}document.querySelectorAll(`.unit`).forEach(e=>e.onclick=()=>o(e)),o(t),document.querySelectorAll(`.order`).forEach(n=>n.onclick=()=>{if(!t||!t.classList.contains(`own-unit`)){a(`SELECT AN ALLIED UNIT`);return}let r=n.dataset.order;e(`#status`).textContent=r,t.classList.add(`pulse`),setTimeout(()=>t.classList.remove(`pulse`),600),a(r+` ORDER ISSUED`),s(r+` order: `+t.dataset.unit)});function s(t){let r=document.createElement(`p`);r.innerHTML=`<i>08:${String(40+n%20).padStart(2,`0`)}</i> ${t}`,e(`#log`).prepend(r)}e(`#endTurn`).onclick=()=>{n++,e(`#turn`).textContent=String(n).padStart(2,`0`),r+=85,i+=30,e(`#sup`).textContent=r,e(`#fuel`).textContent=i,e(`#status`).textContent=`READY`,a(`TURN `+n+` — COMMAND READY`),s(`Turn `+n+` begins. Supplies received.`)},e(`#map`).onclick=n=>{let r=e(`#map`).getBoundingClientRect(),a=((n.clientX-r.left)/r.width*100).toFixed(1),o=((n.clientY-r.top)/r.height*100).toFixed(1);e(`#coord`).textContent=`X ${a} / Y ${o}`,t&&t.classList.contains(`own-unit`)&&(e(`#status`).textContent===`MOVE`||e(`#status`).textContent===`READY`)&&(t.style.left=a+`%`,t.style.top=o+`%`,i-=15,e(`#fuel`).textContent=i,e(`#status`).textContent=`READY`,s(t.dataset.unit+` repositioned.`))},document.querySelectorAll(`.node`).forEach(e=>e.onclick=t=>{t.stopPropagation(),a(e.dataset.name+` — `+(e.classList.contains(`own`)?`ALLIED`:e.classList.contains(`enemy`)?`ENEMY`:`NEUTRAL`))});