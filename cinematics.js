import * as THREE from './assets/vendor/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;

function makeAudio(){
  let ctx;
  const start=()=>ctx||(ctx=new (window.AudioContext||window.webkitAudioContext)());
  const tone=(hz,d=.12,vol=.03,type='sine')=>{const c=start(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+d)};
  const noise=(d=.16,vol=.03)=>{const c=start(),b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=vol;s.connect(g).connect(c.destination);s.start()};
  return {tone,noise,resume:()=>start().resume?.()};
}

function box(mat,size,pos,scene,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m}
function labelTexture(lines,bg='#07141d',fg='#b7e9eb'){
  const c=document.createElement('canvas');c.width=768;c.height=432;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,768,432);g.addColorStop(0,bg);g.addColorStop(1,'#0d2733');x.fillStyle=g;x.fillRect(0,0,768,432);
  x.fillStyle='rgba(101,224,222,.08)';for(let i=0;i<18;i++)x.fillRect(0,i*25,768,1);
  x.fillStyle=fg;x.font='700 38px system-ui';x.fillText('ARCHIVE OS',54,82);x.font='20px ui-monospace';
  lines.forEach((s,i)=>x.fillText(s,54,142+i*42));x.fillStyle='#e4ae65';x.fillRect(54,330,242,5);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function makeCharacter(scene){
  const root=new THREE.Group(), cloth=new THREE.MeshStandardMaterial({color:0x243341,roughness:.9}),skin=new THREE.MeshStandardMaterial({color:0xb2775c,roughness:.8}),dark=new THREE.MeshStandardMaterial({color:0x11161a,roughness:.85}),shirt=new THREE.MeshStandardMaterial({color:0xa9b5b0,roughness:.8}),accent=new THREE.MeshStandardMaterial({color:0x8a4a3e,roughness:.8});
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.34,.43,1.08,6),cloth);torso.position.y=1.72;root.add(torso);
  const collar=new THREE.Mesh(new THREE.ConeGeometry(.34,.42,4),shirt);collar.rotation.z=Math.PI;collar.position.set(0,2.07,.29);root.add(collar);
  const lapelL=new THREE.Mesh(new THREE.BoxGeometry(.12,.58,.035),accent);lapelL.position.set(-.12,1.86,.36);lapelL.rotation.z=-.23;root.add(lapelL);const lapelR=lapelL.clone();lapelR.position.x=.12;lapelR.rotation.z=.23;root.add(lapelR);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.2,8),skin);neck.position.y=2.32;root.add(neck);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),skin);head.scale.set(.82,1.08,.9);head.position.y=2.62;root.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.25,8,5,0,Math.PI*2,0,Math.PI*.53),dark);hair.position.set(0,2.79,-.015);hair.rotation.x=-.08;root.add(hair);
  const makeLimb=(x,y,material=cloth)=>{const pivot=new THREE.Group();pivot.position.set(x,y,0);const limb=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.86,6),material);limb.position.y=-.42;limb.castShadow=true;pivot.add(limb);root.add(pivot);return pivot};
  const armL=makeLimb(-.42,2.12),armR=makeLimb(.42,2.12),legL=makeLimb(-.19,1.22,dark),legR=makeLimb(.19,1.22,dark);
  [legL,legR].forEach((l,i)=>{const boot=new THREE.Mesh(new THREE.BoxGeometry(.2,.16,.42),dark);boot.position.set(0,-.86,.12);l.add(boot)});
  const bag=new THREE.Mesh(new THREE.BoxGeometry(.5,.56,.16),new THREE.MeshStandardMaterial({color:0x503f31,roughness:1}));bag.position.set(-.56,1.28,.02);root.add(bag);
  root.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(root);return {root,torso,head,armL,armR,legL,legR,bag};
}
function buildRoom(renderer){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x05090d);scene.fog=new THREE.Fog(0x05090d,9,24);
  const camera=new THREE.PerspectiveCamera(53,1,.05,60);camera.position.set(1.8,2.35,7.6);
  const wood=new THREE.MeshStandardMaterial({color:0x3d3027,roughness:.86}),wall=new THREE.MeshStandardMaterial({color:0x29343a,roughness:1}),floor=new THREE.MeshStandardMaterial({color:0x191c1e,roughness:.72}),metal=new THREE.MeshStandardMaterial({color:0x182128,metalness:.55,roughness:.42}),paper=new THREE.MeshStandardMaterial({color:0xb9af94,roughness:1}),brass=new THREE.MeshStandardMaterial({color:0x9c7432,metalness:.75,roughness:.25});
  box(floor,[12,.2,14],[0,-.1,0],scene);box(wall,[12,5,.2],[0,2.5,-4.4],scene);box(wall,[.2,5,14],[-6,2.5,0],scene);box(wall,[.2,5,14],[6,2.5,0],scene);
  for(let i=-5;i<6;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(.018,.012,14),metal);line.position.set(i,0.015,0);scene.add(line)}
  const doorPivot=new THREE.Group();doorPivot.position.set(-2.15,0,-4.26);const door=new THREE.Mesh(new THREE.BoxGeometry(1.55,3.25,.13),wood);door.position.set(.78,1.62,0);door.castShadow=true;doorPivot.add(door);const handle=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),brass);handle.position.set(1.38,1.63,.11);doorPivot.add(handle);scene.add(doorPivot);
  const desk=box(wood,[3.4,.18,1.45],[1.7,1.06,-1.65],scene);box(wood,[.25,1.05,1.25],[.25,.53,-1.65],scene);box(wood,[.25,1.05,1.25],[3.15,.53,-1.65],scene);
  box(metal,[1.72,1.13,.12],[1.65,1.87,-2.04],scene);const screen=box(new THREE.MeshBasicMaterial({map:labelTexture(['RECOVERY NODE · A-17','SESSION: A. MOREL','19:41:06 · 18.10.2129'])}),[1.55,.88,.02],[1.65,1.88,-1.965],scene,false);
  box(metal,[.12,.63,.12],[1.65,1.28,-2.04],scene);box(metal,[.58,.06,.42],[1.65,1.08,-1.72],scene);
  const keyboard=box(metal,[1.25,.06,.42],[1.42,1.19,-.98],scene);keyboard.rotation.x=-.12;for(let r=0;r<4;r++)for(let c=0;c<12;c++){const k=box(paper,[.07,.018,.05],[.99+c*.08,1.235,-.85-r*.075],scene,false);k.rotation.x=-.12}
  box(metal,[.22,.08,.34],[2.42,1.2,-.93],scene);
  const chair=new THREE.Group();const seat=box(wood,[1,.12,1],[1.65,.72,-.22],scene);const back=box(wood,[1,.95,.12],[1.65,1.15,.25],scene);chair.add(seat,back);scene.add(chair);
  for(const x of [1.25,2.05])for(const z of [-.55,.1])box(metal,[.07,.72,.07],[x,.35,z],scene);
  box(wood,[2.45,.12,.58],[-4.55,3.65,-3.95],scene);for(let y=.55;y<3.6;y+=.82)box(wood,[2.45,.09,.58],[-4.55,y,-3.95],scene);
  for(let y=.75;y<3.5;y+=.82)for(let i=0;i<8;i++)box(new THREE.MeshStandardMaterial({color:[0x6b4b3a,0x344f5d,0x5c614f][i%3],roughness:1}),[.15,.55,.42],[-5.48+i*.27,y,-3.68],scene);
  for(let i=0;i<7;i++){const p=box(paper,[.72,.022,.92],[-.05+i*.025,1.18+i*.025,-1.58+i*.008],scene,false);p.rotation.y=-.08+i*.01}
  const lampStem=box(brass,[.05,.72,.05],[2.92,1.55,-1.25],scene);const shade=new THREE.Mesh(new THREE.ConeGeometry(.3,.32,12,1,true),brass);shade.position.set(2.92,1.95,-1.25);shade.rotation.z=Math.PI;scene.add(shade);
  const windowFrame=box(metal,[2.85,1.65,.1],[-3.15,2.25,-4.18],scene);const windowGlass=box(new THREE.MeshBasicMaterial({color:0x102d3b}),[2.62,1.42,.02],[-3.15,2.25,-4.11],scene,false);for(let i=0;i<30;i++){const drop=box(new THREE.MeshBasicMaterial({color:0x4c90a5}),[.012,.1+Math.random()*.2,.01],[-4.4+Math.random()*2.5,1.62+Math.random()*1.3,-4.08],scene,false);drop.rotation.z=.08}
  const hemi=new THREE.HemisphereLight(0x93bed0,0x17110e,1.05);scene.add(hemi);const key=new THREE.SpotLight(0xd7a862,52,11,Math.PI/5,.5,1.7);key.position.set(2.8,4.2,1.5);key.target.position.set(1.5,1,-1.4);key.castShadow=true;scene.add(key,key.target);const cold=new THREE.PointLight(0x4b9fb5,13,8);cold.position.set(-3,2,-3.5);scene.add(cold);
  const character=makeCharacter(scene);character.root.position.set(-1.35,0,-4.6);character.root.rotation.y=.05;
  return {scene,camera,doorPivot,character,screen,chair};
}
function fit(renderer,camera,canvas){const rect=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix()}

