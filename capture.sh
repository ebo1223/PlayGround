#!/usr/bin/env bash
set -euo pipefail

run() { /usr/bin/time -p "$@"; }
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence directory}"
run mkdir -p "$CAPTURE_DIR"
exec /usr/bin/time -p node --input-type=module <<'CAPTURE'
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const runtime=join(process.env.HOME,'.local/share/omgithub-playwright');
const require=createRequire(join(runtime,'package.json'));
const {chromium}=require('playwright');
const config=JSON.parse(readFileSync(join(runtime,process.platform==='darwin'?'metal.json':'linux.json'),'utf8'));
if(process.platform==='linux'&&!process.env.DISPLAY)process.env.DISPLAY=':'+readFileSync(join(runtime,'display'),'utf8').trim();
const url=process.env.CAPTURE_URL,output=process.env.CAPTURE_DIR;
mkdirSync(output,{recursive:true});
const transient=error=>Object.assign(error,{exitCode:75});
let browser;
try {
  browser=await chromium.launch({...config.browser.launchOptions,timeout:30000}).catch(error=>{throw transient(error)});
  for(const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}).catch(error=>{throw transient(error)});
    page.setDefaultTimeout(25000);
    const defects=[];
    page.on('pageerror',error=>defects.push(error.message));
    page.on('response',response=>{
      try{if(response.status()>=400&&new URL(response.url()).origin===new URL(url).origin)defects.push(`HTTP ${response.status()} ${response.url()}`)}catch{}
    });
    let response;
    try{response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000})}catch(error){throw transient(error)}
    if(!response?.ok()){
      const status=response?.status();
      if(!status||[408,425,429,500,502,503,504].includes(status))throw transient(new Error(`Preview temporarily unavailable (HTTP ${status||'no response'})`));
      throw new Error(`Preview returned HTTP ${status} at ${url}`);
    }
    await page.locator('#poker-table').waitFor({state:'visible'}).catch(error=>{throw new Error(`Poker table did not render: ${error.message}`)});
    await page.waitForFunction(()=>document.querySelectorAll('#seats .seat').length===4&&document.querySelectorAll('#community .playing-card').length===5,{timeout:20000}).catch(error=>{throw new Error(`Poker game content did not render: ${error.message}`)});
    await page.waitForTimeout(500);
    if(defects.length)throw new Error(`Browser rendering defect: ${defects.join('; ')}`);
    await page.screenshot({path:join(output,`final-${name}.png`),timeout:30000}).catch(error=>{
      if(error.name==='TimeoutError'||!browser.isConnected())throw transient(error);
      throw error;
    });
    console.log(`Captured ${name} at ${width}x${height}: ${join(output,`final-${name}.png`)}`);
    await page.close();
  }
} catch(error){console.error(error);process.exitCode=error.exitCode||1}
finally{await browser?.close().catch(error=>{console.error(error);process.exitCode||=75})}
CAPTURE
