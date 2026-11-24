import * as THREE from './assets/vendor/three.module.js';
import {GLTFLoader} from './assets/vendor/GLTFLoader.js';

const handLoader=new GLTFLoader();

function makeAnatomicalHand(camera){
  const control=makeHand(camera);
  handLoader.load('./assets/models/hand-posable.glb',gltf=>{
    const model=gltf.scene,bones={};
    model.traverse(node=>{
      if(node.isMesh){
        node.castShadow=true;
        node.receiveShadow=true;
        node.material=node.material.clone();
        node.material.color?.multiply(new THREE.Color(0xb77a65));
        node.material.roughness=.78;
      }
      if(node.isBone)bones[node.name]=node;
    });
    control.root.clear();
    model.scale.setScalar(1.75);
    model.position.set(-.04,-.24,0);
    model.rotation.set(Math.PI/2,0,0);
    control.root.add(model);
    const sleeveMat=new THREE.MeshStandardMaterial({color:0x27343d,map:texture('fabric',128),roughness:.92});
    const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.078,.086,.1,16),sleeveMat);
    cuff.position.y=-.245;
    const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.084,.34,8,14),sleeveMat);
    forearm.position.y=-.48;
    cuff.castShadow=forearm.castShadow=true;
    control.root.add(cuff,forearm);
    const fingerNames=['index','middle','ring','pinky'];
    control.fingers.length=0;
    for(const name of fingerNames){
      const chain=[1,2,3].map(i=>bones[`${name}_0${i}_r`]).filter(Boolean);
      const base=chain.map(b=>b.rotation.z);
      const proxy={rotation:{}};
      Object.defineProperty(proxy.rotation,'x',{set:value=>chain.forEach((bone,i)=>bone.rotation.z=base[i]+value*(.68+i*.22))});
      control.fingers.push(proxy);
    }
    const thumbChain=[bones.thumb_01_r,bones.thumb_02_r,bones.thumb_03_r].filter(Boolean),thumbBase=thumbChain.map(b=>b.rotation.z);
    const thumbProxy={rotation:{}};
    Object.defineProperty(thumbProxy.rotation,'x',{set:value=>thumbChain.forEach((bone,i)=>bone.rotation.z=thumbBase[i]+value*(.5+i*.2))});
    control.thumb=thumbProxy;
    control.th2={rotation:{}};
    Object.defineProperty(control.th2.rotation,'x',{set:value=>{if(thumbChain[2])thumbChain[2].rotation.z=thumbBase[2]+value*.75}});
  },undefined,error=>console.warn('Anatomical hand unavailable; using local fallback.',error));
  return control;
}

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
function texture(kind,size=256){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),rng=i=>Math.sin(i*91.173)*43758.5453%1;x.fillStyle={wood:'#473126',plaster:'#485158',fabric:'#384047',metal:'#687177'}[kind]||'#777';x.fillRect(0,0,size,size);for(let i=0;i<900;i++){const a=Math.abs(rng(i)),b=Math.abs(rng(i+19)),v=Math.floor(25+Math.abs(rng(i+73))*45);x.globalAlpha=.06+Math.abs(rng(i+11))*.08;x.fillStyle=`rgb(${v},${v},${v})`;if(kind==='wood')x.fillRect(0,a*size,size,1+Math.abs(rng(i+2))*2);else if(kind==='metal')x.fillRect(0,a*size,size,.5);else x.fillRect(a*size,b*size,1.5,1.5)}if(kind==='fabric'){x.globalAlpha=.12;x.strokeStyle='#d0d6d6';for(let i=0;i<size;i+=8){x.beginPath();x.moveTo(i,0);x.lineTo(0,i);x.stroke()}}x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='wood'?2:4,kind==='wood'?4:4);t.colorSpace=THREE.SRGBColorSpace;return t}
function makeHand(camera){const root=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xa9654f,roughness:.8}),nail=new THREE.MeshStandardMaterial({color:0xd79c86,roughness:.58}),sleeve=new THREE.MeshStandardMaterial({color:0x27343d,map:texture('fabric',128),roughness:.92});const palm=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),skin);palm.scale.set(.68,1,.32);palm.castShadow=true;root.add(palm);const wrist=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.2,6,12),skin);wrist.position.y=-.27;wrist.castShadow=true;root.add(wrist);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.14,16),sleeve);cuff.position.y=-.43;root.add(cuff);const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.48,8,14),sleeve);forearm.position.y=-.72;forearm.castShadow=true;root.add(forearm);const fingers=[];[-.115,-.04,.04,.115].forEach((px,i)=>{const finger=new THREE.Group();finger.position.set(px,.17,-.015);let parent=finger;const lengths=[.12,.105,.085];lengths.forEach((len,j)=>{const joint=new THREE.Group(),seg=new THREE.Mesh(new THREE.CapsuleGeometry(.028-i*.001,len,5,10),skin);seg.position.y=len*.52;seg.castShadow=true;joint.add(seg);const knuckle=new THREE.Mesh(new THREE.SphereGeometry(.031,10,8),skin);knuckle.position.y=len;seg.add(knuckle);if(j===2){const n=new THREE.Mesh(new THREE.SphereGeometry(.024,10,6),nail);n.scale.set(.72,.9,.2);n.position.set(0,len+.015,-.027);joint.add(n)}parent.add(joint);parent=joint;joint.position.y=j?lengths[j-1]:0});root.add(finger);fingers.push(finger)});const thumb=new THREE.Group();thumb.position.set(-.17,-.03,0);thumb.rotation.z=.85;const th1=new THREE.Mesh(new THREE.CapsuleGeometry(.036,.12,6,10),skin);th1.position.y=.07;thumb.add(th1);const th2=new THREE.Group();th2.position.y=.13;const thm=new THREE.Mesh(new THREE.CapsuleGeometry(.032,.1,6,10),skin);thm.position.y=.055;th2.add(thm);thumb.add(th2);root.add(thumb);root.scale.setScalar(.84);root.position.set(.7,-.72,-1.2);root.rotation.set(-.9,.12,-.08);camera.add(root);return{root,fingers,thumb,th2}}
function buildRoom(){const scene=new THREE.Scene();scene.background=new THREE.Color(0x05080a);scene.fog=new THREE.Fog(0x05080a,10,28);const camera=new THREE.PerspectiveCamera(58,1,.04,60);scene.add(camera);const woodTex=texture('wood'),plasterTex=texture('plaster'),fabricTex=texture('fabric'),metalTex=texture('metal');const wood=new THREE.MeshStandardMaterial({color:0x6a4935,map:woodTex,roughness:.82}),wall=new THREE.MeshStandardMaterial({color:0x8c9290,map:plasterTex,roughness:.98}),floor=new THREE.MeshStandardMaterial({color:0x392a23,map:woodTex,roughness:.72}),metal=new THREE.MeshStandardMaterial({color:0x455158,map:metalTex,metalness:.68,roughness:.34}),paper=new THREE.MeshStandardMaterial({color:0xc8bea4,roughness:1}),brass=new THREE.MeshStandardMaterial({color:0xb38a42,metalness:.78,roughness:.22}),fabric=new THREE.MeshStandardMaterial({color:0x39444a,map:fabricTex,roughness:.94});box(floor,[12,.16,14],[0,-.08,-1],scene);box(wall,[12,5,.18],[0,2.5,-6],scene);box(wall,[.18,5,16],[-6,2.5,1],scene);box(wall,[.18,5,16],[6,2.5,1],scene);box(wall,[4.2,5,.18],[-3.9,2.5,2],scene);box(wall,[4.2,5,.18],[3.9,2.5,2],scene);box(wall,[1.7,.85,.18],[0,4.58,2],scene);
  for(let i=-5;i<6;i++){const seam=new THREE.Mesh(new THREE.BoxGeometry(.012,.01,14),metal);seam.position.set(i,.015,-1);scene.add(seam)}const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.4,4.6),fabric);rug.rotation.x=-Math.PI/2;rug.position.set(1.2,.018,-1.45);rug.receiveShadow=true;scene.add(rug);
  const doorPivot=new THREE.Group();doorPivot.position.set(-.85,0,2);const door=new THREE.Mesh(new THREE.BoxGeometry(1.7,3.45,.12),wood);door.position.set(.85,1.72,0);door.castShadow=true;doorPivot.add(door);for(const y of [.7,2.05]){const panel=new THREE.Mesh(new THREE.BoxGeometry(1.25,.9,.035),wood);panel.position.set(.85,y,.075);panel.scale.set(.94,.92,1);doorPivot.add(panel)}const handlePivot=new THREE.Group();handlePivot.position.set(1.48,1.55,.13);const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.2,16),brass);spindle.rotation.x=Math.PI/2;handlePivot.add(spindle);const lever=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.22,6,12),brass);lever.rotation.z=Math.PI/2;lever.position.x=-.13;handlePivot.add(lever);doorPivot.add(handlePivot);scene.add(doorPivot);for(const x of [-.94,.94])box(wood,[.12,3.65,.2],[x,1.82,2],scene);box(wood,[2,.12,.2],[0,3.62,2],scene);
  box(wood,[3.6,.18,1.55],[1.35,1.03,-3.25],scene);box(wood,[.25,1.05,1.35],[-.25,.5,-3.25],scene);box(wood,[.25,1.05,1.35],[2.95,.5,-3.25],scene);for(let y=.35;y<.95;y+=.27)box(wood,[.88,.2,1.1],[2.5,y,-3.23],scene);
  box(metal,[1.9,1.25,.14],[1.3,1.85,-3.72],scene);const bootTex=labelTexture(['RECOVERY NODE · A-17','SESSION: A. MOREL','INITIALISATION…']);const desktopTex=labelTexture(['ARCHIVES LOCALES','BLOC-NOTES · ARCHIVE_M','SESSION RESTAURÉE']);const screenMat=new THREE.MeshBasicMaterial({map:bootTex,color:0x080b0d});const screen=box(screenMat,[1.7,.98,.025],[1.3,1.85,-3.635],scene,false);box(metal,[.12,.62,.12],[1.3,1.2,-3.72],scene);box(metal,[.65,.055,.44],[1.3,1.05,-3.3],scene);
  const keyboard=box(metal,[1.35,.065,.46],[1.08,1.13,-2.55],scene);keyboard.rotation.x=-.1;for(let r=0;r<4;r++)for(let c=0;c<12;c++){const k=box(paper,[.075,.018,.052],[.63+c*.082,1.17,-2.42-r*.076],scene,false);k.rotation.x=-.1}const mouse=new THREE.Mesh(new THREE.SphereGeometry(.13,16,10),new THREE.MeshStandardMaterial({color:0x20292e,roughness:.42}));mouse.scale.set(.72,.48,1.18);mouse.position.set(2.08,1.17,-2.52);scene.add(mouse);
  const chair=new THREE.Group();const seat=new THREE.Mesh(new THREE.BoxGeometry(1.05,.14,1.05),fabric);seat.position.set(1.25,.68,-.45);const back=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.15,.18),fabric);back.position.set(1.25,1.18,.08);back.rotation.x=-.08;chair.add(seat,back);scene.add(chair);for(const x of [.86,1.64])for(const z of [-.76,-.14])box(metal,[.055,.68,.055],[x,.33,z],scene);
  for(let y=.55;y<3.7;y+=.82)box(wood,[2.7,.09,.55],[-4.45,y,-5.7],scene);for(let y=.75;y<3.55;y+=.82)for(let i=0;i<9;i++){const m=new THREE.MeshStandardMaterial({color:[0x70483a,0x3d5965,0x69705b,0x765d38][i%4],roughness:1});box(m,[.16,.57,.4],[-5.5+i*.27,y,-5.42],scene)}
  for(let i=0;i<9;i++){const p=box(paper,[.78,.02,.98],[-.18+i*.018,1.15+i*.024,-3.08+i*.005],scene,false);p.rotation.y=-.06+i*.008}const lampStem=box(brass,[.045,.78,.045],[2.72,1.5,-2.95],scene);const shade=new THREE.Mesh(new THREE.ConeGeometry(.32,.36,20,1,true),brass);shade.position.set(2.72,1.98,-2.95);shade.rotation.z=Math.PI;scene.add(shade);
  const glass=new THREE.MeshPhysicalMaterial({color:0x254b59,transmission:.42,transparent:true,opacity:.55,roughness:.12});box(metal,[3.05,1.85,.1],[-3.2,2.35,-5.78],scene);box(glass,[2.8,1.6,.03],[-3.2,2.35,-5.7],scene,false);for(let i=0;i<34;i++)box(new THREE.MeshBasicMaterial({color:0x6aa2af,transparent:true,opacity:.42}),[.012,.12+Math.random()*.23,.008],[-4.5+Math.random()*2.6,1.6+Math.random()*1.5,-5.67],scene,false);
  const radiator=box(metal,[1.45,.82,.22],[-4.6,.62,-2.4],scene);for(let x=-5.18;x<-4.02;x+=.19)box(new THREE.MeshStandardMaterial({color:0x7a8588,roughness:.6}),[.1,.67,.27],[x,.62,-2.38],scene);const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.2,.35,16),new THREE.MeshStandardMaterial({color:0x594033,roughness:1}));pot.position.set(-4.7,.22,-4.75);scene.add(pot);for(let i=0;i<7;i++){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.014,.02,.7,8),new THREE.MeshStandardMaterial({color:0x365340,roughness:1}));stem.position.set(-4.7+(i-3)*.04,.7,-4.75);stem.rotation.z=(i-3)*.12;scene.add(stem);const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,10,6),new THREE.MeshStandardMaterial({color:0x456c4e,roughness:1}));leaf.scale.set(.45,1,.25);leaf.position.set(stem.position.x+Math.sin(i)*.14,1.02-Math.abs(i-3)*.04,-4.75);scene.add(leaf)}
  const hemi=new THREE.HemisphereLight(0x8dafba,0x251911,1.75);scene.add(hemi);const deskLight=new THREE.SpotLight(0xe4b875,74,12,Math.PI/4,.45,1.6);deskLight.position.set(2.7,4.3,-1);deskLight.target.position.set(1.2,1,-3);deskLight.castShadow=true;scene.add(deskLight,deskLight.target);const rainLight=new THREE.PointLight(0x4d9cb5,24,10);rainLight.position.set(-3.2,2.5,-4.8);scene.add(rainLight);const eyeLight=new THREE.PointLight(0xffd2aa,4.5,5);eyeLight.position.set(0,.05,-.15);camera.add(eyeLight);const hand=makeAnatomicalHand(camera);return{scene,camera,doorPivot,handlePivot,hand,screen,screenMat,bootTex,desktopTex}}
