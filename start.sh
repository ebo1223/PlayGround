#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="${BASH_SOURCE[0]%/*}"
[[ "$SCRIPT_DIR" == "${BASH_SOURCE[0]}" ]] && SCRIPT_DIR=.
PROJECT_DIR="$(cd "$SCRIPT_DIR" && pwd -P)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
OUTPUT_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="/home/runner/work/_temp/omgithub-web/deployment-output.json"

/usr/bin/time -p mkdir -p "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR is required}" "$(dirname "$DEPLOYMENT_FILE")"

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p node -e "const p=require('./package.json'); process.exit(p.scripts?.build ? 0 : 1)"; then
    /usr/bin/time -p npm run build
  fi
  if [[ -f "$OUTPUT_DIR/index.html" ]]; then
    :
  elif [[ -f "$PROJECT_DIR/build/index.html" ]]; then
    OUTPUT_DIR="$PROJECT_DIR/build"
  elif [[ -f "$PROJECT_DIR/index.html" ]]; then
    OUTPUT_DIR="$PROJECT_DIR"
  else
    echo 'Build completed without a static index.html in dist/, build/, or the project root.' >&2
    exit 1
  fi
elif [[ -f "$PROJECT_DIR/index.html" ]]; then
  OUTPUT_DIR="$PROJECT_DIR"
else
  # A self-contained playable fallback keeps a fresh checkout previewable until
  # the project supplies its own static app or package build.
  /usr/bin/time -p mkdir -p "$OUTPUT_DIR"
  /usr/bin/time -p cat > "$OUTPUT_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101114"><title>Escape the Asylum</title>
