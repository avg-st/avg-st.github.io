(() => {
  const motion = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference) and (min-width:769px)');
  for (const [selector, strength] of [['.home', 2.5], ['.l-header', 1]]) {
    const surface = document.querySelector(selector);
    if (!surface) continue;
    let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0;
    const draw = () => {
      x += (targetX - x) * .12; y += (targetY - y) * .12;
      surface.style.setProperty('--depth-x', x.toFixed(3) + 'deg');
      surface.style.setProperty('--depth-y', y.toFixed(3) + 'deg');
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .015 ? requestAnimationFrame(draw) : 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const reset = () => { targetX = targetY = 0; schedule(); };
    surface.addEventListener('pointermove', event => {
      if (!motion.matches || event.pointerType !== 'mouse') return;
      const bounds = surface.getBoundingClientRect();
      targetX = (.5 - (event.clientY - bounds.top) / bounds.height) * strength;
      targetY = ((event.clientX - bounds.left) / bounds.width - .5) * strength;
      schedule();
    }, { passive:true });
    surface.addEventListener('pointerleave', reset);
    surface.addEventListener('focusout', reset);
    motion.addEventListener('change', reset);
  }
})();