function fit(renderer,camera,canvas){const rect=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix()}

export function playIntro({canvas,onComplete=()=>{},lang='fr',muted=false,duration=44}={}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
  const room=buildRoom(),audio=makeAudio();let start=performance.now(),seekOffset=0,raf=0,done=false,lastBeat=-1,lastStep=-1;
  const captions=lang==='fr'?['La porte est restée fermée cent ans.','J’entre dans la dernière pièce intacte.','Le poste attend encore.','ARCHIVE OS · SESSION A. MOREL']:['The door remained closed for a century.','I enter the last intact room.','The terminal is still waiting.','ARCHIVE OS · A. MOREL SESSION'];
  const caption=document.querySelector('#intro-caption');
  const render=now=>{if(done)return;fit(renderer,room.camera,canvas);const t=((now-start)/1000)+seekOffset,p=clamp(t/duration,0,1),reach=ease((t-2)/4),grip=ease((t-4.5)/1.4)*(1-ease((t-10.5)/1.3));room.camera.position.set(0,1.68,5.25);room.camera.lookAt(.58,1.55,2);room.hand.root.visible=t>1.4&&t<12.5;room.hand.root.position.set(lerp(.62,-.08,reach),lerp(-.72,.02,reach),lerp(-1.25,-1.05,reach));room.hand.root.rotation.set(lerp(-.55,.04,reach),lerp(.12,-.05,reach),lerp(-.08,-.38,reach));room.hand.fingers.forEach((f,i)=>f.rotation.x=-(reach*.16+grip*(.92+i*.04)));room.hand.thumb.rotation.x=-grip*.72;room.hand.th2.rotation.x=-grip*.8;room.handlePivot.rotation.x=-ease((t-5.2)/1.2)*.55;room.doorPivot.rotation.y=-ease((t-7)/4)*1.52;
    if(t>=11&&t<28){const q=ease((t-11)/17),bob=Math.sin((t-11)*7.2)*.032*(1-ease((t-26)/2));room.camera.position.set(lerp(0,1.25,q),lerp(1.68,1.65,q)+bob,lerp(4.9,-.35,q));room.camera.lookAt(lerp(.2,1.3,q),lerp(1.55,1.78,q)+bob*.35,lerp(1.8,-3.6,q));const step=Math.floor((t-11)*1.65);if(!muted&&step!==lastStep){lastStep=step;audio.noise(.11,.022)}}else if(t>=28&&t<34){const q=ease((t-28)/6);room.camera.position.set(1.25,lerp(1.65,1.3,q),lerp(-.35,-.68,q));room.camera.lookAt(lerp(1.3,1.15,q),lerp(1.78,1.12,q),lerp(-3.6,-2.55,q))}else if(t>=34){const look=ease((t-34)/3);room.camera.position.set(1.25,1.3,-.68);room.camera.lookAt(lerp(1.15,1.3,look),lerp(1.12,1.85,look),lerp(-2.55,-3.65,look));if(t>39){const q=ease((t-39)/5);room.camera.position.set(lerp(1.25,1.3,q),lerp(1.3,1.84,q),lerp(-.68,-2.78,q));room.camera.lookAt(1.3,1.85,-3.65)}}
    const beat=Math.floor(t);if(!muted&&beat!==lastBeat){lastBeat=beat;if(beat===5)audio.noise(.18,.028);if(beat===7)audio.noise(.75,.026);if(beat===29)audio.noise(.3,.035);if(beat===36){audio.tone(196,.22,.022);setTimeout(()=>audio.tone(392,.28,.026),210)}}if(t<35){room.screenMat.color.setHex(0x050708)}else{const glow=ease((t-35)/3);room.screenMat.color.setRGB(glow,glow,glow);room.screenMat.map=t>39?room.desktopTex:room.bootTex;room.screenMat.needsUpdate=true}if(caption)caption.textContent=t<11?captions[0]:t<28?captions[1]:t<36?captions[2]:captions[3];renderer.render(room.scene,room.camera);if(p>=1)finish();else raf=requestAnimationFrame(render)};
  const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);canvas.closest('.intro')?.classList.add('cinematic-fade');setTimeout(()=>{renderer.dispose();onComplete()},520)};
  const controller={skip:finish,seek:s=>{seekOffset=clamp(s,0,duration);start=performance.now()},destroy:finish,resumeAudio:()=>audio.resume()};window.__cinematic=controller;raf=requestAnimationFrame(render);return controller;
}

