/**
 * BISHU — WAX TO SILVER
 * Pure Vanilla JavaScript Animation & Scroll Engine
 * 
 * Features:
 * - HTML5 Canvas rendering for 168 frames sequence
 * - DevicePixelRatio / Retina support with zero distortion
 * - Object-fit contain scaling (preserves exact 16:9 frame ratio)
 * - Scroll-coupled bidirectional playback (0% to 100% -> 100% to 0%)
 * - RequestAnimationFrame render throttle (only renders when frame changes)
 * - Intelligent progressive frame preloader with visual feedback
 * - Interactive timeline scrubbing and stage jump navigation
 * - Accessibility & prefers-reduced-motion fallback
 */

(function () {
  'use strict';

  // =========================================================================
  // CONFIGURATION & STATE
  // =========================================================================
  const CONFIG = {
    totalFrames: 168,
    framePathPrefix: 'assets/frames/ezgif-frame-',
    frameExtension: '.jpg',
    nativeWidth: 1920,
    nativeHeight: 1080,
    // Stage boundary frame ranges (1-indexed)
    stages: [
      {
        id: 1,
        name: '01 / CARVE',
        title: 'Hand Carving',
        desc: "High-density blue jeweler's wax shaped with blade and file to your personal ergonomics.",
        startFrame: 1,
        endFrame: 54,
        keyFrame: 25
      },
      {
        id: 2,
        name: '02 / CAST',
        title: 'Lost-Wax Casting',
        desc: 'Molten sterling silver fills the investment flask, vaporizing and replacing the wax master.',
        startFrame: 55,
        endFrame: 100,
        keyFrame: 80
      },
      {
        id: 3,
        name: '03 / REFINE',
        title: 'Refine & Buff',
        desc: 'Raw casting skin refined with rotary burs and cotton wheels for a mirror finish.',
        startFrame: 101,
        endFrame: 146,
        keyFrame: 125
      },
      {
        id: 4,
        name: '04 / SILVER',
        title: 'Sterling Silver',
        desc: 'Solid 925 sterling silver ring. Permanent, personal, and sculpted by your own hands.',
        startFrame: 147,
        endFrame: 168,
        keyFrame: 168
      }
    ]
  };

  // State
  const state = {
    images: [],
    loadedCount: 0,
    isReady: false,
    currentFrame: 1,
    targetFrame: 1,
    lastRenderedFrame: -1,
    scrollProgress: 0,
    isScrubbing: false,
    activeStageId: 1,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // DOM Elements
  const DOM = {
    header: document.getElementById('site-header'),
    headerStagePill: document.getElementById('header-stage-pill'),
    heroTrack: document.getElementById('hero-track'),
    canvas: document.getElementById('hero-canvas'),
    canvasStage: document.getElementById('canvas-stage'),
    loader: document.getElementById('canvas-loader'),
    loaderBar: document.getElementById('loader-bar'),
    loaderStatus: document.getElementById('loader-status'),
    heroOverlayTop: document.querySelector('.hero-overlay-top'),
    stageCard: document.getElementById('hero-stage-card'),
    stageCardNumber: document.getElementById('stage-card-number'),
    stageCardTitle: document.getElementById('stage-card-title'),
    stageCardDesc: document.getElementById('stage-card-desc'),
    timelineContainer: document.getElementById('timeline-container'),
    timelineProgress: document.getElementById('timeline-progress'),
    timelineThumb: document.getElementById('timeline-thumb'),
    frameCounter: document.getElementById('frame-counter'),
    stageTabs: document.querySelectorAll('.stage-tab'),
    jumpButtons: document.querySelectorAll('.jump-to-stage-btn'),
    reducedMotionControl: document.getElementById('reduced-motion-control'),
    reducedMotionSlider: document.getElementById('reduced-motion-slider'),
    reducedMotionVal: document.getElementById('reduced-motion-val'),
    inquireBtn: document.getElementById('inquire-btn'),
    kitModalMessage: document.getElementById('kit-modal-message')
  };

  const ctx = DOM.canvas ? DOM.canvas.getContext('2d', { alpha: false }) : null;

  // =========================================================================
  // 1. FRAME PRELOADER
  // =========================================================================
  function getFrameSrc(index) {
    const padded = String(index).padStart(3, '0');
    return `${CONFIG.framePathPrefix}${padded}${CONFIG.frameExtension}`;
  }

  function initPreloader() {
    state.images = new Array(CONFIG.totalFrames + 1);

    // Load Frame 1 first for immediate first paint
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    firstImg.onload = () => {
      state.images[1] = firstImg;
      state.loadedCount++;
      resizeCanvas();
      renderFrame(1);
      loadRemainingFrames();
    };
    firstImg.onerror = () => {
      console.warn('Failed to load initial frame 1');
      loadRemainingFrames();
    };
  }

  function loadRemainingFrames() {
    let loaded = state.loadedCount;
    const total = CONFIG.totalFrames;

    for (let i = 2; i <= total; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);

      img.onload = () => {
        state.images[i] = img;
        loaded++;
        state.loadedCount = loaded;
        updateLoadingProgress(loaded, total);

        if (loaded >= total) {
          onAllFramesLoaded();
        }
      };

      img.onerror = () => {
        loaded++;
        state.loadedCount = loaded;
        updateLoadingProgress(loaded, total);
        if (loaded >= total) {
          onAllFramesLoaded();
        }
      };
    }
  }

  function updateLoadingProgress(loaded, total) {
    const percent = Math.round((loaded / total) * 100);
    if (DOM.loaderBar) {
      DOM.loaderBar.style.width = `${percent}%`;
    }
    if (DOM.loaderStatus) {
      DOM.loaderStatus.textContent = `Loading sequence ${percent}%`;
    }
  }

  function onAllFramesLoaded() {
    state.isReady = true;
    if (DOM.loader) {
      DOM.loader.classList.add('loaded');
      setTimeout(() => {
        DOM.loader.style.display = 'none';
      }, 700);
    }
    // Re-render current frame with high-quality source
    renderFrame(state.currentFrame);
  }

  // =========================================================================
  // 2. CANVAS SIZING & RENDERING
  // =========================================================================
  function resizeCanvas() {
    if (!DOM.canvas || !DOM.canvasStage) return;

    const rect = DOM.canvasStage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    DOM.canvas.width = Math.round(rect.width * dpr);
    DOM.canvas.height = Math.round(rect.height * dpr);

    // Force redraw on next frame
    state.lastRenderedFrame = -1;
    renderFrame(state.currentFrame);
  }

  /**
   * Renders the given frame onto the canvas using contain-scaling
   * guarantees zero distortion, zero stretching, and zero clipping of the ring.
   */
  function renderFrame(frameIndex) {
    if (!ctx || !DOM.canvas) return;

    const img = state.images[frameIndex];
    // If target frame is not yet loaded, find the closest available frame
    let renderableImg = img;
    if (!renderableImg || !renderableImg.complete) {
      for (let offset = 1; offset < CONFIG.totalFrames; offset++) {
        const prev = state.images[frameIndex - offset];
        if (prev && prev.complete) { renderableImg = prev; break; }
        const next = state.images[frameIndex + offset];
        if (next && next.complete) { renderableImg = next; break; }
      }
    }

    if (!renderableImg || !renderableImg.complete) return;

    const cw = DOM.canvas.width;
    const ch = DOM.canvas.height;
    const imgW = renderableImg.naturalWidth || CONFIG.nativeWidth;
    const imgH = renderableImg.naturalHeight || CONFIG.nativeHeight;

    const canvasAspect = cw / ch;
    const imgAspect = imgW / imgH;

    let drawW, drawH;
    if (canvasAspect > imgAspect) {
      // Canvas is wider than 16:9
      drawH = ch;
      drawW = drawH * imgAspect;
    } else {
      // Canvas is taller than 16:9 (e.g. mobile portrait)
      drawW = cw;
      drawH = drawW / imgAspect;
    }

    const dx = Math.round((cw - drawW) / 2);
    const dy = Math.round((ch - drawH) / 2);

    // Clean neutral studio background fill to eliminate gaps seamlessly
    ctx.fillStyle = '#eae8e2';
    ctx.fillRect(0, 0, cw, ch);

    // Draw the authoritative image frame
    ctx.drawImage(renderableImg, dx, dy, drawW, drawH);

    state.lastRenderedFrame = frameIndex;
  }

  // =========================================================================
  // 3. SCROLL PROGRESSION & PHYSICS
  // =========================================================================
  function getScrollProgress() {
    if (!DOM.heroTrack) return 0;

    const rect = DOM.heroTrack.getBoundingClientRect();
    const scrollRange = DOM.heroTrack.offsetHeight - window.innerHeight;

    if (scrollRange <= 0) return 0;

    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / scrollRange, 0), 1);
    return progress;
  }

  function updateScroll() {
    const progress = getScrollProgress();
    state.scrollProgress = progress;

    // Map normalized progress (0 to 1) to frame index (1 to 168)
    const targetFrame = Math.min(
      CONFIG.totalFrames,
      Math.max(1, Math.round(progress * (CONFIG.totalFrames - 1)) + 1)
    );

    state.targetFrame = targetFrame;
  }

  // Main Animation / RAF Loop
  function tick() {
    // Smooth interpolation between current and target frame
    if (state.currentFrame !== state.targetFrame) {
      const diff = state.targetFrame - state.currentFrame;
      // Step fast enough for crisp responsiveness without frame lag
      const step = Math.sign(diff) * Math.max(1, Math.min(Math.abs(diff), Math.ceil(Math.abs(diff) * 0.4)));
      state.currentFrame += step;

      renderFrame(state.currentFrame);
      updateHUD(state.currentFrame, state.scrollProgress);
    }

    requestAnimationFrame(tick);
  }

  // =========================================================================
  // 4. DYNAMIC HUD & NARRATIVE UPDATES
  // =========================================================================
  function getStageForFrame(frame) {
    for (const stage of CONFIG.stages) {
      if (frame >= stage.startFrame && frame <= stage.endFrame) {
        return stage;
      }
    }
    return CONFIG.stages[0];
  }

  function updateHUD(frame, progress) {
    // 1. Update Frame Counter
    if (DOM.frameCounter) {
      const padded = String(frame).padStart(3, '0');
      DOM.frameCounter.textContent = `FRAME ${padded} / ${CONFIG.totalFrames}`;
    }

    // 2. Update Timeline Track
    const pct = ((frame - 1) / (CONFIG.totalFrames - 1)) * 100;
    if (DOM.timelineProgress) {
      DOM.timelineProgress.style.width = `${pct}%`;
    }
    if (DOM.timelineThumb) {
      DOM.timelineThumb.style.left = `${pct}%`;
    }

    // 3. Stage Info
    const stage = getStageForFrame(frame);
    if (stage.id !== state.activeStageId) {
      state.activeStageId = stage.id;

      // Update Header Pill
      if (DOM.headerStagePill) {
        const textSpan = DOM.headerStagePill.querySelector('.stage-text');
        if (textSpan) textSpan.textContent = stage.name;
      }

      // Update Floating Stage Card
      if (DOM.stageCardNumber) DOM.stageCardNumber.textContent = `0${stage.id}`;
      if (DOM.stageCardTitle) DOM.stageCardTitle.textContent = stage.title;
      if (DOM.stageCardDesc) DOM.stageCardDesc.textContent = stage.desc;

      // Update Bottom Stage Tabs
      DOM.stageTabs.forEach(tab => {
        const tabStage = parseInt(tab.getAttribute('data-stage'), 10);
        if (tabStage === stage.id) {
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
        } else {
          tab.classList.remove('active');
          tab.setAttribute('aria-selected', 'false');
        }
      });
    }

    // 4. Fade Top Editorial Text as scroll deepens
    if (DOM.heroOverlayTop) {
      if (progress > 0.04) {
        const fade = Math.max(0, 1 - (progress - 0.04) * 6);
        DOM.heroOverlayTop.style.opacity = fade.toFixed(2);
        DOM.heroOverlayTop.style.transform = `translateY(-${((1 - fade) * 20).toFixed(1)}px)`;
      } else {
        DOM.heroOverlayTop.style.opacity = '1';
        DOM.heroOverlayTop.style.transform = 'translateY(0)';
      }
    }

    // 5. Sync Reduced Motion Control if present
    if (DOM.reducedMotionSlider) {
      DOM.reducedMotionSlider.value = frame;
    }
    if (DOM.reducedMotionVal) {
      const padded = String(frame).padStart(3, '0');
      DOM.reducedMotionVal.textContent = `Frame ${padded} / ${CONFIG.totalFrames}`;
    }
  }

  // =========================================================================
  // 5. INTERACTIVE TIMELINE SCRUBBING
  // =========================================================================
  function handleTimelineScrub(e) {
    if (!DOM.timelineContainer || !DOM.heroTrack) return;

    const rect = DOM.timelineContainer.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;

    const scrollRange = DOM.heroTrack.offsetHeight - window.innerHeight;
    const trackTop = DOM.heroTrack.offsetTop;
    const targetScrollY = trackTop + ratio * scrollRange;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  function setupTimelineEvents() {
    if (!DOM.timelineContainer) return;

    DOM.timelineContainer.addEventListener('click', handleTimelineScrub);

    // Draggable scrubbing support
    DOM.timelineContainer.addEventListener('mousedown', (e) => {
      state.isScrubbing = true;
      handleTimelineScrub(e);

      const onMouseMove = (moveEvent) => {
        if (!state.isScrubbing) return;
        handleTimelineScrub(moveEvent);
      };

      const onMouseUp = () => {
        state.isScrubbing = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // =========================================================================
  // 6. STAGE TABS & JUMP BUTTONS
  // =========================================================================
  function scrollToFrame(frameNumber) {
    if (!DOM.heroTrack) return;

    const ratio = (frameNumber - 1) / (CONFIG.totalFrames - 1);
    const scrollRange = DOM.heroTrack.offsetHeight - window.innerHeight;
    const trackTop = DOM.heroTrack.offsetTop;
    const targetScrollY = trackTop + ratio * scrollRange;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  function setupStageNavigation() {
    // Stage Tabs in Hero HUD
    DOM.stageTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const stageId = parseInt(tab.getAttribute('data-stage'), 10);
        const stage = CONFIG.stages.find(s => s.id === stageId);
        if (stage) {
          scrollToFrame(stage.keyFrame);
        }
      });
    });

    // Jump Buttons inside Process Cards
    DOM.jumpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetFrame = parseInt(btn.getAttribute('data-target-frame'), 10);
        if (!isNaN(targetFrame)) {
          scrollToFrame(targetFrame);
        }
      });
    });

    // Inquire CTA Button
    if (DOM.inquireBtn && DOM.kitModalMessage) {
      DOM.inquireBtn.addEventListener('click', () => {
        const isHidden = DOM.kitModalMessage.style.display === 'none';
        DOM.kitModalMessage.style.display = isHidden ? 'inline-block' : 'none';
        if (isHidden) {
          DOM.inquireBtn.textContent = 'Kit Reservation Details Below';
        } else {
          DOM.inquireBtn.textContent = 'Request Wax Carving Kit';
        }
      });
    }
  }

  // =========================================================================
  // 7. HEADER SCROLL STATE & ACTIVE NAV
  // =========================================================================
  function updateHeaderOnScroll() {
    const scrollY = window.scrollY;
    if (DOM.header) {
      if (scrollY > 50) {
        DOM.header.classList.add('scrolled');
      } else {
        DOM.header.classList.remove('scrolled');
      }
    }
  }

  // =========================================================================
  // 8. REDUCED MOTION SUPPORT
  // =========================================================================
  function setupReducedMotion() {
    if (!state.reducedMotion) return;

    if (DOM.reducedMotionControl && DOM.reducedMotionSlider) {
      DOM.reducedMotionControl.style.display = 'flex';

      DOM.reducedMotionSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.currentFrame = val;
        state.targetFrame = val;
        renderFrame(val);
        updateHUD(val, (val - 1) / (CONFIG.totalFrames - 1));

        if (DOM.reducedMotionVal) {
          DOM.reducedMotionVal.textContent = `Frame ${val} of ${CONFIG.totalFrames}`;
        }
      });
    }
  }

  // =========================================================================
  // 9. INITIALIZATION & EVENT LISTENERS
  // =========================================================================
  function init() {
    initPreloader();
    setupTimelineEvents();
    setupStageNavigation();
    setupReducedMotion();

    // Resize listener (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    }, { passive: true });

    // Scroll listener (passive)
    window.addEventListener('scroll', () => {
      updateScroll();
      updateHeaderOnScroll();
    }, { passive: true });

    // Initial check
    updateScroll();
    updateHeaderOnScroll();

    // Start RAF loop
    requestAnimationFrame(tick);

    // Expose for testing & inspection
    window.__BISHU__ = { state, CONFIG, scrollToFrame, renderFrame };
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