export function playIntro({canvas,onComplete=()=>{},lang='fr',muted=false,duration=36}={}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const room=buildRoom(renderer),audio=makeAudio();let start=performance.now(),seekOffset=0,raf=0,done=false,lastBeat=-1;
  const captions=lang==='fr'?['Le couloir est resté fermé cent ans.','Une journaliste revient sur les lieux.','La machine se souvient.','ARCHIVE OS · SESSION A. MOREL']:['The corridor remained sealed for a century.','A journalist returns to the scene.','The machine remembers.','ARCHIVE OS · A. MOREL SESSION'];
  const caption=document.querySelector('#intro-caption');
  const render=now=>{if(done)return;fit(renderer,room.camera,canvas);const t=((now-start)/1000)+seekOffset,p=clamp(t/duration,0,1),c=room.character;
    room.doorPivot.rotation.y=-ease((t-2)/3)*1.42;
    const walk=ease((t-5)/12);c.root.position.z=lerp(-4.6,-.15,walk);c.root.position.x=lerp(-1.35,1.65,walk);c.root.rotation.y=lerp(.05,Math.PI,walk);
    const stride=Math.sin(t*7)*(.72*(1-ease((t-16)/1.5)));c.legL.rotation.x=stride;c.legR.rotation.x=-stride;c.armL.rotation.x=-stride*.7;c.armR.rotation.x=stride*.7;c.root.position.y=Math.abs(Math.sin(t*7))*.025;
    const sit=ease((t-18)/4);c.root.position.y-=sit*.62;c.torso.rotation.x=sit*.12;c.legL.rotation.x=lerp(c.legL.rotation.x,-1.22,sit);c.legR.rotation.x=lerp(c.legR.rotation.x,-1.22,sit);c.armL.rotation.x=lerp(c.armL.rotation.x,-1.02,sit);c.armR.rotation.x=lerp(c.armR.rotation.x,-1.02,sit);c.head.rotation.x=Math.sin(t*.7)*.025;
    if(t<5){room.camera.position.set(1.9,2.35,7.4);room.camera.lookAt(-1.4,1.55,-4.1)}else if(t<18){const q=ease((t-5)/13);room.camera.position.set(lerp(-.2,4.7,q),lerp(2.25,2.05,q),lerp(3.8,2.1,q));room.camera.lookAt(c.root.position.x,1.45,c.root.position.z)}else if(t<27){const q=ease((t-18)/9);room.camera.position.set(lerp(4.7,1.65,q),lerp(2.05,2.5,q),lerp(2.1,-.02,q));room.camera.lookAt(1.65,1.78,-2)}else{const q=ease((t-27)/8);room.camera.position.set(lerp(1.65,1.65,q),lerp(2.5,1.88,q),lerp(-.02,-.45,q));room.camera.lookAt(1.65,1.88,-2.03)}
    const beat=Math.floor(t);if(!muted&&beat!==lastBeat){lastBeat=beat;if(beat>=6&&beat<=16&&beat%2===0)audio.noise(.09,.018);if(beat===3)audio.noise(.7,.025);if(beat===19)audio.noise(.28,.035);if(beat===31){audio.tone(392,.18,.025);setTimeout(()=>audio.tone(523,.3,.02),170)}}
    if(caption)caption.textContent=t<7?captions[0]:t<18?captions[1]:t<29?captions[2]:captions[3];renderer.render(room.scene,room.camera);if(p>=1)finish();else raf=requestAnimationFrame(render)};
  const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);renderer.dispose();onComplete()};
  const controller={skip:finish,seek:s=>{seekOffset=clamp(s,0,duration);start=performance.now()},destroy:finish,resumeAudio:()=>audio.resume()};window.__cinematic=controller;raf=requestAnimationFrame(render);return controller;
}

