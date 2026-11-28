import * as THREE from 'three';

// One continuous world: stars and clouds stay still while the camera travels.
if (document.documentElement.classList.contains('depth-enabled')) {
  const host = document.createElement('div');
  host.className = 'space-flight';
  host.setAttribute('aria-hidden', 'true');
  document.body.append(host);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha:true, antialias:false, powerPreference:'low-power' }); }
  catch { host.remove(); }
  if (renderer) init(renderer, host);
}

function init(renderer, host) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.append(renderer.domElement);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 1, 14000);
  const legs = Math.max(1, document.querySelectorAll('.depth-scene').length);
  const routePoints=[];
  for(let i=0;i<=legs*4;i++) {
    routePoints.push(new THREE.Vector3(Math.sin(i*.45)*1000,Math.sin(i*.7)*220,-i*2400));
  }
  const route = new THREE.CatmullRomCurve3(routePoints);
  const bendSettings = {
    home:{x:-2400,y:650,bank:.22},
    about:{x:2800,y:850,bank:-.24},
    'ribbon-gallery':{x:-2700,y:-700,bank:.23},
    skills:{x:2500,y:950,bank:-.22},
    work:{x:-2900,y:600,bank:.24},
    solutions:{x:2600,y:-850,bank:-.23},
    contact:{x:-2000,y:-500,bank:.17}
  };
  const bends=[...document.querySelectorAll('.depth-scene > .depth-content > section')]
    .map(section=>bendSettings[section.id]||{x:2400,y:650,bank:-.22});
  const bendAt = distance => {
    const journey=Math.max(0,Math.min(legs,distance*legs));
    const index=Math.min(legs-1,Math.floor(journey));
    return {turn:journey-index,bend:bends[index]||bendSettings.home};
  };
  const flightPoint = (distance, result) => {
    route.getPointAt(distance,result);
    const {turn,bend}=bendAt(distance);
    if(turn>0 && turn<1) {
      // A broad curved excursion, with zero offset, slope and curvature at
      // both stations, joins consecutive bends without a camera snap.
      const arc=Math.sin(Math.PI*turn)**3;
      result.x+=bend.x*arc;
      result.y+=bend.y*arc;
    }
    return result;
  };
  const cameraTarget=new THREE.Vector3();
  const smooth = x => x*x*x*(x*(x*6-15)+10);
  const starCanvas=document.createElement('canvas');
  starCanvas.width=starCanvas.height=64;
  const starContext=starCanvas.getContext('2d');
  const starGlow=starContext.createRadialGradient(32,32,0,32,32,30);
  starGlow.addColorStop(0,'rgba(255,255,255,1)');
  starGlow.addColorStop(.2,'rgba(255,255,255,1)');
  starGlow.addColorStop(.45,'rgba(255,255,255,.5)');
  starGlow.addColorStop(.75,'rgba(255,255,255,.08)');
  starGlow.addColorStop(1,'rgba(255,255,255,0)');
  starContext.fillStyle=starGlow;starContext.fillRect(0,0,64,64);
  const starTexture=new THREE.CanvasTexture(starCanvas);
  let seed = 9217;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const count = 1200 * legs;
  const points = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i=0;i<count;i++) {
    points[i*3] = (random()-.5)*11000;
    points[i*3+1] = (random()-.5)*6500;
    points[i*3+2] = 600-random()*(legs*9600+14000);
    const tint = new THREE.Color().setHSL(.53+random()*.23,.25+random()*.3,.6+random()*.35);
    tint.toArray(colors,i*3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({map:starTexture,size:5,vertexColors:true,transparent:true,opacity:.85,sizeAttenuation:true,depthWrite:false}));
  world.add(stars);
  // A separate, sparse star field marks the quiet destination beyond the final leg.
  const quietPoints = new Float32Array(14 * 3);
  const destination = route.getPointAt(1);
  for(let i=0;i<14;i++) {
    quietPoints[i*3]=destination.x+(random()-.5)*6000;
    quietPoints[i*3+1]=destination.y+(random()-.5)*4200;
    quietPoints[i*3+2]=destination.z-2800-random()*1500;
  }
  const quietGeometry = new THREE.BufferGeometry();
  quietGeometry.setAttribute('position',new THREE.BufferAttribute(quietPoints,3));
  const quietStars = new THREE.Points(quietGeometry,new THREE.PointsMaterial({map:starTexture,color:0xc4ccdb,size:1.5,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false}));
  world.add(quietStars);
  // Replace the prominent nearby star to the right of the Solutions → FAQ flight.
  const cometLeg=[...document.querySelectorAll('.depth-scene > .depth-content > section')].findIndex(section=>section.id==='solutions');
  const probe=camera.clone(),probeTarget=new THREE.Vector3(),probeDirection=new THREE.Vector3();
  const probeDistance=(Math.max(0,cometLeg)+.5)/legs;
  flightPoint(probeDistance,probe.position);
  flightPoint(Math.min(1,probeDistance+.018),probeTarget);probeTarget.z-=120;
  probe.lookAt(probeTarget);probe.updateMatrixWorld(true);probe.getWorldDirection(probeDirection);
  let chosen=-1,bestScore=Infinity,cometDepth=1800;
  const projected=new THREE.Vector3(),candidate=new THREE.Vector3();
  for(let i=0;i<count;i++) {
    candidate.fromArray(points,i*3);
    const depth=candidate.clone().sub(probe.position).dot(probeDirection);
    projected.copy(candidate).project(probe);
    if(depth<100||depth>7000||projected.x<.12||projected.x>.9||Math.abs(projected.y)>.4)continue;
    const score=depth*(1+4*Math.hypot(projected.x-.4,projected.y));
    if(score<bestScore){bestScore=score;chosen=i;cometDepth=depth;}
  }
  const cometOrigin=chosen>=0?new THREE.Vector3().fromArray(points,chosen*3):probe.position.clone().addScaledVector(probeDirection,1800);
  if(chosen>=0){points[chosen*3+2]=1e6;geometry.attributes.position.needsUpdate=true;}
  const tailCanvas=document.createElement('canvas');tailCanvas.width=256;tailCanvas.height=64;
  const tailContext=tailCanvas.getContext('2d'),tailPixels=tailContext.createImageData(256,64);
  for(let y=0;y<64;y++)for(let x=0;x<256;x++) {
    const u=x/255,v=y/63,width=.035+.16*(1-u),index=(y*256+x)*4;
    const alpha=Math.pow(u,1.5)*Math.exp(-((v-.5)**2)/(2*width*width))*Math.sin(Math.PI*v)**2;
    tailPixels.data[index]=150+105*u;tailPixels.data[index+1]=200+55*u;
    tailPixels.data[index+2]=255;tailPixels.data[index+3]=Math.round(alpha*190);
  }
  tailContext.putImageData(tailPixels,0,0);
  const comet=new THREE.Group();
  const cometMaterial=map=>new THREE.SpriteMaterial({map,color:0xc7eaff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const cometHead=new THREE.Sprite(cometMaterial(starTexture));
  const cometHalo=new THREE.Sprite(cometMaterial(starTexture));
  const cometTail=new THREE.Sprite(cometMaterial(new THREE.CanvasTexture(tailCanvas)));
  cometHead.scale.setScalar(cometDepth*.009);cometHalo.scale.setScalar(cometDepth*.055);
  cometTail.scale.set(cometDepth*.2,cometDepth*.024,1);cometTail.center.set(1,.5);
  comet.add(cometTail,cometHalo,cometHead);comet.visible=false;world.add(comet);
  const cometDirection=new THREE.Vector3(-.65,-.22,.25).normalize();
  const cometScreen=new THREE.Vector3(),cometScreenAhead=new THREE.Vector3();
  let cometTime=0,lastDrawTime=null;
  const skyColor = new THREE.Color();
  const black = new THREE.Color(0x000000);

  // Soft volumetric-looking cloud layers, generated locally without image downloads.
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cloudCanvas.height = 256;
  const ctx = cloudCanvas.getContext('2d');
  for(let i=0;i<48;i++) {
    const x=40+random()*176, y=40+random()*176, radius=22+random()*65;
    const glow=ctx.createRadialGradient(x,y,0,x,y,radius);
    glow.addColorStop(0,'rgba(255,255,255,.065)'); glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);
  }
  // Some glow circles extend past the texture boundary. Without this envelope,
  // their clipped edges reveal the rotated rectangular sprite planes in space.
  const envelope=ctx.createRadialGradient(128,128,38,128,128,112);
  envelope.addColorStop(0,'rgba(255,255,255,1)');
  envelope.addColorStop(.5,'rgba(255,255,255,.7)');
  envelope.addColorStop(1,'rgba(255,255,255,0)');
  ctx.globalCompositeOperation='destination-in';
  ctx.fillStyle=envelope;ctx.fillRect(0,0,256,256);
  ctx.globalCompositeOperation='source-over';
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  const clouds=[];
  const cameraForward=new THREE.Vector3();
  for(let i=0;i<26*legs;i++) {
    const material = new THREE.SpriteMaterial({map:cloudTexture,color:new THREE.Color().setHSL(.52+.2*(.5+.5*Math.sin(i*.13)),.65,.48),transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending});
    const cloud = new THREE.Sprite(material);
    cloud.position.set((random()-.5)*5200,(random()-.5)*3000,-800-i*440);
    cloud.scale.set(2800+random()*2400,1800+random()*2000,1);
    material.rotation=random()*Math.PI;
    clouds.push(cloud); world.add(cloud);
  }
  // Short trails extend along world depth, so they pass beside the viewer.
  const trails = new Float32Array(220*6);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position',new THREE.BufferAttribute(trails,3));
  const trailMaterial = new THREE.LineBasicMaterial({color:0xa9d6ff,transparent:true,opacity:0,depthWrite:false});
  world.add(new THREE.LineSegments(trailGeometry,trailMaterial));
  let target=0, position=0, frame=0, visible=false, flight=0;
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();request();};
  function request(){if(!frame)frame=requestAnimationFrame(draw);}
  function draw(now=performance.now()){
    frame=0;
    if(document.hidden){lastDrawTime=null;return;}
    const deltaTime=lastDrawTime===null?0:Math.min(.1,(now-lastDrawTime)/1000);
    lastDrawTime=now;
    const delta=target-position;
    position += delta*.16;
    if(Math.abs(delta)<.0001)position=target;
    const distance=Math.max(0,Math.min(1,position / legs));
    const voidProgress=smooth(Math.max(0,Math.min(1,(position-(legs-1))/.92)));
    document.documentElement.style.setProperty('--space-void',String(voidProgress));
    flightPoint(distance,camera.position);
    flightPoint(Math.min(1,distance+.018),cameraTarget);
    cameraTarget.z-=120;
    camera.lookAt(cameraTarget);
    const {turn,bend}=bendAt(distance);
    if(turn>0 && turn<1) {
      // Bank into the bend and gently counter-bank on the return arc.
      const bank=Math.sin(Math.PI*turn)**2*Math.sin(2*Math.PI*turn)*bend.bank;
      camera.rotateZ(bank);
    }
    host.style.opacity='1';
    const speed=Math.sin(Math.PI*flight)**2;
    trailMaterial.opacity=speed*.35*(1-voidProgress);
    for(let i=0;i<220;i++) {
      // Use stars near the current leg so trails continue throughout the site.
      const star=(Math.min(count-220,Math.floor(distance*(count-220)))+i)*3, line=i*6;
      trails[line]=trails[line+3]=points[star];
      trails[line+1]=trails[line+4]=points[star+1];
      trails[line+2]=points[star+2]; trails[line+5]=points[star+2]+speed*180;
    }
    trailGeometry.attributes.position.needsUpdate=true;
    const light=document.documentElement.dataset.theme==='light';
    skyColor.set(light?0xe9e8f3:0x06091b).lerp(black,voidProgress);
    renderer.setClearColor(skyColor,1);
    stars.material.opacity=(light?.5:.9)*(1-voidProgress);
    quietStars.material.opacity=voidProgress*.7;
    stars.material.color.set(light?0x455078:0xffffff);
    trailMaterial.color.set(light?0x596d9b:0xa9d6ff);
    camera.getWorldDirection(cameraForward);
    const cometProgress=position-cometLeg;
    const cometVisible=cometLeg>=0&&cometProgress>0&&cometProgress<1;
    if(cometVisible)cometTime+=deltaTime;else cometTime=0;
    comet.position.copy(cometOrigin).addScaledVector(cometDirection,cometTime*24);
    const cometFade=Math.max(0,Math.min(1,cometProgress/.12,(1-cometProgress)/.18));
    const depth=comet.position.clone().sub(camera.position).dot(cameraForward);
    comet.visible=cometVisible&&depth>100;
    cometHead.material.opacity=cometFade;
    cometHalo.material.opacity=cometFade*.2;
    cometTail.material.opacity=cometFade*.8;
    cometScreen.copy(comet.position).project(camera);
    cometScreenAhead.copy(comet.position).add(cometDirection).project(camera);
    cometTail.material.rotation=Math.atan2((cometScreenAhead.y-cometScreen.y)*innerHeight,(cometScreenAhead.x-cometScreen.x)*innerWidth);
    clouds.forEach(cloud=>{
      const depth=(cloud.position.x-camera.position.x)*cameraForward.x
        +(cloud.position.y-camera.position.y)*cameraForward.y
        +(cloud.position.z-camera.position.z)*cameraForward.z;
      // Dissolve clouds before passing through their plane, and at the far clip.
      const nearFade=smooth(Math.max(0,Math.min(1,(depth-100)/1500)));
      const farFade=smooth(Math.max(0,Math.min(1,(camera.far-depth)/2200)));
      cloud.material.opacity=((light?.22:.36)+speed*.18)*(1-voidProgress)*nearFade*farFade;
      cloud.visible=cloud.material.opacity>.0001;
    });
    if(visible)renderer.render(world,camera);
    if(Math.abs(target-position)>.0001 || cometVisible)request();
  }
  document.addEventListener('portfolio-flight',event=>{
    flight=Math.max(0,Math.min(1,event.detail.progress));
    const next=event.detail.leg+smooth(flight);
    if(Math.abs(next-target)>1.1)position=next;
    target=next;
    visible=event.detail.visible;
    host.style.visibility=visible?'visible':'hidden';
    if(!visible)position=target;
    request();
  });
  document.addEventListener('visibilitychange',()=>{lastDrawTime=null;if(!document.hidden&&visible)request();});
  new MutationObserver(request).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',resize,{passive:true});
  resize();
  document.dispatchEvent(new Event('portfolio-flight-ready'));
}