<style>
:root{color-scheme:dark;--ink:#d7d0bc;--muted:#858579;--red:#a53832;--panel:#17191a}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% 30%,#272724 0,#111213 60%,#090a0b 100%);color:var(--ink);font:16px/1.5 Georgia,serif;min-height:100vh}button{font:inherit;color:inherit;background:#262726;border:1px solid #625c4e;padding:.8rem 1rem;cursor:pointer;transition:.15s}button:hover,button:focus-visible{background:#3b332a;border-color:#b39068;outline:0}button:disabled{opacity:.42;cursor:not-allowed}.shell{max-width:980px;margin:auto;padding:20px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #49463e;padding:10px 0}.brand{letter-spacing:.18em;text-transform:uppercase;font:700 12px Arial,sans-serif;color:#b9aa8b}.status{font:12px Arial,sans-serif;color:#b4ad9c}.hero{max-width:680px;margin:12vh auto 0;text-align:center}.eyebrow{letter-spacing:.28em;color:#a6483e;font:700 11px Arial,sans-serif;text-transform:uppercase}.hero h1{font-size:clamp(44px,9vw,88px);line-height:.96;font-weight:400;margin:18px 0}.hero p{color:#b7b2a5}.hero button{margin-top:20px;background:#752c29;border-color:#b34c43;letter-spacing:.1em;text-transform:uppercase}.game{display:none;margin:30px auto;max-width:780px}.room{min-height:300px;border:1px solid #4d493f;background:linear-gradient(180deg,#292a28,#131515 70%);padding:clamp(20px,5vw,48px);position:relative;box-shadow:0 12px 50px #0008}.room:before{content:"";position:absolute;inset:10px;border:1px solid #ffffff0b;pointer-events:none}.room h2{font-size:clamp(28px,5vw,42px);font-weight:400;margin:0 0 8px}.room p{color:#b4b1a6;max-width:600px}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.bar{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.box{border:1px solid #393a36;background:#121414;padding:14px}.box h3{margin:0 0 8px;font:700 11px Arial,sans-serif;letter-spacing:.14em;color:#aaa18c;text-transform:uppercase}.items{display:flex;gap:7px;flex-wrap:wrap}.item{border:1px solid #514b3d;padding:4px 8px;font-size:13px;color:#d2c19a}.log{height:110px;overflow:auto;color:#99998e;font-size:14px}.danger{color:#d27869}.ending{color:#c3b994}.footer{text-align:center;color:#67685f;font:11px Arial,sans-serif;margin:26px}
@media(max-width:600px){.shell{padding:14px}.hero{margin-top:15vh}.room{min-height:280px}.bar{grid-template-columns:1fr}.log{height:80px}.actions button{flex:1 1 100%}}
</style></head><body><main class="shell"><header class="top"><span class="brand">St. Agnes · Patient 031</span><span class="status" id="status">NO SIGNAL · 03:17 AM</span></header>
<section class="hero" id="intro"><div class="eyebrow">A point-and-click escape game</div><h1>Escape the<br>Asylum</h1><p>You wake beneath a flickering light. The ward door is locked. Somewhere in this building, a night watchman is making his rounds.</p><p><em>Look closely. Take what you find. Keep quiet.</em></p><button id="begin">Wake up</button></section>
<section class="game" id="game"><article class="room"><div class="eyebrow" id="chapter">THE WARD · 03:17 AM</div><h2 id="roomName">Observation Ward</h2><p id="description"></p><div class="actions" id="actions"></div></article><div class="bar"><section class="box"><h3>What you carry</h3><div class="items" id="inventory">Nothing yet</div></section><section class="box"><h3>Field notes</h3><div class="log" id="log" aria-live="polite"></div></section></div></section><footer class="footer">A quiet mind is a useful thing. Move with WASD or choose an action.</footer></main>
<script>
(()=>{const $=s=>document.querySelector(s), state={room:'ward',items:new Set(),power:false,door:false,watch:0,won:false};const rooms={ward:['Observation Ward','Rain ticks against the barred window. A rusted bed, a bolted nightstand, and a door with a keypad. The corridor beyond is dark.'],hall:['North Corridor','A long corridor smells of bleach and wet stone. A security desk sits beneath a dead camera. The records room is ajar; stairs descend toward the generator.'],records:['Records Room','Patient files slouch in metal drawers. One drawer hangs open. The corridor waits beyond the door.'],generator:['Generator Room','The old generator coughs in the dark. A breaker panel is missing its fuse. The service stairs lead back to the corridor.'],exit:['Service Exit','A steel door stands beneath a red EXIT sign. The magnetic lock is silent now.']};function note(t){const e=document.createElement('div');e.textContent='— '+t;$('#log').prepend(e)}function draw(){const [name,text]=rooms[state.room];if(state.won){$('#roomName').textContent=name;$('#description').innerHTML='<span class="ending">Cold night air. Rain. Freedom. Behind you, the asylum glows red through the storm. You made it out.</span>';$('#chapter').textContent='THE SERVICE EXIT · 03:29 AM';$('#actions').innerHTML='<button onclick="location.reload()">Play again</button>';return}$('#roomName').textContent=name;$('#description').textContent=text;$('#chapter').textContent=state.room==='exit'?'THE SERVICE EXIT · 03:29 AM':name.toUpperCase()+' · 03:17 AM';const inv=[...state.items];$('#inventory').innerHTML=inv.length?inv.map(x=>'<span class="item">'+x+'</span>').join(''):'Nothing yet';const a=[];const add=(label,fn,disabled=false)=>a.push([label,fn,disabled]);if(state.room==='ward'){add('Search the nightstand',()=>{if(!state.items.has('Bent spoon')){state.items.add('Bent spoon');note('A bent spoon, sharpened against the bedframe.');}else note('Only dust and old scratches.');});add('Inspect the keypad',()=>{if(state.items.has('Patient note')){let code=prompt('The note is smudged. Enter the four-digit code:');if(code==='1947'){state.door=true;note('The keypad clicks green. The ward door unlocks.');}else note('A harsh beep. The watchman stirs somewhere nearby.');}else note('Four digits. There may be a clue in the records.');});add('Pry open the vent',()=>{if(state.items.has('Bent spoon')){state.items.add('Brass key');note('The spoon bends. Behind the vent: a small brass key.');}else note('The screws are too tight to turn by hand.');});add('Go to the corridor',()=>{if(state.door||state.items.has('Bent spoon')){state.room='hall';note(state.door?'The door opens without a sound.':'The spoon bends the latch just enough. The door opens.');}else note('Locked. Search the nightstand for something to work the latch.');});}if(state.room==='hall'){add('Enter the records room',()=>state.room='records');add('Descend to the generator',()=>{if(state.items.has('Brass key'))state.room='generator';else note('The lower stairwell is locked. A brass keyhole.');});add('Return to the ward',()=>state.room='ward');add('Check the security desk',()=>{if(!state.items.has('Fuse')){state.items.add('Fuse');note('A spare ceramic fuse, tucked beneath the shift log.');}else note('The desk is empty.');});}if(state.room==='records'){add('Search the open drawer',()=>{if(!state.items.has('Patient note')){state.items.add('Patient note');note('A note in your own handwriting: “The date on my chart. 19 / 47.”');}else note('Nothing else in the drawer.');});add('Go back to the corridor',()=>state.room='hall');}if(state.room==='generator'){add(state.power?'Generator is running':'Install the fuse',()=>{if(state.items.has('Fuse')){state.power=true;note('The generator roars to life. Emergency lights flood the hall.');}else note('The fuse socket is empty.');},state.power);add('Climb to the corridor',()=>state.room='hall');}if(state.room==='exit'){add('Push through the service door',()=>{if(state.power){state.won=true;$('#description').innerHTML='<span class="ending">Cold night air. Rain. Freedom. Behind you, the asylum glows red through the storm. You made it out.</span>';note('ESCAPED. The night is yours.');$('#actions').innerHTML='<button onclick="location.reload()">Play again</button>';return;}note('The magnetic lock is engaged. Restore power first.');});add('Return to the corridor',()=>state.room='hall');}if(state.room==='hall'||state.room==='generator')add('Try the service exit',()=>{state.room='exit';note('A red EXIT sign burns above a steel door.');});if(state.room==='hall'&&++state.watch%4===0)note('Footsteps echo from the far end. Hide in the shadows.');$('#actions').innerHTML='';for(const [label,fn,disabled]of a){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{fn();draw()};$('#actions').append(b)}}$('#begin').onclick=()=>{$('#intro').style.display='none';$('#game').style.display='block';note('You sit up slowly. The room tilts. Somewhere: a key ring, then silence.');draw()};document.addEventListener('keydown',e=>{if($('#game').style.display==='block'&&['w','a','s','d'].includes(e.key.toLowerCase())){const buttons=[...$('#actions').querySelectorAll('button:not(:disabled)')];buttons[['w','a','s','d'].indexOf(e.key.toLowerCase())%buttons.length]?.click()}})})();
</script></body></html>
HTML
fi

/usr/bin/time -p node -e 'const fs=require("node:fs"),path=require("node:path");const f=process.argv[1];fs.writeFileSync(f,JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' "$DEPLOYMENT_FILE" "$PROJECT_DIR" "$OUTPUT_DIR"

# Serve the built directory with a small dependency-free static server in the foreground.
/usr/bin/time -p node --input-type=module - "$OUTPUT_DIR" "$PORT" <<'NODE'
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
const root = resolve(process.argv[2]);
const port = Number(process.argv[3]);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + '/')) { res.writeHead(403); res.end('Forbidden'); return; }
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { file = join(root, 'index.html'); }
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '0.0.0.0', () => console.log(`Serving ${root} on port ${port}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
NODE
