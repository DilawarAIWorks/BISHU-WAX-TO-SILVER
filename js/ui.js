/**
 * BISHU Atelier — UI Module
 * Controls the preloader choreographed transition, HUD status updates,
 * canvas drag scrubbing, timeline interaction, and accessible reduced-motion controls.
 */

export class UIController {
  constructor({ renderer, scrollController, frameLoader }) {
    this.renderer = renderer;
    this.scrollController = scrollController;
    this.frameLoader = frameLoader;

    // Elements
    this.loader = document.getElementById('canvas-loader');
    this.loaderBar = document.getElementById('loader-bar');
    this.heroCanvas = document.getElementById('hero-canvas');
    this.canvasStage = document.getElementById('canvas-stage') || document.querySelector('.hero-sticky-container');

    // HUD Elements
    this.headerStagePill = document.getElementById('header-stage-pill');
    this.stageText = this.headerStagePill ? this.headerStagePill.querySelector('.stage-text') : null;
    this.stageCardNumber = document.getElementById('stage-card-number');
    this.stageCardTitle = document.getElementById('stage-card-title');
    this.stageCardDesc = document.getElementById('stage-card-desc');
    this.timelineProgress = document.getElementById('timeline-progress');
    this.timelineThumb = document.getElementById('timeline-thumb');
    this.timelineStatus = document.getElementById('timeline-status');
    this.timelineContainer = document.getElementById('timeline-container');
    this.stageTabs = document.querySelectorAll('.stage-tab');

    // Reduced Motion
    this.reducedMotionContainer = document.getElementById('reduced-motion-control');
    this.reducedMotionSlider = document.getElementById('reduced-motion-slider');
    this.reducedMotionVal = document.getElementById('reduced-motion-val');

    // Stage Metadata
    this.stageMeta = {
      1: {
        pill: '01 · HAND SCULPT',
        number: 'CHAPTER 01',
        title: 'Hand Sculpting',
        desc: 'High-density blue jeweler’s wax carved by hand to your personal finger geometry.'
      },
      2: {
        pill: '02 · FOUNDRY CAST',
        number: 'CHAPTER 02',
        title: 'Lost-Wax Casting',
        desc: 'The wax original vaporizes cleanly in the kiln, replaced by molten 925 sterling silver.'
      },
      3: {
        pill: '03 · SURFACE POLISH',
        number: 'CHAPTER 03',
        title: 'Bench Refinement',
        desc: 'Precision rotary sanding, sprue removal, and comfort radiusing along the internal bore.'
      },
      4: {
        pill: '04 · STERLING SILVER',
        number: 'CHAPTER 04',
        title: 'Sterling Silver Piece',
        desc: 'Buffed on cotton wheels with jeweler’s rouge to a luminous, mirror-specular luster.'
      }
    };

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartProgress = 0;
  }

  init() {
    this.initPreloader();
    this.initStageTabs();
    this.initTimelineInteraction();
    this.initCanvasDrag();
    this.initFAQ();
    this.initReducedMotion();
  }

  initPreloader() {
    // FrameLoader progress updates thin determinate bar
    this.frameLoader.onProgress = (ratio) => {
      if (this.loaderBar) {
        this.loaderBar.style.width = `${Math.round(ratio * 100)}%`;
      }
    };

    this.frameLoader.onFirstFrame = () => {
      // Paint first frame immediately
      if (this.heroCanvas) {
        this.renderer.setProgress(this.heroCanvas, 0);
        this.renderer.forceRedrawAll();
      }
    };

    this.frameLoader.onComplete = () => {
      this.dismissPreloader();
    };

    // Safety fallback: if all frames take longer than 3 seconds, fade preloader if first frame is ready
    setTimeout(() => {
      if (this.loader && !this.loader.classList.contains('dismissed')) {
        this.dismissPreloader();
      }
    }, 3000);
  }

  dismissPreloader() {
    if (!this.loader || this.loader.classList.contains('dismissed')) return;
    this.loader.classList.add('dismissed');
    setTimeout(() => {
      if (this.loader) {
        this.loader.style.display = 'none';
        this.loader.setAttribute('aria-hidden', 'true');
      }
    }, 600);
  }

  updateHUD(progress) {
    const pct = Math.round(progress * 100);

    // Smoothly fade hero title overlay as user scrolls down
    const heroOverlayTop = document.getElementById('hero-overlay-top');
    if (heroOverlayTop) {
      const alpha = Math.max(0, Math.min(1, 1 - (progress / 0.18)));
      heroOverlayTop.style.opacity = alpha.toFixed(3);
      heroOverlayTop.style.transform = `translateY(-${(progress * 35).toFixed(1)}px)`;
      heroOverlayTop.style.pointerEvents = alpha < 0.1 ? 'none' : 'auto';
    }

    if (this.timelineProgress) {
      this.timelineProgress.style.width = `${pct}%`;
    }
    if (this.timelineThumb) {
      this.timelineThumb.style.left = `${pct}%`;
    }
    if (this.timelineStatus) {
      this.timelineStatus.textContent = `Transformation: ${pct}% Complete`;
    }

    if (this.reducedMotionSlider && !this.isSliderActive) {
      this.reducedMotionSlider.value = pct;
      if (this.reducedMotionVal) {
        this.reducedMotionVal.textContent = `${pct}% Processed`;
      }
    }
  }

