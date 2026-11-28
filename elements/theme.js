(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-switch');
  const sync = () => {
    const dark = root.dataset.theme !== 'light';
    toggle.setAttribute('aria-checked', String(dark));
    toggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    document.querySelector('.ribbon-showcase-frame')?.contentWindow?.postMessage({ type:'portfolio-theme', theme: dark ? 'dark' : 'light' }, location.protocol === 'file:' ? '*' : location.origin);
  };
  sync();
  document.querySelector('.ribbon-showcase-frame')?.addEventListener('load', sync);
  window.addEventListener('message', event => {
    const frame = document.querySelector('.ribbon-showcase-frame');
    if (event.source === frame?.contentWindow && event.origin === location.origin && event.data?.type === 'ribbon-ready') sync();
  });
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch {}
    sync();
  });
  // Animate the original vector layers without rasterising the supplied artwork.
  fetch('assets/porcelain-switch.svg').then(r => { if (!r.ok) throw new Error(); return r.text(); }).then(text => {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    if (svg.localName !== 'svg') return;
    svg.setAttribute('aria-hidden', 'true');
    for (const element of svg.children) {
      const filter = element.getAttribute('filter') || '';
      if (filter.includes('filter5_') || filter.includes('filter6_') || (element.localName === 'rect' && element.getAttribute('opacity') === '0.85')) element.classList.add('porcelain-thumb');
      if (filter.includes('filter1_')) element.classList.add('porcelain-sky');
    }
    toggle.replaceChildren(svg);
  }).catch(() => {});
})();
