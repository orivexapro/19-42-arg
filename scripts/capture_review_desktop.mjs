import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost'), name=url.pathname.slice(1)||'index.html';
 if(name.includes('..')) throw Error();
 let data=await readFile(join(root,name));
 if(name==='index.html') data=data.toString().replace('<head>','<head><script>localStorage.setItem("arg-19-41-season-one-v2",JSON.stringify({introSeen:true}))</script>');
 res.setHeader('content-type',({'.css':'text/css','.js':'text/javascript','.html':'text/html','.png':'image/png'})[extname(name)]||'application/octet-stream');
 res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const app=spawn(process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--hide-scrollbars','--user-data-dir='+await mkdtemp(join(tmpdir(),'arg-review-')),'--window-size=1280,720','--virtual-time-budget=4000','--screenshot='+join(root,'assets/cinematic/source_assets/generated/desktop-review.png'),'http://127.0.0.1:'+server.address().port],{windowsHide:true,stdio:'ignore'});
try{await new Promise((ok,no)=>{app.on('error',no);app.on('exit',n=>n?no(Error(String(n))):ok())})}finally{server.closeAllConnections();server.close()}
