// main.js
// Объединяет script.js и background.js, избегая конфликтов

// Убедимся, что код выполняется после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // === Меню и навигация (из script.js) ===
  const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId);
    const nav = document.getElementById(navId);

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        nav.classList.toggle('show');
      });
    }
  };

  showMenu('nav-toggle', 'nav-menu');

  const navLink = document.querySelectorAll('.nav-link');

  function linkAction() {
    navLink.forEach((n) => n.classList.remove('active'));
    this.classList.add('active');

    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.remove('show');
  }

  navLink.forEach((n) => n.addEventListener('click', linkAction));

  // === ScrollReveal анимации (из script.js) ===
  const reduceRevealMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sr = document.documentElement.classList.contains('depth-enabled') ? { reveal() {} } : ScrollReveal({
    origin: 'top',
    distance: reduceRevealMotion ? '0px' : '80px',
    duration: reduceRevealMotion ? 0 : 2000,
    reset: false,
  });

  sr.reveal('.home-title', {});
  sr.reveal('.button', { delay: 200 });
  sr.reveal('.home-img', { delay: 400 });
  sr.reveal('.home-social', { delay: 400 });
  sr.reveal('.about-img', {});
  sr.reveal('.about-subtitle', { delay: 200 });
  sr.reveal('.about-text', { delay: 400 });
  sr.reveal('.skills-subtitle', { delay: 100 });
  sr.reveal('.skills-text', { delay: 150 });
  sr.reveal('.skills-data', { interval: 200 });
  sr.reveal('.skills-img', { delay: 400 });
  sr.reveal('.work-img', { interval: 200 });
  sr.reveal('.content2', { interval: 200 });
  // Cover the newer sections without animating nested content twice.
  sr.reveal('.section-title', {});
  sr.reveal('.hero-eyebrow', {});
  sr.reveal('.hero-description', { delay: 150 });
  sr.reveal('.hero-secondary', { delay: 200 });
  sr.reveal('.hero-stack', { delay: 250 });
  sr.reveal('.hero-footer', { delay: 300 });
  sr.reveal('.hero-art', { distance: '0px', delay: 200 });
  sr.reveal('.about-container > .container', { distance: '0px' });
  sr.reveal('.ribbon-showcase-frame', { distance: '0px' });
  sr.reveal('.project-filter-card', { interval: 120, distance: reduceRevealMotion ? '0px' : '32px' });
  sr.reveal('.faq-item', { interval: 120, distance: reduceRevealMotion ? '0px' : '32px' });
  sr.reveal('.scroll-effect-footer', { distance: '0px' });

  // === Vue компонент для карточки (из background.js) ===
  Vue.config.devtools = true;

  Vue.component('card', {
    template: `
      <div class="card-wrap"
        @mousemove="handleMouseMove"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        ref="card">
        <div class="card"
          :style="cardStyle">
          <div class="card-bg" :style="[cardBgTransform, cardBgImage]"></div>
          <div class="card-info">
            <slot name="header"></slot>
            <slot name="content"></slot>
          </div>
        </div>
      </div>`,
    mounted() {
      this.width = this.$refs.card.offsetWidth;
      this.height = this.$refs.card.offsetHeight;
    },
    props: ['dataImage'],
    data: () => ({
      width: 0,
      height: 0,
      mouseX: 0,
      mouseY: 0,
      mouseLeaveDelay: null,
    }),
    computed: {
      mousePX() {
        return this.mouseX / this.width;
      },
      mousePY() {
        return this.mouseY / this.height;
      },
      cardStyle() {
        const rX = this.mousePX * 30;
        const rY = this.mousePY * -30;
        return {
          transform: `rotateY(${rX}deg) rotateX(${rY}deg)`,
        };
      },
      cardBgTransform() {
        const tX = this.mousePX * -40;
        const tY = this.mousePY * -40;
        return {
          transform: `translateX(${tX}px) translateY(${tY}px)`,
        };
      },
      cardBgImage() {
        return {
          backgroundImage: `url(${this.dataImage})`,
        };
      },
    },
    methods: {
      handleMouseMove(e) {
        const bounds = this.$el.getBoundingClientRect();
        this.width = Math.max(1, bounds.width);
        this.height = Math.max(1, bounds.height);
        this.mouseX = Math.max(-.5, Math.min(.5, (e.clientX - bounds.left) / this.width - .5)) * this.width;
        this.mouseY = Math.max(-.5, Math.min(.5, (e.clientY - bounds.top) / this.height - .5)) * this.height;
      },
      handleMouseEnter() {
        clearTimeout(this.mouseLeaveDelay);
      },
      handleMouseLeave() {
        this.mouseLeaveDelay = setTimeout(() => {
          this.mouseX = 0;
          this.mouseY = 0;
        }, 1000);
      },
    },
  });

  const app = new Vue({
    el: '#app',
  });

  // === Слайдер карточек (из background.js) ===
  const next = document.querySelector('#next');
  const prev = document.querySelector('#prev');

  function handleScrollNext() {
    const cards = document.querySelector('.con-cards');
    cards.scrollLeft += window.innerWidth / 2 > 600 ? window.innerWidth / 2 : window.innerWidth - 100;
  }

  function handleScrollPrev() {
    const cards = document.querySelector('.con-cards');
    cards.scrollLeft -= window.innerWidth / 2 > 600 ? window.innerWidth / 2 : window.innerWidth - 100;
  }

  if (next && prev) {
    next.addEventListener('click', handleScrollNext);
    prev.addEventListener('click', handleScrollPrev);
  }

  {
  // === Анимация футера (из background.js) ===
  const config = {
    theme: 'dark',
    animate: true,
    snap: true,
    start: 0,
    end: 360,
    scroll: true,
    debug: false,
  };

  let items;
  let scrollerScrub;
  let dimmerScrub;
  let chromaEntry;
  let chromaExit;

  const mainContainer = document.querySelector('.scroll-effect-container');

  const update = () => {
    mainContainer.dataset.theme = config.theme;
    mainContainer.dataset.syncScrollbar = config.scroll;
    mainContainer.dataset.animate = config.animate;
    mainContainer.dataset.snap = config.snap;
    mainContainer.dataset.debug = config.debug;
    mainContainer.style.setProperty('--start', config.start);
    mainContainer.style.setProperty('--hue', config.start);
    mainContainer.style.setProperty('--end', config.end);

    if (!config.animate) {
      if (chromaEntry) chromaEntry.scrollTrigger.disable(true, false);
      if (chromaExit) chromaExit.scrollTrigger.disable(true, false);
      if (dimmerScrub) dimmerScrub.disable(true, false);
      if (scrollerScrub) scrollerScrub.disable(true, false);
      gsap.set(items, { opacity: 1 });
      gsap.set(mainContainer, { '--chroma': 0 });
    } else {
      gsap.set(items, { opacity: (i) => (i !== 0 ? 0.2 : 1) });
      if (dimmerScrub) dimmerScrub.enable(true, true);
      if (scrollerScrub) scrollerScrub.enable(true, true);
      if (chromaEntry) chromaEntry.scrollTrigger.enable(true, true);
      if (chromaExit) chromaExit.scrollTrigger.enable(true, true);
    }
  };

  if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
    gsap.registerPlugin(ScrollTrigger);

    items = gsap.utils.toArray('.scroll-effect-list .scroll-effect-list-item');

    const dimmer = gsap
      .timeline()
      .to(items.slice(1), {
        opacity: 1,
        stagger: 0.5,
      })
      .to(
        items.slice(0, items.length - 1),
        {
          opacity: 0.2,
          stagger: 0.5,
        },
        0
      );

    dimmerScrub = ScrollTrigger.create({
      trigger: items[0],
      endTrigger: items[items.length - 1],
      start: 'center center',
      end: 'center center',
      animation: dimmer,
      scrub: 0.2,
    });

    const scroller = gsap.timeline().fromTo(
      mainContainer,
      { '--hue': config.start },
      { '--hue': config.end, ease: 'none' }
    );

    scrollerScrub = ScrollTrigger.create({
      trigger: items[0],
      endTrigger: items[items.length - 1],
      start: 'center center',
      end: 'center center',
      animation: scroller,
      scrub: 0.2,
    });

    chromaEntry = gsap.fromTo(
      mainContainer,
      { '--chroma': 0 },
      {
        '--chroma': 0.3,
        ease: 'none',
        scrollTrigger: {
          scrub: 0.2,
          trigger: items[0],
          start: 'center center+=40',
          end: 'center center',
        },
      }
    );

    chromaExit = gsap.fromTo(
      mainContainer,
      { '--chroma': 0.3 },
      {
        '--chroma': 0,
        ease: 'none',
        scrollTrigger: {
          scrub: 0.2,
          trigger: items[items.length - 2],
          start: 'center center',
          end: 'center center-=40',
        },
      }
    );
  }

  update();

  }

  // === Появление основного контента ===
  const lMain = document.querySelector('.l-main');
  const homeImg = document.querySelector('.home-img');

  if (lMain) {
    setTimeout(() => {
      lMain.style.visibility = 'visible';
      lMain.style.opacity = '1';
    }, 100);
  }

  if (homeImg) {
    setTimeout(() => {
      homeImg.style.visibility = 'visible';
      homeImg.style.opacity = '1';
    }, 200);
  }
});

// === requestAnimationFrame polyfill (из background.js) ===
(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
})();
