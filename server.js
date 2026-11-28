const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const port = 3002;
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
http.createServer((req,res)=>{
  let p = req.url === '/' ? 'index.html' : req.url.split('?')[0].slice(1);
  p = path.normalize(p).replace(/^\.\.(\/|\\|$)/,'');
  const f = path.join(root,p);
  fs.readFile(f,(e,d)=>{ if(e){res.statusCode=404;res.end('Not found');return;} res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(d); });
}).listen(port,'0.0.0.0',()=>console.log('Werewolf Survival http://localhost:'+port));
