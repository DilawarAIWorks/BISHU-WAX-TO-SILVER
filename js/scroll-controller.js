/**
 * BISHU Atelier — Scroll Controller Module
 * Manages scroll progression for the full-bleed hero sequence and below-hero narrative banners.
 * Uses passive scroll listeners and batched DOM reads/writes.
 */

export class ScrollController {
  constructor({ renderer, onHeroProgress, onStageChange }) {
    this.renderer = renderer;
    this.onHeroProgress = onHeroProgress;
    this.onStageChange = onStageChange;

    this.heroTrack = document.getElementById('hero-track');
    this.heroCanvas = document.getElementById('hero-canvas');
    this.banners = [];
    this.ticking = false;
    this.isReducedMotion = false;
    this.currentStageIndex = 1;

    this.scrollListener = this.onScroll.bind(this);
    this.resizeListener = this.onResize.bind(this);
  }

  registerBanner(element, canvasElement, frameRange) {
    if (!element || !canvasElement) return;
    this.banners.push({
      element,
      canvas: canvasElement,
      frameRange
    });
  }

  setReducedMotion(reduced) {
    this.isReducedMotion = reduced;
  }

  init() {
    window.addEventListener('scroll', this.scrollListener, { passive: true });
    window.addEventListener('resize', this.resizeListener, { passive: true });
    window.addEventListener('orientationchange', this.resizeListener, { passive: true });

    // Initial check
    this.update();
  }

  onScroll() {
    if (!this.ticking && !this.isReducedMotion) {
      this.ticking = true;
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
    }
  }

  onResize() {
    this.renderer.handleResize();
    this.update();
  }

  update() {
    if (this.isReducedMotion) return;

    // === 1. BATCHED READS ===
    const scrollY = window.scrollY;
    const innerH = window.innerHeight;
    const heroRect = this.heroTrack ? this.heroTrack.getBoundingClientRect() : null;
    const bannerData = [];

    for (const b of this.banners) {
      bannerData.push({
        banner: b,
        rect: b.element.getBoundingClientRect()
      });
    }

    // === 2. BATCHED WRITES & LOGIC ===
    // Hero Progress Calculation (only if hero canvas is not autoplaying)
    const heroItem = this.heroCanvas ? this.renderer.canvases.get(this.heroCanvas) : null;
    if (heroItem && !heroItem.autoplay && this.heroTrack && heroRect) {
      const scrollableRange = this.heroTrack.offsetHeight - innerH;
      const progress = scrollableRange > 0 ? Math.max(0, Math.min(1, -heroRect.top / scrollableRange)) : 0;

      this.renderer.setProgress(this.heroCanvas, progress);

      if (this.onHeroProgress) {
        this.onHeroProgress(progress);
      }

      let stage = 1;
      if (progress >= 0.88) stage = 4;
      else if (progress >= 0.65) stage = 3;
      else if (progress >= 0.30) stage = 2;

      if (stage !== this.currentStageIndex) {
        this.currentStageIndex = stage;
        if (this.onStageChange) {
          this.onStageChange(stage, progress);
        }
      }
    }

    // Below-hero Banners Progress Calculation
    for (const item of bannerData) {
      const { banner, rect } = item;
      const travelDist = innerH + rect.height;
      if (travelDist > 0) {
        const localProgress = Math.max(0, Math.min(1, (innerH - rect.top) / travelDist));
        this.renderer.setProgress(banner.canvas, localProgress);
      }
    }
  }

  scrollToStage(stageIndex) {
    if (!this.heroTrack) return;
    const innerH = window.innerHeight;
    const scrollableRange = this.heroTrack.offsetHeight - innerH;
    const targets = {
      1: 0.0,
      2: 0.40,
      3: 0.72,
      4: 1.0
    };
    const targetProgress = targets[stageIndex] !== undefined ? targets[stageIndex] : 0;
    const targetScrollY = this.heroTrack.offsetTop + (scrollableRange * targetProgress);

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  teardown() {
    window.removeEventListener('scroll', this.scrollListener);
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('orientationchange', this.resizeListener);
  }
}
