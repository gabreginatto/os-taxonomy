import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.glb':'model/gltf-binary','.mp4':'video/mp4'};
export async function serveDirectory(root,port=0,host='127.0.0.1') {
  const base=fs.realpathSync(root);
  const server=http.createServer((req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let filename=path.resolve(base,'.'+pathname);
      if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
      const real=fs.realpathSync(filename);
      if(real!==base&&!real.startsWith(base+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
      res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Cache-Control':'no-store'});
      fs.createReadStream(real).pipe(res);
    }catch {res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return {server,port:server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
}
