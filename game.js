(() => {
  'use strict';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const mini = document.getElementById('minimap');
  const mctx = mini.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const shell = $('gameShell');
  const WORLD = { w: 2600, h: 1900 };
  const VIEW = { w: 1280, h: 720 };
  const keys = new Set();
  const pointer = { x: 640, y: 360, down: false, inside: false };
  const camera = { x: 1300, y: 950 };
  let state = 'menu', last = performance.now(), elapsed = 0, clockSeconds = 0;
  let player, zombies = [], bullets = [], particles = [], props = [], spawnTimer = 0;
  let wave = 1, killed = 0, waveKills = 0, waveTarget = 6, nextWaveTimer = 0, reloadTimer = 0, fireTimer = 0, hurtFlash = 0, toastTimer = 0, dashCooldown = 0;
  let soundOn = false, audioCtx = null, shake = 0;
  let best = Number(localStorage.getItem('deadsignal-best') || 0);
  $('bestScore').textContent = best ? String(best).padStart(2, '0') : '—';

  function resize() {
    const r = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(canvas.width / VIEW.w, 0, 0, canvas.height / VIEW.h, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  function reset() {
    player = { x: WORLD.w / 2, y: WORLD.h / 2, radius: 16, hp: 100, stamina: 100, angle: -Math.PI / 2, clip: 30, reserve: 120, invuln: 0, moving: 0, recoil: 0 };
    zombies = []; bullets = []; particles = []; wave = 1; killed = 0; waveKills = 0; waveTarget = 6; spawnTimer = 1.1; nextWaveTimer = 0; reloadTimer = 0; fireTimer = 0; dashCooldown = 0; elapsed = 0; clockSeconds = 0; shake = 0;
    state = 'playing'; $('startScreen').classList.add('dismissed'); $('pauseScreen').classList.add('hidden'); $('endScreen').classList.add('hidden'); $('weaponPanel').classList.remove('reloading'); $('waveNumber').textContent = '01'; $('killCount').innerHTML = '00 <small>KILLS</small>'; $('weaponState').textContent = 'READY'; showToast('HOSTILES INBOUND'); updateHud();
  }
  function showToast(text) { $('toastText').textContent = text; $('toast').classList.add('show'); toastTimer = 2.4; }
  function sound(freq = 180, duration = .07, type = 'square', volume = .035) {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * .45), audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (_) { /* audio is optional */ }
  }
  function startReload() {
    if (state !== 'playing' || reloadTimer > 0 || player.clip === 30 || player.reserve <= 0) return;
    reloadTimer = 1.25; $('weaponPanel').classList.add('reloading'); $('weaponState').textContent = 'RELOADING'; sound(110, .1, 'triangle', .025);
  }
  function finishReload() {
    const amount = Math.min(30 - player.clip, player.reserve); player.clip += amount; player.reserve -= amount; reloadTimer = 0;
    $('weaponPanel').classList.remove('reloading'); $('weaponState').textContent = 'READY'; updateHud(); sound(270, .05, 'triangle', .02);
  }
  function startNextWave() {
    wave++; waveKills = 0; waveTarget = Math.min(6 + wave * 3, 32); spawnTimer = .8; nextWaveTimer = 0;
    player.hp = Math.min(100, player.hp + 16); player.stamina = 100; player.reserve = Math.min(240, player.reserve + 18);
    $('waveNumber').textContent = String(wave).padStart(2, '0'); showToast(`WAVE ${String(wave).padStart(2, '0')} — THEY'RE COMING`); sound(330, .18, 'sawtooth', .035);
  }
  function endGame() {
    state = 'dead'; $('finalWave').textContent = String(wave).padStart(2, '0'); $('finalKills').textContent = String(killed).padStart(2, '0');
    $('endTitle').innerHTML = 'YOU\'RE<br>STILL HERE<span>?</span>'; $('endEyebrow').textContent = 'SIGNAL LOST'; $('endCopy').textContent = 'The city takes another one.';
    if (killed > best) { best = killed; localStorage.setItem('deadsignal-best', String(best)); $('bestScore').textContent = String(best).padStart(2, '0'); }
    $('endScreen').classList.remove('hidden'); sound(80, .5, 'sawtooth', .05);
  }
  function pause() { if (state === 'playing') { state = 'paused'; $('pauseScreen').classList.remove('hidden'); } else if (state === 'paused') { state = 'playing'; $('pauseScreen').classList.add('hidden'); last = performance.now(); } }
  function screenPoint(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * VIEW.w, y: (e.clientY - r.top) / r.height * VIEW.h }; }
  canvas.addEventListener('pointermove', e => { Object.assign(pointer, screenPoint(e)); pointer.inside = true; });
  canvas.addEventListener('pointerenter', () => pointer.inside = true); canvas.addEventListener('pointerleave', () => { pointer.inside = false; pointer.down = false; });
  canvas.addEventListener('pointerdown', e => { if (e.button === 0) { pointer.down = true; canvas.setPointerCapture?.(e.pointerId); } });
  window.addEventListener('pointerup', e => { if (e.button === 0) pointer.down = false; });
  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape') { if (state === 'playing' || state === 'paused') pause(); }
    if (e.code === 'KeyR') startReload();
    if (e.code === 'Enter' && (state === 'dead' || state === 'menu')) reset();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { pointer.down = false; keys.clear(); if (state === 'playing') pause(); });
  $('startButton').addEventListener('click', reset); $('retryButton').addEventListener('click', reset); $('resumeButton').addEventListener('click', pause);
  $('soundButton').addEventListener('click', () => { soundOn = !soundOn; $('soundButton').innerHTML = soundOn ? '<span class="sound-icon">♪</span>' : '<span class="sound-icon">×</span>'; $('soundButton').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound'); if (soundOn) sound(500, .08, 'sine', .02); });

  function tryDash() {
    if (state !== 'playing' || dashCooldown > 0 || player.stamina < 26) return;
    let dx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    let dy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
    if (!dx && !dy) { dx = Math.cos(player.angle); dy = Math.sin(player.angle); }
    const len = Math.hypot(dx, dy) || 1; player.x += dx / len * 125; player.y += dy / len * 125; player.x = clamp(player.x, 35, WORLD.w - 35); player.y = clamp(player.y, 35, WORLD.h - 35);
    player.stamina -= 26; player.invuln = .32; dashCooldown = 1.6; shake = 5; sound(90, .13, 'sawtooth', .04);
    for (let i = 0; i < 10; i++) particles.push({ x: player.x, y: player.y, vx: -dx * rnd(50, 180) + rnd(-35, 35), vy: -dy * rnd(50, 180) + rnd(-35, 35), life: rnd(.12, .32), max: .32, size: rnd(2, 5), color: '#b7cc8b' });
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function spawnZombie() {
    const a = rnd(0, Math.PI * 2), d = rnd(490, 690); let x = player.x + Math.cos(a) * d, y = player.y + Math.sin(a) * d;
    x = clamp(x, 35, WORLD.w - 35); y = clamp(y, 35, WORLD.h - 35);
    const brute = wave >= 3 && Math.random() < Math.min(.13 + wave * .025, .42);
    zombies.push({ x, y, radius: brute ? 22 : rnd(13, 17), hp: brute ? 3 : (wave > 5 && Math.random() < .18 ? 2 : 1), maxHp: brute ? 3 : 1, speed: (brute ? 31 : rnd(37, 52)) + Math.min(wave * 1.4, 17), angle: 0, attack: rnd(.2, .8), hit: 0, wobble: rnd(0, 6), color: Math.random() < .5 ? '#566251' : '#68705b', brute });
  }
  function fire() {
    if (fireTimer > 0 || reloadTimer > 0) return;
    if (player.clip <= 0) { $('weaponState').textContent = 'EMPTY'; sound(95, .04, 'triangle', .015); if (player.reserve > 0) startReload(); return; }
    player.clip--; fireTimer = .115; player.recoil = .08; const aim = Math.atan2(pointer.y - VIEW.h / 2, pointer.x - VIEW.w / 2); player.angle = aim;
    const spread = rnd(-.035, .035), angle = aim + spread, sx = player.x + Math.cos(angle) * 20, sy = player.y + Math.sin(angle) * 20;
    let target = null, bestDist = 510;
    for (const z of zombies) {
      const dx = z.x - sx, dy = z.y - sy, along = dx * Math.cos(angle) + dy * Math.sin(angle), side = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
      if (along > 0 && along < bestDist && side < z.radius + 5) { target = z; bestDist = along; }
    }
    const maxDist = target ? bestDist : 500;
    bullets.push({ x: sx, y: sy, x2: sx + Math.cos(angle) * maxDist, y2: sy + Math.sin(angle) * maxDist, life: .075, max: .075, color: '#eaf2a5' });
    particles.push({ x: sx, y: sy, vx: Math.cos(angle) * 60 + rnd(-15, 15), vy: Math.sin(angle) * 60 + rnd(-15, 15), life: .07, max: .07, size: 7, color: '#f5dc8a' });
    if (target) {
      target.hp--; target.hit = .12; shake = Math.max(shake, target.brute ? 2.8 : 1.7);
      for (let i = 0; i < 7; i++) particles.push({ x: target.x, y: target.y, vx: rnd(-95, 95), vy: rnd(-95, 95), life: rnd(.18, .48), max: .48, size: rnd(2, 6), color: i % 2 ? '#9a4036' : '#df6653' });
      if (target.hp <= 0) { zombies.splice(zombies.indexOf(target), 1); killed++; waveKills++; $('killCount').innerHTML = `${String(killed).padStart(2, '0')} <small>KILLS</small>`; sound(120, .09, 'sawtooth', .025); if (waveKills >= waveTarget && zombies.length === 0) nextWaveTimer = 2.4; }
      else sound(135, .04, 'triangle', .018);
    }
    sound(rnd(80, 110), .065, 'square', .018); player.recoil = .1;
    if (player.clip === 0) $('weaponState').textContent = 'EMPTY'; updateHud();
  }

  function update(dt) {
    if (state !== 'playing') return;
    elapsed += dt; clockSeconds += dt; fireTimer = Math.max(0, fireTimer - dt); hurtFlash = Math.max(0, hurtFlash - dt); dashCooldown = Math.max(0, dashCooldown - dt); shake = Math.max(0, shake - dt * 13); player.invuln = Math.max(0, player.invuln - dt); player.recoil = Math.max(0, player.recoil - dt);
    if (toastTimer > 0 && (toastTimer -= dt) <= 0) $('toast').classList.remove('show');
    if (reloadTimer > 0) { reloadTimer -= dt; const progress = 1 - reloadTimer / 1.25; $('reloadProgress').firstElementChild.style.width = `${Math.max(0, progress * 100)}%`; if (reloadTimer <= 0) finishReload(); }
    let dx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    let dy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
    let moving = !!(dx || dy); if (moving) { const n = Math.hypot(dx, dy); dx /= n; dy /= n; player.x += dx * 215 * dt; player.y += dy * 215 * dt; }
    player.x = clamp(player.x, 32, WORLD.w - 32); player.y = clamp(player.y, 32, WORLD.h - 32); player.moving = moving ? Math.min(1, player.moving + dt * 5) : Math.max(0, player.moving - dt * 5);
    player.stamina = Math.min(100, player.stamina + dt * (dashCooldown > .9 ? 5 : 12)); if (pointer.inside) player.angle = Math.atan2(pointer.y - VIEW.h / 2, pointer.x - VIEW.w / 2);
    if (pointer.down) fire();
    spawnTimer -= dt;
    const activeCount = waveKills + zombies.length;
    if (activeCount < waveTarget && spawnTimer <= 0) { spawnZombie(); spawnTimer = Math.max(.3, 1.55 - wave * .055) * rnd(.72, 1.25); }
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i], vx = player.x - z.x, vy = player.y - z.y, dist = Math.hypot(vx, vy) || 1; z.angle = Math.atan2(vy, vx); z.wobble += dt * (z.brute ? 3 : 5);
      if (dist > z.radius + player.radius + 5) { z.x += vx / dist * z.speed * dt; z.y += vy / dist * z.speed * dt; }
      else { z.attack -= dt; if (z.attack <= 0 && player.invuln <= 0) { player.hp -= z.brute ? 15 : 8; player.invuln = .5; hurtFlash = .3; shake = 7; z.attack = 1.05; sound(70, .12, 'sawtooth', .04); if (player.hp <= 0) { player.hp = 0; updateHud(); endGame(); return; } } }
      z.hit = Math.max(0, z.hit - dt);
    }
    if (waveKills >= waveTarget && zombies.length === 0) { if (!nextWaveTimer) nextWaveTimer = 2.1; else { nextWaveTimer -= dt; if (nextWaveTimer <= 0) startNextWave(); } } else nextWaveTimer = 0;
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.max(0, 1 - dt * 2.8); p.vy *= Math.max(0, 1 - dt * 2.8); p.life -= dt; }
    particles = particles.filter(p => p.life > 0); for (const b of bullets) b.life -= dt; bullets = bullets.filter(b => b.life > 0);
    camera.x += (player.x - camera.x) * Math.min(1, dt * 5.5); camera.y += (player.y - camera.y) * Math.min(1, dt * 5.5);
    updateHud();
  }
  function updateHud() {
    if (!player) return;
    $('healthFill').style.width = `${player.hp}%`; $('staminaFill').style.width = `${player.stamina}%`; $('healthText').textContent = String(Math.ceil(player.hp)).padStart(3, '0'); $('staminaText').textContent = String(Math.ceil(player.stamina)).padStart(3, '0');
    $('ammoClip').textContent = String(player.clip).padStart(2, '0'); $('ammoReserve').textContent = String(player.reserve).padStart(3, '0');
    const p = waveTarget ? waveKills / waveTarget : 0; $('waveProgress').style.width = `${p * 100}%`;
    $('waveMeta').textContent = nextWaveTimer > 0 ? `NEXT WAVE IN ${Math.ceil(nextWaveTimer)} SEC` : `${zombies.length} HOSTILE${zombies.length === 1 ? '' : 'S'} / ${waveTarget - waveKills} REMAINING`;
    const total = 23 * 3600 + 48 * 60 + 16 + Math.floor(clockSeconds); $('clockText').textContent = `${String(Math.floor(total / 3600) % 24).padStart(2, '0')}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function ground() {
    ctx.fillStyle = '#303d31'; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let y = 0; y < WORLD.h; y += 84) for (let x = 0; x < WORLD.w; x += 84) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, n = seed - Math.floor(seed);
      ctx.fillStyle = n > .58 ? 'rgba(147,154,103,.035)' : 'rgba(5,13,9,.045)'; ctx.fillRect(x, y, 84, 84);
      if (n > .77) { ctx.strokeStyle = 'rgba(12,21,14,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 15 + n * 25, y + 50); ctx.lineTo(x + 25 + n * 38, y + 45); ctx.lineTo(x + 35 + n * 40, y + 63); ctx.stroke(); }
    }
    // Cracked asphalt streets make a readable, ruined city block around the combat zone.
    ctx.fillStyle = '#222a25'; ctx.fillRect(0, 235, WORLD.w, 105); ctx.fillRect(0, 1470, WORLD.w, 112); ctx.fillRect(330, 0, 108, WORLD.h); ctx.fillRect(2140, 0, 112, WORLD.h);
    ctx.strokeStyle = 'rgba(192,190,145,.24)'; ctx.lineWidth = 2; ctx.setLineDash([25, 28]); ctx.beginPath(); ctx.moveTo(0, 288); ctx.lineTo(WORLD.w, 288); ctx.moveTo(0, 1525); ctx.lineTo(WORLD.w, 1525); ctx.moveTo(384, 0); ctx.lineTo(384, WORLD.h); ctx.moveTo(2195, 0); ctx.lineTo(2195, WORLD.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(155,164,132,.12)'; ctx.lineWidth = 2;
    for (let i = 0; i < 42; i++) { let x = (i * 193) % WORLD.w, y = (i * 317) % WORLD.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12 + (i % 5) * 6, y + 4 + (i % 3) * 6); ctx.stroke(); }
    for (const p of props) drawProp(p);
    for (let i = 0; i < 95; i++) { let x = (i * 139 + 73) % WORLD.w, y = (i * 271 + 31) % WORLD.h; if (inRoad(x, y)) continue; ctx.fillStyle = i % 3 ? 'rgba(16,25,17,.22)' : 'rgba(172,157,112,.16)'; ctx.beginPath(); ctx.ellipse(x, y, 2 + i % 4, 1 + i % 3, i, 0, Math.PI * 2); ctx.fill(); }
  }
  function inRoad(x, y) { return (y > 235 && y < 340) || (y > 1470 && y < 1582) || (x > 330 && x < 438) || (x > 2140 && x < 2252); }
  function makeProps() {
    props = [];
    for (let i = 0; i < 52; i++) {
      const x = rnd(80, WORLD.w - 80), y = rnd(80, WORLD.h - 80); if (inRoad(x, y) || Math.hypot(x - 1300, y - 950) < 220) continue;
      const type = Math.random(); props.push({ x, y, type: type < .43 ? 'bush' : type < .69 ? 'rubble' : type < .82 ? 'barrel' : 'car', rot: rnd(-.25, .25), scale: rnd(.65, 1.3), hue: Math.random() });
    }
  }
  makeProps();
  function drawProp(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(p.scale, p.scale);
    if (p.type === 'bush') {
      ctx.fillStyle = '#202e22'; ctx.beginPath(); ctx.ellipse(0, 5, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
      for (let j = 0; j < 5; j++) { const a = j * 2.4; ctx.fillStyle = ['#46553a','#3e4c35','#536044'][j % 3]; ctx.beginPath(); ctx.arc(Math.cos(a) * 10, Math.sin(a) * 6, 8, 0, Math.PI * 2); ctx.fill(); }
    } else if (p.type === 'rubble') {
      ctx.fillStyle = '#42473b'; for (let j = 0; j < 5; j++) { ctx.save(); ctx.translate((j % 3) * 10 - 10, Math.floor(j / 3) * 8 - 3); ctx.rotate(j * 1.4); ctx.fillRect(-6, -4, 13, 8); ctx.restore(); }
    } else if (p.type === 'barrel') {
      ctx.fillStyle = '#222a22'; ctx.fillRect(-7, -9, 14, 20); ctx.fillStyle = p.hue > .5 ? '#a64c38' : '#697142'; ctx.fillRect(-6, -8, 12, 16); ctx.fillStyle = '#252c23'; ctx.fillRect(-7, -5, 14, 2); ctx.fillRect(-7, 3, 14, 2); ctx.fillStyle = '#c9bd7a'; ctx.fillRect(-3, -7, 1, 5);
    } else {
      ctx.fillStyle = '#141a17'; ctx.fillRect(-22, -11, 44, 24); ctx.fillStyle = p.hue > .5 ? '#464c42' : '#555d4a'; ctx.fillRect(-19, -10, 38, 19); ctx.fillStyle = '#27312d'; ctx.fillRect(-10, -8, 18, 15); ctx.fillStyle = '#8b986f'; ctx.fillRect(16, -8, 3, 5); ctx.fillStyle = '#b64a3f'; ctx.fillRect(-20, 6, 3, 4); ctx.fillStyle = '#101512'; ctx.fillRect(-15, -13, 10, 3); ctx.fillRect(9, -13, 10, 3); ctx.fillRect(-15, 11, 10, 3); ctx.fillRect(9, 11, 10, 3);
    }
    ctx.restore();
  }

  function drawWorld() {
    const sx = VIEW.w / 2 - camera.x + (shake ? rnd(-shake, shake) : 0), sy = VIEW.h / 2 - camera.y + (shake ? rnd(-shake, shake) : 0);
    ctx.save(); ctx.translate(sx, sy); ground();
    for (const b of bullets) { ctx.globalAlpha = b.life / b.max; ctx.strokeStyle = b.color; ctx.lineWidth = 2.3; ctx.shadowColor = '#f1efa5'; ctx.shadowBlur = 7; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x2, b.y2); ctx.stroke(); ctx.shadowBlur = 0; } ctx.globalAlpha = 1;
    for (const z of zombies) drawZombie(z);
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * Math.max(.35, p.life / p.max), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    if (player) drawPlayer();
    ctx.restore();
  }
  function drawZombie(z) {
    ctx.save(); ctx.translate(z.x, z.y + Math.sin(z.wobble) * 1.5); ctx.rotate(z.angle + Math.PI / 2);
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(0, 6, z.radius * 1.15, z.radius * .78, 0, 0, Math.PI * 2); ctx.fill();
    const skin = z.hit ? '#c57562' : z.color;
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, 1, z.radius * .72, z.radius, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = z.brute ? '#343c32' : '#3c4538'; ctx.beginPath(); ctx.ellipse(0, -z.radius * .2, z.radius * .72, z.radius * .5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#89866a'; ctx.beginPath(); ctx.arc(0, -z.radius * .78, z.radius * .46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7d0ac'; ctx.fillRect(-z.radius * .35, -z.radius * .91, z.radius * .16, 2); ctx.fillRect(z.radius * .19, -z.radius * .91, z.radius * .16, 2);
    ctx.strokeStyle = z.hit ? '#e5c4a0' : skin; ctx.lineWidth = z.brute ? 5 : 3.5; ctx.lineCap = 'round';
    const swing = Math.sin(z.wobble) * 4; ctx.beginPath(); ctx.moveTo(-z.radius * .52, -1); ctx.lineTo(-z.radius * .9, 4 + swing); ctx.moveTo(z.radius * .52, -1); ctx.lineTo(z.radius * .9, 4 - swing); ctx.stroke();
    if (z.brute) { ctx.strokeStyle = '#b7b68e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, z.radius + 2, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawPlayer() {
    const p = player; ctx.save(); ctx.translate(p.x, p.y); const blink = p.invuln > 0 && Math.floor(elapsed * 20) % 2 === 0; ctx.globalAlpha = blink ? .45 : 1;
    ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(0, 9, 19, 13, 0, 0, Math.PI * 2); ctx.fill();
    const bob = Math.sin(elapsed * 12) * p.moving * 1.8;
    ctx.save(); ctx.rotate(p.angle); ctx.translate(0, bob);
    ctx.fillStyle = '#293a31'; ctx.beginPath(); ctx.ellipse(-1, 0, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#718064'; ctx.beginPath(); ctx.arc(0, -4, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d2b992'; ctx.beginPath(); ctx.arc(1, -8, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a4639'; ctx.fillRect(-7, -13, 14, 4); ctx.fillStyle = '#d5ee59'; ctx.fillRect(4, -10, 3, 2);
    // Rifle barrel and stock, pointing along the aim vector.
    ctx.fillStyle = '#1a211c'; ctx.fillRect(-4, -1, 20, 4); ctx.fillStyle = '#89917a'; ctx.fillRect(3, -2, 13, 2); ctx.fillStyle = '#1b211a'; ctx.fillRect(-7, -1, 5, 5);
    if (p.recoil > 0) { ctx.fillStyle = '#f3e99d'; ctx.globalAlpha = p.recoil * 5; ctx.beginPath(); ctx.moveTo(17, 1); ctx.lineTo(27, -4); ctx.lineTo(23, 2); ctx.lineTo(29, 7); ctx.closePath(); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(213,238,89,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.hp / 100); ctx.stroke(); ctx.restore();
  }

  function drawMinimap() {
    const w = mini.width, h = mini.height; mctx.clearRect(0, 0, w, h); mctx.fillStyle = '#17221b'; mctx.fillRect(0, 0, w, h);
    mctx.strokeStyle = '#68765b'; mctx.globalAlpha = .5; mctx.lineWidth = 5; mctx.strokeRect(0, 0, w, h); mctx.globalAlpha = 1;
    mctx.fillStyle = '#333b32'; mctx.fillRect(0, h * 235 / WORLD.h, w, h * 105 / WORLD.h); mctx.fillRect(0, h * 1470 / WORLD.h, w, h * 112 / WORLD.h); mctx.fillRect(w * 330 / WORLD.w, 0, w * 108 / WORLD.w, h); mctx.fillRect(w * 2140 / WORLD.w, 0, w * 112 / WORLD.w, h);
    const zx = x => x / WORLD.w * w, zy = y => y / WORLD.h * h;
    for (const z of zombies) { mctx.fillStyle = '#ec6b54'; mctx.beginPath(); mctx.arc(zx(z.x), zy(z.y), z.brute ? 2.5 : 1.7, 0, Math.PI * 2); mctx.fill(); }
    if (player) { mctx.fillStyle = '#d5ee59'; mctx.shadowColor = '#d5ee59'; mctx.shadowBlur = 8; mctx.beginPath(); mctx.arc(zx(player.x), zy(player.y), 3.3, 0, Math.PI * 2); mctx.fill(); mctx.shadowBlur = 0; mctx.strokeStyle = '#d5ee5988'; mctx.beginPath(); mctx.arc(zx(player.x), zy(player.y), 7, 0, Math.PI * 2); mctx.stroke(); }
  }
  function drawCrosshair() {
    if (!pointer.inside || state !== 'playing') return;
    ctx.save(); ctx.translate(pointer.x, pointer.y); ctx.strokeStyle = '#e6efbd'; ctx.lineWidth = 1; ctx.globalAlpha = .85; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.moveTo(-13, 0); ctx.lineTo(-5, 0); ctx.moveTo(13, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -13); ctx.lineTo(0, -5); ctx.moveTo(0, 13); ctx.lineTo(0, 5); ctx.stroke(); ctx.fillStyle = '#d5ee59'; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  function render() {
    ctx.clearRect(0, 0, VIEW.w, VIEW.h);
    if (!player) { player = { x: 1300, y: 950, radius: 16, hp: 100, stamina: 100, angle: -Math.PI / 3, clip: 30, reserve: 120, invuln: 0, moving: .2, recoil: 0 }; camera.x = player.x; camera.y = player.y; }
    if (state === 'menu') {
      // Quiet ambient infected silhouettes before deployment.
      if (!window.menuZombies) window.menuZombies = [0,1,2,3].map((_, i) => ({ x: 1150 + i * 95, y: 690 + Math.sin(i * 3) * 85, radius: 14, hp: 1, maxHp: 1, speed: 0, angle: -2.7 + i * .2, attack: 1, hit: 0, wobble: i, color: '#475342', brute: false }));
      zombies = window.menuZombies;
    }
    drawWorld(); drawMinimap(); drawCrosshair();
    if (state === 'menu') zombies = [];
    if (hurtFlash > 0 && state === 'playing') { ctx.fillStyle = `rgba(211,55,43,${hurtFlash * .28})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h); }
    if (state === 'menu') { ctx.fillStyle = 'rgba(6,10,8,.08)'; ctx.fillRect(0, 0, VIEW.w, VIEW.h); }
  }
  function frame(now) { const dt = Math.min(.04, Math.max(0, (now - last) / 1000)); last = now; update(dt); render(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