  updateStage(stageIndex) {
    const meta = this.stageMeta[stageIndex] || this.stageMeta[1];

    if (this.stageText) {
      this.stageText.textContent = meta.pill;
    }
    if (this.stageCardNumber) {
      this.stageCardNumber.textContent = meta.number;
    }
    if (this.stageCardTitle) {
      this.stageCardTitle.textContent = meta.title;
    }
    if (this.stageCardDesc) {
      this.stageCardDesc.textContent = meta.desc;
    }

    // Update stage milestone tabs
    this.stageTabs.forEach((tab) => {
      const tabStage = parseInt(tab.dataset.stage, 10);
      const isActive = tabStage === stageIndex;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  initStageTabs() {
    this.stageTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const stage = parseInt(tab.dataset.stage, 10);
        this.scrollController.scrollToStage(stage);
      });
    });

    // Jump-to-stage buttons throughout editorial
    document.querySelectorAll('.jump-to-stage-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stage = parseInt(btn.dataset.targetStage, 10);
        this.scrollController.scrollToStage(stage);
      });
    });
  }

  initTimelineInteraction() {
    if (!this.timelineContainer) return;

    const handleScrub = (e) => {
      const rect = this.timelineContainer.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      const heroTrack = document.getElementById('hero-track');
      if (heroTrack) {
        const maxScroll = heroTrack.offsetHeight - window.innerHeight;
        const targetScroll = heroTrack.offsetTop + maxScroll * ratio;
        window.scrollTo({
          top: targetScroll,
          behavior: 'auto'
        });
      }
    };

    let scrubbing = false;
    this.timelineContainer.addEventListener('pointerdown', (e) => {
      scrubbing = true;
      this.timelineContainer.setPointerCapture(e.pointerId);
      handleScrub(e);
    });

    this.timelineContainer.addEventListener('pointermove', (e) => {
      if (scrubbing) handleScrub(e);
    });

    const stopScrub = (e) => {
      if (scrubbing) {
        scrubbing = false;
        try {
          this.timelineContainer.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    this.timelineContainer.addEventListener('pointerup', stopScrub);
    this.timelineContainer.addEventListener('pointercancel', stopScrub);
  }

  initCanvasDrag() {
    const target = this.canvasStage || this.heroCanvas;
    if (!target) return;

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.isDragging = true;
      this.dragStartX = e.clientX;

      const heroTrack = document.getElementById('hero-track');
      const maxScroll = heroTrack ? heroTrack.offsetHeight - window.innerHeight : 1;
      this.dragStartProgress = maxScroll > 0 ? (window.scrollY - (heroTrack ? heroTrack.offsetTop : 0)) / maxScroll : 0;

      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      // Dragging right advances the sequence, dragging left reverses
      const sensitivity = 0.0015;
      const newProgress = Math.max(0, Math.min(1, this.dragStartProgress + dx * sensitivity));

      const heroTrack = document.getElementById('hero-track');
      if (heroTrack) {
        const maxScroll = heroTrack.offsetHeight - window.innerHeight;
        const targetScroll = heroTrack.offsetTop + maxScroll * newProgress;
        window.scrollTo({
          top: targetScroll,
          behavior: 'auto'
        });
      }
    };

    const onPointerUp = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
  }

  initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      const trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isExpanded = item.classList.contains('active');
        // Close others for clean accordion
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            const otherBtn = other.querySelector('.faq-trigger');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('active', !isExpanded);
        trigger.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
      });
    });
  }

  initReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkReduced = (mq) => {
      const isReduced = mq.matches;
      this.scrollController.setReducedMotion(isReduced);

      if (this.reducedMotionContainer) {
        this.reducedMotionContainer.style.display = isReduced ? 'flex' : 'none';
        this.reducedMotionContainer.setAttribute('aria-hidden', isReduced ? 'false' : 'true');
      }

      if (isReduced) {
        // Freeze canvas on still frame 1 initially
        this.renderer.setProgress(this.heroCanvas, 0);
        this.updateHUD(0);
        this.updateStage(1);
      }
    };

    mediaQuery.addEventListener('change', checkReduced);
    checkReduced(mediaQuery);

    if (this.reducedMotionSlider) {
      this.reducedMotionSlider.addEventListener('input', (e) => {
        this.isSliderActive = true;
        const val = parseFloat(e.target.value);
        const progress = val / 100;
        this.renderer.setProgress(this.heroCanvas, progress);
        this.updateHUD(progress);

        let stage = 1;
        if (progress >= 0.88) stage = 4;
        else if (progress >= 0.65) stage = 3;
        else if (progress >= 0.30) stage = 2;
        this.updateStage(stage);
      });

      this.reducedMotionSlider.addEventListener('change', () => {
        this.isSliderActive = false;
      });
    }
  }
}