export function playUsbReveal({host,onComplete=()=>{},lang='fr',muted=false}={}){
  const overlay=document.createElement('section');overlay.className='usb-transition cinematic-transition';overlay.innerHTML=`<canvas></canvas><div class="cinematic-card"><small>ARCHIVE_M · RECOVERED MEDIA</small><h2>${lang==='fr'?'Une mémoire vient de s’ouvrir.':'A memory has just opened.'}</h2><p>${lang==='fr'?'Le bureau est le même. La certitude, non.':'The room is unchanged. Certainty is not.'}</p><button class="secondary">${lang==='fr'?'Continuer':'Continue'}</button></div>`;(host||document.body).appendChild(overlay);
  const canvas=overlay.querySelector('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;const room=buildRoom(renderer);room.character.root.position.set(1.65,-.62,-.15);room.character.root.rotation.y=Math.PI;room.character.legL.rotation.x=-1.22;room.character.legR.rotation.x=-1.22;let started=performance.now(),raf,ended=false;
  const stop=()=>{if(ended)return;ended=true;cancelAnimationFrame(raf);renderer.dispose();overlay.remove();onComplete()};overlay.querySelector('button').onclick=stop;
  const frame=now=>{fit(renderer,room.camera,canvas);const t=(now-started)/1000,q=ease(t/7);room.camera.position.set(lerp(1.65,4.6,q),lerp(1.88,2.55,q),lerp(-.55,3.4,q));room.camera.lookAt(1.65,1.65,-1.55);room.character.head.rotation.y=Math.sin(t*1.7)*.12;room.character.torso.rotation.x=.1+Math.sin(t*.9)*.015;renderer.render(room.scene,room.camera);if(t>9)stop();else raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame);return {skip:stop};
}

function lowPolyPerson(scene,color=0x6d5748){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}),dark=new THREE.MeshStandardMaterial({color:0x101518,roughness:1});const torso=new THREE.Mesh(new THREE.ConeGeometry(.32,.88,5),mat);torso.position.y=1.15;g.add(torso);const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,0),dark);head.position.y=1.78;g.add(head);for(const x of [-.14,.14]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.065,.08,.78,5),dark);l.position.set(x,.4,0);g.add(l)}g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);return g}

