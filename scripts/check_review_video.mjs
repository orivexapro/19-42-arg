// Decode the delivered file at normal playback speed in an isolated Chrome session.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const file = await readFile(process.argv[2]);
const profile = await mkdtemp(join(tmpdir(), 'arg-braise-review-'));
let deliver;
const completed = new Promise(resolve => { deliver = resolve; });
const page = `<!doctype html><video id="v" playsinline></video><script>
const v = document.querySelector('video');
const report = data => fetch('/result', {method:'POST', body: JSON.stringify(data)});
v.onerror = () => report({error: v.error.message});
v.onended = () => report({ended:v.ended, duration:v.duration, width:v.videoWidth,
    height:v.videoHeight, decoded:v.getVideoPlaybackQuality().totalVideoFrames,
    dropped:v.getVideoPlaybackQuality().droppedVideoFrames,
    audioBytes:v.webkitAudioDecodedByteCount, played:v.played.end(v.played.length-1)});
v.src='/review.mp4';
v.play().catch(err => report({error:err.message}));
</script>`;
const server = createServer(async (req, res) => {
    if (req.url === '/review.mp4') {
        const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
        const first = range ? Number(range[1]) : 0;
        const last = range?.[2] ? Number(range[2]) : file.length - 1;
        res.writeHead(range ? 206 : 200, {'Content-Type':'video/mp4',
            'Accept-Ranges':'bytes', 'Content-Length':last-first+1,
            ...(range ? {'Content-Range':`bytes ${first}-${last}/${file.length}`} : {})});
        res.end(file.subarray(first, last+1));
    } else if (req.url === '/result' && req.method === 'POST') {
        const parts = [];
        for await (const chunk of req) parts.push(chunk);
        res.end(); deliver(JSON.parse(Buffer.concat(parts)));
    } else {
        res.writeHead(200, {'Content-Type':'text/html'}); res.end(page);
    }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const chrome = process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child = spawn(chrome, ['--headless=new', '--no-first-run', '--disable-gpu',
    '--autoplay-policy=no-user-gesture-required', '--remote-debugging-pipe',
    '--user-data-dir='+profile, 'http://127.0.0.1:'+server.address().port],
    {windowsHide:true, stdio:['ignore','ignore','ignore','pipe','pipe']});
child.on('error', e => deliver({error:e.message}));
const timeout = setTimeout(() => deliver({error:'Playback timeout'}), 60000);
try {
    const result = await completed;
    console.log(JSON.stringify(result));
    if (!result.ended || result.width !== 854 || result.height !== 480 ||
        Math.abs(result.played-16) > .05 || result.decoded < 475 || !result.audioBytes)
        process.exitCode = 1;
} finally {
    clearTimeout(timeout);
    if (!child.killed && child.stdio[3].writable)
        child.stdio[3].end(JSON.stringify({id:1,method:'Browser.close'})+'\0');
    server.closeAllConnections();server.close();
}
