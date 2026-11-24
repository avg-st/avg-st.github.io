/* Image slider adapted from https://codepen.io/MDJAmin/pen/GgpdKPy. */
(() => {
  const slider = document.querySelector('.landscape-slider');
  if (!slider) return;
  const slides = slider.querySelector('.landscape-slides');
  const items = [...slides.children];
  const counter = slider.querySelector('.landscape-counter');
  let transitioning = false;
  let start = null;

  function update() {
    const active = slides.children[1];
    items.forEach(item => {
      const selected = item === active;
      item.setAttribute('aria-hidden', String(!selected));
      item.inert = !selected;
    });
    counter.textContent = `${active.dataset.name} · ${items.indexOf(active) + 1} / ${items.length}`;
  }

  function move(direction) {
    if (transitioning) return;
    transitioning = true;
    if (direction > 0) slides.append(slides.firstElementChild);
    else slides.prepend(slides.lastElementChild);
    update();
    setTimeout(() => { transitioning = false; }, 500);
  }

  slider.querySelector('.landscape-next').addEventListener('click', () => move(1));
  slider.querySelector('.landscape-prev').addEventListener('click', () => move(-1));
  slider.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  slider.addEventListener('pointerdown', event => {
    if (event.target.closest('a, button') || event.pointerType === 'mouse') return;
    start = { x: event.clientX, y: event.clientY };
  });
  slider.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    start = null;
  });
  slider.addEventListener('pointercancel', () => { start = null; });
  update();
})();

/* Pause WebGL outside the viewport and preserve scrolling over the iframe. */
(() => {
  const frame = document.querySelector('.ribbon-showcase-frame');
  if (!frame) return;
  let visible = false;
  const notify = () => frame.contentWindow?.postMessage({ type: 'ribbon-visibility', visible }, location.protocol === 'file:' ? '*' : location.origin);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    notify();
  });
  observer.observe(frame);
  frame.addEventListener('load', notify);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'ribbon-scroll' || !Number.isFinite(event.data.delta)) return;
    window.scrollBy({ top: Math.max(-innerHeight, Math.min(innerHeight, event.data.delta)), behavior: 'instant' });
  });
})();