export function createArchiveScene(canvas,id){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.setSize(720,405,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  const scene=new THREE.Scene();scene.background=new THREE.Color(id==='kitchen'?0x211b16:0x081014);scene.fog=new THREE.Fog(scene.background,7,18);const camera=new THREE.PerspectiveCamera(48,16/9,.1,40);camera.position.set(4,2.6,6);camera.lookAt(0,1,0);
  const concrete=new THREE.MeshStandardMaterial({color:0x263139,roughness:1,flatShading:true}),wood=new THREE.MeshStandardMaterial({color:0x584334,roughness:1,flatShading:true}),screenMat=new THREE.MeshBasicMaterial({color:0x72b5bd}),road=new THREE.MeshStandardMaterial({color:0x242b2b,roughness:1}),orange=new THREE.MeshStandardMaterial({color:0xd7652e,roughness:1});
  box(road,[12,.15,12],[0,-.08,0],scene);const actor=lowPolyPerson(scene,id==='technicianCall'||id==='technicianDrop'?0x304653:0x745445);let object=null,logo=null;
  if(id==='cctv'){
    box(concrete,[4.2,3.6,.25],[2.8,1.8,-2.8],scene);for(let y=.65;y<3;y+=.9)for(let x=1.2;x<4.7;x+=1.05)box(new THREE.MeshBasicMaterial({color:0x263f43}),[.55,.4,.03],[x,y,-2.64],scene,false);box(concrete,[.18,3.2,.18],[-3.5,1.6,-1.7],scene);const lamp=new THREE.PointLight(0xd6a76b,5,5);lamp.position.set(-3.5,2.8,-1.2);scene.add(lamp);actor.position.set(-4,0,0);const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle='#d1c25e';x.font='bold 62px Georgia';x.fillText('ANCC',25,82);logo=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0}));logo.position.set(0,1.8,-1);scene.add(logo)
  }else if(id==='kitchen'){
    box(wood,[5,.22,1.8],[0,.8,-1.7],scene);box(concrete,[2.1,1.25,.2],[-2.7,1.8,-2.8],scene);box(screenMat,[1.75,.9,.03],[-2.7,1.8,-2.66],scene,false);for(let i=-2;i<3;i++)box(wood,[.65,.8,.55],[i*.78,.4,-2],scene);actor.position.set(1.1,0,.5);object=box(orange,[.7,.1,.18],[1.6,.96,-1.1],scene)
  }else if(id==='technicianCall'||id==='technicianDrop'){
    box(concrete,[5,3.2,.25],[0,1.6,-3],scene);box(wood,[1.8,2.7,.18],[-2,1.35,-2.82],scene);box(concrete,[1.5,2.7,.18],[2,1.35,-2.82],scene);actor.position.set(-1.8,0,.2);const cardMat=new THREE.MeshStandardMaterial({color:0x8b7a3b,metalness:.4,roughness:.5});object=box(cardMat,[.42,.035,.27],[.2,.04,.6],scene);object.visible=id==='technicianDrop'
  }else{
    box(concrete,[5,3.4,.2],[0,1.7,-3],scene);box(wood,[2.7,.2,1.5],[1,.8,-1.6],scene);const second=lowPolyPerson(scene,0x5a2936);second.position.set(1.4,0,-.2);actor.position.set(-1.5,0,.25);camera.position.set(4.8,2.3,5.5)
  }
  scene.add(new THREE.HemisphereLight(0x8cafb4,0x17120f,1.15));const key=new THREE.SpotLight(0xd1a46d,18,12,Math.PI/4,.65);key.position.set(2,5,4);key.target.position.set(0,0,-1);key.castShadow=true;scene.add(key,key.target);const cold=new THREE.PointLight(0x4d91a0,6,7);cold.position.set(-3,2,1);scene.add(cold);
  const render=f=>{const t=f/10;if(id==='cctv'){actor.position.x=-4+Math.min(f,80)*.075;actor.rotation.y=Math.PI/2;if(logo)logo.material.opacity=f>=108&&f<=114?1:0;camera.position.x=4+Math.sin(t*.18)*.08}else if(id==='kitchen'){actor.position.x=1.1+Math.sin(t*.5)*.14;actor.rotation.y=-.5+Math.sin(t*.25)*.12;if(object)object.rotation.y=t*.1}else if(id==='technicianCall'){actor.rotation.y=Math.sin(t*.3)*.16;actor.position.x=-1.8+Math.sin(t*.25)*.09}else if(id==='technicianDrop'){actor.position.x=-1.8+Math.min(f,120)*.035;actor.rotation.y=Math.PI/2;if(object){object.visible=f>88;object.rotation.z=f>88?.23:0}}else{actor.position.x=-1.5+Math.sin(t*.35)*.12;actor.rotation.y=.7+Math.sin(t*.22)*.2}renderer.render(scene,camera)};
  return {render,dispose:()=>{scene.traverse(o=>{o.geometry?.dispose?.();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.map?.dispose?.();m.dispose?.()})}});renderer.dispose()}};
}
