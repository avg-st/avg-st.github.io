import * as THREE from 'three';

const host=document.querySelector('.hero-art');
const stage=host?.querySelector('.hero-planet-stage');
if(stage) {
  try { createPlanet(); }
  catch(error) { host.dataset.renderState='unavailable';console.warn('Hero planet unavailable:',error); }
}

function createPlanet() {
  const renderer=new THREE.WebGLRenderer({canvas:stage.querySelector('canvas'),alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,60);
  const system=new THREE.Group();scene.add(system);

  // Seamless rock grain, broad mineral variation, and shallow impact craters.
  const surface=document.createElement('canvas');surface.width=1024;surface.height=512;
  const bump=document.createElement('canvas');bump.width=1024;bump.height=512;
  const roughness=document.createElement('canvas');roughness.width=1024;roughness.height=512;
  const colorContext=surface.getContext('2d'),bumpContext=bump.getContext('2d'),roughContext=roughness.getContext('2d');
  const colorPixels=colorContext.createImageData(1024,512),bumpPixels=bumpContext.createImageData(1024,512),roughPixels=roughContext.createImageData(1024,512);
  const mix=(a,b,t)=>a+(b-a)*t;
  const hash=(x,y,z)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const noise=(x,y,z)=>{
    const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let u=x-ix,v=y-iy,w=z-iz;
    u=u*u*(3-2*u);v=v*v*(3-2*v);w=w*w*(3-2*w);
    return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),u),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),
      mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);
  };
  const craters=Array.from({length:18},(_,i)=>{
    const cy=1-2*(i+.5)/18,angle=i*2.39996323,r=Math.sqrt(1-cy*cy),radius=.055+hash(i,1,2)*.12;
    return {x:Math.cos(angle)*r,y:cy,z:Math.sin(angle)*r,radius,cutoff:1-(radius*1.2)**2/2};
  });
  for(let y=0;y<512;y++)for(let x=0;x<1024;x++) {
    const longitude=x/1023*Math.PI*2,latitude=y/511*Math.PI;
    const px=Math.cos(longitude)*Math.sin(latitude),py=Math.cos(latitude),pz=Math.sin(longitude)*Math.sin(latitude);
    const mineral=noise(px*3+8,py*3+4,pz*3+12);
    const terrain=noise(px*12+7,py*12+3,pz*12+5)*.55+noise(px*30,py*30,pz*30)*.3+noise(px*86,py*86,pz*86)*.15;
    let relief=terrain*.55+mineral*.45;
    for(const crater of craters) {
      const dot=px*crater.x+py*crater.y+pz*crater.z;if(dot<crater.cutoff)continue;
      const d=Math.sqrt(Math.max(0,2*(1-dot)))/crater.radius;
      relief-=.16*Math.max(0,1-d*d)**2;
      relief+=.065*Math.exp(-((d-.92)**2)/.012);
    }
    const value=Math.max(0,Math.min(1,relief)),i=(y*1024+x)*4;
    colorPixels.data.set([24+value*64,25+value*55,40+value*83+mineral*8,255],i);
    const height=Math.round(value*255);bumpPixels.data.set([height,height,height,255],i);
    const matte=Math.round(175+terrain*65);roughPixels.data.set([matte,matte,matte,255],i);
  }
  colorContext.putImageData(colorPixels,0,0);bumpContext.putImageData(bumpPixels,0,0);roughContext.putImageData(roughPixels,0,0);
  const colorMap=new THREE.CanvasTexture(surface);colorMap.colorSpace=THREE.SRGBColorSpace;
  const bumpMap=new THREE.CanvasTexture(bump);
  const planetMaterial=new THREE.MeshPhysicalMaterial({map:colorMap,bumpMap,bumpScale:.13,roughnessMap:new THREE.CanvasTexture(roughness),metalness:.12,roughness:.88,clearcoat:.08,clearcoatRoughness:.65});
  const planet=new THREE.Mesh(new THREE.SphereGeometry(1.15,96,64),planetMaterial);system.add(planet);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.21,64,48),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 n; varying vec3 v; void main(){float rim=pow(1.0-max(0.0,dot(normalize(n),normalize(v))),3.2);vec3 color=mix(vec3(.5,.32,1.),vec3(.25,.92,1.),n.y*.5+.5);gl_FragColor=vec4(color,rim*.42);}'
  }));system.add(atmosphere);
  const ambient=new THREE.AmbientLight(0xa49bdf,1.3);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xece5ff,4.2);key.position.set(-3,4,5);scene.add(key);
  const cyan=new THREE.PointLight(0x65e9f4,24,20);cyan.position.set(3,1,-1);scene.add(cyan);
  const violet=new THREE.PointLight(0xb15aff,18,20);violet.position.set(-2,-2,1);scene.add(violet);
  const rings=[];
  const configs=[{radius:1.8,x:.95,y:.3,z:-.35,color:0x81f1e7,lower:0xa75cdd,speed:.24},
    {radius:2.25,x:-.6,y:.85,z:.65,color:0xa9adf5,lower:0xe57cc6,speed:-.18},
    {radius:2.7,x:.45,y:-.65,z:-.5,color:0x8085bc,speed:.13}];
  const addGlowArc=(orbit,radius,start,color)=>{
    for(const [tube,opacity] of [[.018,1],[.055,.15],[.105,.045]]) {
      const geometry=new THREE.TorusGeometry(radius,tube,8,96,Math.PI*.72);
      const uv=geometry.getAttribute('uv'),colors=new Float32Array(uv.count*3),tint=new THREE.Color(color);
      for(let i=0;i<uv.count;i++) {
        const brightness=Math.sin(Math.PI*uv.getX(i))**.6;
        colors[i*3]=tint.r*brightness;colors[i*3+1]=tint.g*brightness;colors[i*3+2]=tint.b*brightness;
      }
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const arc=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
      arc.rotation.z=start;orbit.add(arc);
    }
  };
  for(const [index,config] of configs.entries()) {
    const orbit=new THREE.Group();system.add(orbit);
    const ringMaterial=new THREE.MeshBasicMaterial({color:0x8286be,transparent:true,opacity:index===2?.28:.42,depthWrite:false,toneMapped:false});
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(config.radius,index===2?.005:.009,8,160),ringMaterial));
    if(index<2){addGlowArc(orbit,config.radius,.18,config.color);addGlowArc(orbit,config.radius,Math.PI+.18,config.lower);}
    const satellite=new THREE.Mesh(new THREE.SphereGeometry(index===1?.13:.09,32,24),new THREE.MeshStandardMaterial({color:config.color,emissive:config.color,emissiveIntensity:.35,metalness:.5,roughness:.25}));
    orbit.add(satellite);
    rings.push({orbit,satellite,config,index});
  }
  let frame=0,lastTime=null,time=0,visible=false,width=0,height=0;
  let tiltX=0,tiltY=0,targetX=0,targetY=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer:coarse)');
  const request=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const resize=()=>{
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||w===width&&h===height)return;
    width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;
    camera.position.set(0,.15,3.2/(Math.tan(THREE.MathUtils.degToRad(19))*Math.min(1,camera.aspect)));
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();request();
  };
  const syncVisibility=()=>{
    const rect=stage.getBoundingClientRect(),flightScene=host.closest('.depth-scene');
    visible=(!flightScene||flightScene.style.visibility==='visible')&&getComputedStyle(host).visibility!=='hidden'
      &&rect.width>8&&rect.height>8&&rect.bottom>0&&rect.top<innerHeight;
    if(visible)request();else lastTime=null;
  };
  function draw(now) {
    frame=0;if(!visible||document.hidden){lastTime=null;return;}
    const dt=lastTime===null?1/60:(now-lastTime)/1000;
    if(coarse.matches&&lastTime!==null&&dt<1/30){request();return;}
    lastTime=now;if(!reduced.matches)time+=Math.min(dt,.1);
    tiltX+=(targetX-tiltX)*.08;tiltY+=(targetY-tiltY)*.08;
    system.rotation.set(tiltX,tiltY,0);system.position.y=Math.sin(time*.5)*.045;
    planet.rotation.y=time*.065;planet.rotation.z=.12;
    for(const {orbit,satellite,config,index} of rings) {
      orbit.rotation.set(config.x+Math.sin(time*.08+index)*.12,config.y+time*.018*(index%2?1:-1),config.z);
      const angle=time*config.speed+index*2.1;
      satellite.position.set(Math.cos(angle)*config.radius,Math.sin(angle)*config.radius,0);
      satellite.rotation.set(time*.12,time*.2,.5);
    }
    renderer.render(scene,camera);
    if(host.dataset.renderState!=='ready')host.dataset.renderState='ready';
    if(!reduced.matches||Math.abs(targetX-tiltX)+Math.abs(targetY-tiltY)>.001)request();
  }
  host.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||reduced.matches)return;
    const rect=host.getBoundingClientRect();targetX=(event.clientY-rect.top)/rect.height*.24-.12;
    targetY=(event.clientX-rect.left)/rect.width*.36-.18;request();
  });
  host.addEventListener('pointerleave',()=>{targetX=targetY=0;request();});
  const theme=()=>{const light=document.documentElement.dataset.theme==='light';ambient.intensity=light?1.8:1.3;renderer.toneMappingExposure=light?1.1:1.2;request();};
  new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('portfolio-flight',syncVisibility);
  document.addEventListener('visibilitychange',()=>{lastTime=null;syncVisibility();});
  reduced.addEventListener('change',()=>{lastTime=null;request();});
  window.addEventListener('scroll',syncVisibility,{passive:true});
  resize();theme();syncVisibility();
}
