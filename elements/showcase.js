/* Fade a project-row edge only when there is actually a card beyond it.
   Card bounds also account for padding and the first scroll-snap position. */
(() => {
  const row = document.querySelector('.con-cards');
  if (!row?.firstElementChild) return;
  const next = row.closest('.work-container')?.querySelector('#next');
  let pending = 0;
  const updateEdges = () => {
    pending = 0;
    const bounds = row.getBoundingClientRect();
    row.classList.toggle('has-scroll-before', row.firstElementChild.getBoundingClientRect().left < bounds.left - 1);
    const hasMore = row.lastElementChild.getBoundingClientRect().right > bounds.right + 1;
    row.classList.toggle('has-scroll-after', hasMore);
    if (next) {
      next.disabled = !hasMore;
      next.style.visibility = hasMore ? 'visible' : 'hidden';
    }
  };
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(updateEdges);
  };
  row.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(schedule).observe(row);
  window.addEventListener('load', schedule, { once: true });
  updateEdges();
})();

/* One native page scroll drives the ribbon, regardless of cursor position. */
(() => {
  const frame = document.querySelector('.ribbon-showcase-frame');
  if (!frame) return;
  const section = frame.closest('.ribbon-showcase');
  const targetOrigin = location.protocol === 'file:' ? '*' : location.origin;
  const send = data => frame.contentWindow?.postMessage(data, targetOrigin);
  let visible = false;
  let pendingFrame = 0;
  let pointerStart = null;
  const syncScroll = () => {
    pendingFrame = 0;
    if (visible) send({ type: 'ribbon-page-scroll', offset: -frame.getBoundingClientRect().top * .0025 });
  };
  const scheduleScroll = () => {
    if (visible && !pendingFrame) pendingFrame = requestAnimationFrame(syncScroll);
  };
  const notify = () => {
    send({ type: 'ribbon-visibility', visible });
    scheduleScroll();
  };
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    notify();
  });
  observer.observe(frame);
  frame.addEventListener('load', notify);
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  const pointerPosition = event => {
    const rect = frame.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };
  section.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') send({ type: 'ribbon-pointer', ...pointerPosition(event) });
  }, { passive: true });
  section.addEventListener('pointerleave', () => {
    section.style.cursor = '';
    send({ type: 'ribbon-pointer', x: .5, y: .5 });
  });
  section.addEventListener('pointerdown', event => {
    pointerStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  section.addEventListener('pointercancel', () => { pointerStart = null; });
  section.addEventListener('click', event => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) return;
    pointerStart = null;
    send({ type: 'ribbon-pick', ...pointerPosition(event) });
  });
  section.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    send({ type: 'ribbon-step', direction: event.key === 'ArrowRight' ? 1 : -1 });
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'ribbon-ready') notify();
    if (event.data?.type === 'ribbon-hover') section.style.cursor = event.data.active ? 'pointer' : '';
    if (event.data?.type === 'ribbon-project') {
      const shoppingUrl = 'https://www.figma.com/design/F6DogmD7gBJZ7CglXbnBss/Online-Shopping-App--Community-?node-id=1-2';
      const figmaProjects = [shoppingUrl,
        'https://www.figma.com/proto/z0x7tH5Ac9C6xRS9YNN6ob/Weather-App-UI-Design--Community-?node-id=2-2214',
        'https://www.figma.com/proto/cGdZtnbHOCq5NXBA5ivVtJ/Interactive-Website--Figma-UI-Design-Tutorial-for-Beginners-%7C-Step-by-Step-Guide--Community-?node-id=0-1'];
      if (figmaProjects.includes(event.data.url)) location.assign(event.data.url);
      else if (['../../assets/projects/task-management.png', '../../assets/projects/aspen-travel.png', '../../assets/projects/cinema-booking.png', '../../assets/projects/food-delivery.png'].includes(event.data.url)) window.open(new URL(event.data.url, frame.src).href, '_blank', 'noopener,noreferrer');
      else location.hash = 'work';
    }
  });
})();

/* Keep a clear gap around the ribbon and dissolve the background network
   before it reaches the iframe, rather than clipping it at the white edge. */
(() => {
  const background = document.getElementById('demo-canvas');
  const section = document.querySelector('.ribbon-showcase');
  if (!background || !section) return;
  let pending = 0;
  const updateFade = () => {
    pending = 0;
    const canvasRect = background.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    if (!canvasRect.height || !sectionRect.height) return;
    const top = sectionRect.top - canvasRect.top;
    const bottom = sectionRect.bottom - canvasRect.top;
    const gap = 28;
    const fade = Math.min(140, Math.max(90, innerWidth * .1));
    background.style.setProperty('--ribbon-fade-start', `${top - gap - fade}px`);
    background.style.setProperty('--ribbon-gap-start', `${top - gap}px`);
    background.style.setProperty('--ribbon-gap-end', `${bottom + gap}px`);
    background.style.setProperty('--ribbon-fade-end', `${bottom + gap + fade}px`);
    background.classList.add('has-ribbon-fade');
  };
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(updateFade);
  };
  const observer = new ResizeObserver(schedule);
  [background, section, document.getElementById('about')].filter(Boolean).forEach(element => observer.observe(element));
  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
})();