export function playUsbReveal({host,onComplete=()=>{},lang='fr',muted=false}={}){
  const overlay=document.createElement('section');overlay.className='usb-transition cinematic-transition';overlay.innerHTML=`<canvas></canvas><div class="cinematic-card"><small>ARCHIVE_M · RECOVERED MEDIA</small><h2>${lang==='fr'?'Une mémoire vient de s’ouvrir.':'A memory has just opened.'}</h2><p>${lang==='fr'?'Le bureau est le même. La certitude, non.':'The room is unchanged. Certainty is not.'}</p><button class="secondary">${lang==='fr'?'Continuer':'Continue'}</button></div>`;(host||document.body).appendChild(overlay);
  const canvas=overlay.querySelector('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;const room=buildRoom();room.hand.root.visible=false;let started=performance.now(),raf,ended=false;
  const stop=()=>{if(ended)return;ended=true;cancelAnimationFrame(raf);renderer.dispose();overlay.remove();onComplete()};overlay.querySelector('button').onclick=stop;
  const frame=now=>{fit(renderer,room.camera,canvas);const t=(now-started)/1000,q=ease(t/7);room.camera.position.set(lerp(1.3,1.8,q),lerp(1.84,1.45,q),lerp(-2.75,-.7,q));room.camera.lookAt(1.3,1.8,-3.65);room.screenMat.color.setRGB(1,1,1);room.screenMat.map=room.desktopTex;room.screenMat.needsUpdate=true;renderer.render(room.scene,room.camera);if(t>9)stop();else raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame);return {skip:stop};
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
