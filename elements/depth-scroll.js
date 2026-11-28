(() => {
  if (!document.documentElement.classList.contains('depth-enabled')) return;
  const work = document.getElementById('work');
  const workContainer = work?.querySelector('.work-container');
  if (workContainer) {
    const solutions = document.createElement('section');
    solutions.className = 'solutions-scene section';
    solutions.id = 'solutions';
    solutions.innerHTML = '<h2 class="section-title">Development Solutions</h2>';
    work.after(solutions);
    solutions.append(workContainer);
  }
  const nodes = [...document.querySelectorAll('.l-main > section')];
  const footer = document.querySelector('.footer');
  if (!nodes.length) return;
  const viewport = document.createElement('div');
  viewport.className = 'depth-viewport';
  const selectors = {
    home:'.hero-depth-data > *, .hero-art, .home-social, .hero-footer',
    about:'.section-title, .about-container > *',
    skills:'.section-title, .skills-subtitle, .skills-text, .skills-data, .skills-img',
    work:'.section-title, .project-filter-card, .pedestal-showcase',
    solutions:'.section-title, .card2',
    contact:'.section-title, .faq-item'
  };
  function collectUnits(node) {
    return [...node.querySelectorAll(selectors[node.id] || '.section-title')].map(element=>{
      element.classList.add('flight-unit');
      return {element,top:0,left:0,width:0,height:0};
    });
  }
  const scenes = nodes.map((node, index) => {
    const spacer = document.createElement('div');
    spacer.className = 'depth-spacer';
    node.before(spacer);
    const scene = document.createElement('div');
    scene.className = 'depth-scene';
    const content = document.createElement('div');
    content.className = 'depth-content';
    content.append(node); scene.append(content); viewport.append(scene);
    const units = collectUnits(node);
    return { node, spacer, scene, content, units, start:0, read:0, index, arrivalStart:null, returnStart:null, returnFrom:[], ribbonStart:null };
  });
  document.body.append(viewport);
  let frame = 0, layoutFrame = 0, lastScroll = window.scrollY;
  const clamp = value => Math.max(0, Math.min(1, value));
  const magnify = progress => {
    const p=clamp(progress), eased=p*p*p*(p*(p*6-15)+10);
    return .002*Math.pow(500,eased);
  };
  function flyUnit(unit, progress, pan) {
    const size=magnify(progress);
    unit.element.style.scale=String(size);
    unit.element.style.translate=`${(innerWidth/2-unit.left-unit.width/2)*(1-size)}px ${(innerHeight*.5-unit.top+pan-unit.height/2)*(1-size)}px`;
    unit.element.style.visibility=progress>0?'visible':'hidden';
  }
  function render(now=performance.now()) {
    frame = 0;
    let animatingArrival=false;
    const y = window.scrollY, vh = innerHeight;
    const scrollingBack=y<lastScroll-.5, scrollingForward=y>lastScroll+.5;
    lastScroll=y;
    viewport.style.visibility = footer && y >= footer.getBoundingClientRect().top + y ? 'hidden' : 'visible';
    let current = y >= scenes[scenes.length - 1].start ? scenes.length - 1 : 0;
    scenes.forEach((item, i) => {
      const local = y - item.start;
      const previous = scenes[i - 1];
      const approach = previous?.travel || vh;
      const enter = clamp(((local + approach) / approach - .14) / .86);
      let exit = clamp((local - item.read) / item.travel);
      // Leave room to experience the journey before revealing the destination.
      exit = clamp(exit / .36);
      const isRibbon = item.node.id === 'ribbon-gallery';
      const active = local >= 0 && local < item.read + item.travel;
      if (active) current = i;
      const shown = local > -approach && exit < 1;
      // The scene stays in place on arrival; its objects approach independently.
      const z = local < 0 ? 0 : 990 * exit;
      item.scene.style.transform = `translateZ(${z}px)`;
      item.scene.style.opacity = String(local < 0 ? (isRibbon ? 0 : 1) : 1 - Math.pow(exit, 2));
      if(isRibbon) {
        if(local<0 || local>=item.read+item.travel)item.ribbonStart=null;
        const settled=local>=0 && local<=item.read && !document.documentElement.classList.contains('auto-flight');
        if(settled && item.ribbonStart===null)item.ribbonStart=now;
        const rollout=item.ribbonStart===null?0:clamp((now-item.ribbonStart)/2100);
        item.node.querySelector('iframe')?.contentWindow?.postMessage({type:'ribbon-entrance',progress:rollout},location.origin);
        if(shown && item.ribbonStart!==null && rollout<1)animatingArrival=true;
      }
      item.scene.style.visibility = shown ? 'visible' : 'hidden';
      const pan=Math.max(0,Math.min(item.pan,local));
      item.content.style.transform = `translateY(${-pan}px)`;
      const isChain=['solutions','work'].includes(item.node.id);
      if(isChain && local<=-approach) {
        item.arrivalStart=null;item.returnStart=null;item.returnFrom=[];
      }
      if(isChain && local<0 && scrollingBack && item.arrivalStart!==null && item.returnStart===null) {
        item.returnFrom=item.units.map((unit,index)=>clamp((now-item.arrivalStart-index*220)/1000));
        item.returnStart=now;
      }
      if(isChain && item.returnStart!==null && (scrollingForward||local>=0)) {
        item.arrivalStart=now;item.returnStart=null;item.returnFrom=[];
      }
      // Reaching the scene starts one timed sequence for the whole chain.
      // Releasing the wheel must never pause the following cards in mid-flight.
      if(isChain && item.arrivalStart===null && item.returnStart===null && shown && enter>=.45 && !scrollingBack) item.arrivalStart=now;
      const elapsed=item.arrivalStart===null ? -1 : now-item.arrivalStart;
      const returning=item.returnStart!==null;
      if(isChain && shown && (returning
        ? now-item.returnStart<550+(item.units.length-1)*60
        : elapsed>=0 && elapsed<1000+(item.units.length-1)*220)) animatingArrival=true;
      let rank=0;
      item.units.forEach((unit,unitIndex) => {
        const firstScreen=unit.top < vh*.92;
        // Once assembled, all cards remain in place regardless of scroll position.
        const progress=isChain
          ? returning
            ? (item.returnFrom[unitIndex]||0)*(1-clamp((now-item.returnStart-(item.units.length-1-unitIndex)*60)/550))
            : clamp((elapsed-unitIndex*220)/1000)
          : firstScreen ? clamp((enter-Math.min(.45,rank++*.075))/.55) : clamp((pan-(unit.top-vh*.85))/(vh*.42));
        flyUnit(unit,progress,pan);
      });
      const approachingAbout=item.node.id==='about' && local<0 && shown && enter>.15;
      const canInteract=(active && exit===0)||approachingAbout;
      item.scene.classList.toggle('is-current', active);
      item.scene.classList.toggle('is-approaching',approachingAbout);
      item.scene.style.pointerEvents=active && exit===0?'auto':'none';
      item.scene.inert = !canInteract;
      item.scene.setAttribute('aria-hidden', String(!(active||approachingAbout)));
      item.scene.style.zIndex = String(scenes.length - i);
    });
    const departure = scenes[current];
    const progress = clamp((y - departure.start - departure.read) / departure.travel);
    document.dispatchEvent(new CustomEvent('portfolio-flight', { detail:{ progress, leg:current, visible:true } }));
    // Fixed scenes do not intersect the document in the same way as normal flow.
    const ribbon = scenes[current].node.querySelector('.ribbon-showcase-frame') || (scenes[current].node.matches('.ribbon-showcase') ? scenes[current].node.querySelector('iframe') : null);
    const ribbonScene = scenes.find(item => item.node.id === 'ribbon-gallery');
    document.querySelector('.ribbon-showcase-frame')?.contentWindow?.postMessage({ type:'ribbon-visibility', visible:ribbonScene?.scene.style.visibility === 'visible' }, location.origin);
    ribbon?.contentWindow?.postMessage({ type:'ribbon-page-scroll', offset:Math.max(0, y - scenes[current].start) * .004 }, location.origin);
    if(animatingArrival) schedule();
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  function layout() {
    layoutFrame = 0;
    const anchored = scenes.find(item => Math.abs(window.scrollY - item.start) < 2);
    let start = 0;
    scenes.forEach(item => {
      item.start = start;
      item.pan = item.node.matches('.ribbon-showcase') ? 0 : Math.max(0, item.content.offsetHeight - innerHeight + 40);
      item.read = item.pan + (item.node.matches('.ribbon-showcase') ? innerHeight * 2.5 : 0);
      if(item.node.id==='work') item.read += innerHeight*1.25;
      item.units.forEach(unit=>{
        let top=0,left=0,element=unit.element;
        while(element && element!==item.content) {top+=element.offsetTop;left+=element.offsetLeft;element=element.offsetParent;}
        unit.top=top;unit.left=left;unit.width=unit.element.offsetWidth;unit.height=unit.element.offsetHeight;
      });
      item.travel = innerHeight * 3.2;
      item.spacer.style.height = (item.read + item.travel) + 'px';
      start += item.read + item.travel;
    });
    if (anchored) window.scrollTo({top:Math.ceil(anchored.start),behavior:'instant'});
    schedule();
  }
  const scheduleLayout = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(layout); };
  const observer = new ResizeObserver(scheduleLayout);
  scenes.forEach(item => observer.observe(item.content));
  // Vue replaces the About mount element on DOMContentLoaded. Track the live
  // elements after that mount, rather than continuing to animate detached nodes.
  document.addEventListener('DOMContentLoaded',()=>{
    scenes.forEach(item=>{item.units=collectUnits(item.node);});
    layout();
  },{once:true});
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', scheduleLayout, { passive:true });
  document.addEventListener('portfolio-flight-ready', schedule);
  let autoFlight=null,flightCooldown=0;
  const stopFlight=()=>{
    if(autoFlight)cancelAnimationFrame(autoFlight.frame);
    autoFlight=null;
    document.documentElement.classList.remove('auto-flight');
    schedule();
  };
  const flyTo=({top,hash})=>{
    stopFlight();
    const from=window.scrollY;
    const destination=Math.min(document.documentElement.scrollHeight-innerHeight,Math.ceil(top));
    const flight={frame:0,start:null};autoFlight=flight;
    document.documentElement.classList.add('auto-flight');
    const step=now=>{
      if(autoFlight!==flight)return;
      if(flight.start===null)flight.start=now;
      const p=clamp((now-flight.start)/2200);
      const eased=p*p*p*(p*(p*6-15)+10);
      window.scrollTo({top:from+(destination-from)*eased,behavior:'instant'});
      if(p<1)flight.frame=requestAnimationFrame(step);
      else {
        stopFlight();flightCooldown=now+220;
        if(hash)history.replaceState(null,'',hash);
      }
    };
    flight.frame=requestAnimationFrame(step);
  };
  const flightTarget=delta=>{
    const y=window.scrollY;
    const footerTop=footer?footer.getBoundingClientRect().top+y:Infinity;
    const last=scenes[scenes.length-1];
    if(y>=footerTop-1) {
      return delta<0 && y+delta<=footerTop+1 ? {top:last.start+last.read,hash:'#'+last.node.id}:null;
    }
    let index=0;
    scenes.forEach((item,i)=>{if(y>=item.start-1)index=i;});
    const item=scenes[index],end=item.start+item.read;
    if(delta>0 && y+delta>=end-1) {
      const next=scenes[index+1];
      return {top:next?next.start:footerTop,hash:next?'#'+next.node.id:null};
    }
    if(delta<0) {
      if(y>end+1)return {top:end,hash:'#'+item.node.id};
      const previous=scenes[index-1];
      if(previous && y+delta<=item.start+1)return {top:previous.start+previous.read,hash:'#'+previous.node.id};
    }
    return null;
  };
  const scrollsInside=(target,delta)=>{
    if(!(target instanceof Element))return false;
    if(target.closest('dialog[open]'))return true;
    for(let element=target;element&&element!==document.body&&element!==document.documentElement;element=element.parentElement) {
      if(!/(auto|scroll)/.test(getComputedStyle(element).overflowY)||element.scrollHeight<=element.clientHeight+1)continue;
      if(delta>0?element.scrollTop+element.clientHeight<element.scrollHeight-1:element.scrollTop>1)return true;
    }
    return false;
  };
  window.addEventListener('wheel',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
    if(autoFlight||performance.now()<flightCooldown){event.preventDefault();return;}
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if(scrollsInside(event.target,delta))return;
    const target=flightTarget(delta);
    if(target&&Number.isFinite(target.top)){event.preventDefault();flyTo(target);}
  },{passive:false});
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'){stopFlight();return;}
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"],dialog[open]'))return;
    let delta=0;
    if(event.key==='ArrowDown')delta=60;
    if(event.key==='ArrowUp')delta=-60;
    if(event.key==='PageDown')delta=innerHeight*.85;
    if(event.key==='PageUp')delta=-innerHeight*.85;
    if(!delta)return;
    if(autoFlight){event.preventDefault();return;}
    if(scrollsInside(event.target,delta))return;
    const target=flightTarget(delta);
    if(target&&Number.isFinite(target.top)){event.preventDefault();flyTo(target);}
  });
  window.addEventListener('resize',stopFlight,{passive:true});
  window.addEventListener('touchstart',stopFlight,{passive:true});
  const go = (hash, smooth = true) => {
    const item = scenes.find(item => '#' + item.node.id === hash);
    if (!item) return false;
    stopFlight();
    window.scrollTo({ top:Math.ceil(item.start), behavior:smooth ? 'smooth' : 'instant' });
    return true;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (go(link.hash)) { event.preventDefault(); history.pushState(null, '', link.hash); }
  });
  window.addEventListener('hashchange', () => go(location.hash));
  let interacted = false;
  ['wheel','touchstart','keydown','pointerdown'].forEach(type => window.addEventListener(type, () => { interacted=true; }, {passive:true,once:true}));
  window.addEventListener('load', async () => {
    await document.fonts.ready;
    requestAnimationFrame(() => {
      layout();
      if (location.hash && !interacted) go(location.hash, false);
    });
  });
  document.querySelector('.ribbon-showcase-frame')?.addEventListener('load', schedule);
  // Independent image depth: a glass frame, raised artwork, and a moving highlight.
  document.querySelectorAll('.solutions-scene .con-img').forEach(container=>{
    const image=container.querySelector('img:not(.blur)');
    const art=document.createElement('div');art.className='solution-art';
    image.before(art);art.append(image);
    image.alt=container.closest('.card2').querySelector('h2').textContent.trim()+' preview';
    let x=4,y=-6,targetX=4,targetY=-6,raf=0;
    const draw=()=>{
      raf=0;x+=(targetX-x)*.14;y+=(targetY-y)*.14;
      art.style.setProperty('--tilt-x',x+'deg');art.style.setProperty('--tilt-y',y+'deg');
      if(Math.abs(targetX-x)+Math.abs(targetY-y)>.02)raf=requestAnimationFrame(draw);
    };
    const request=()=>{if(!raf)raf=requestAnimationFrame(draw);};
    container.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const rect=container.getBoundingClientRect();
      const px=clamp((event.clientX-rect.left)/rect.width),py=clamp((event.clientY-rect.top)/rect.height);
      targetX=(.5-py)*20;targetY=(px-.5)*24;
      art.style.setProperty('--light-x',px*100+'%');art.style.setProperty('--light-y',py*100+'%');request();
    });
    container.addEventListener('pointerleave',()=>{targetX=4;targetY=-6;request();});
    request();
  });
  window.addEventListener('message', event => {
    if (event.source === document.querySelector('.ribbon-showcase-frame')?.contentWindow && event.origin === location.origin && event.data?.type === 'ribbon-ready') schedule();
  });
  layout();
})();
