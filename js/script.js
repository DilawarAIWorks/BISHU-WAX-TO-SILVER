/**
 * BISHU — WAX TO SILVER
 * Production-Grade Pure Vanilla JavaScript Interactive Engine
 * 
 * Zero frameworks, zero external animation libraries.
 * Features:
 * - HTML5 Canvas rendering for 168 high-definition frame sequence
 * - DevicePixelRatio / Retina support with zero distortion
 * - Object-fit contain scaling (preserves exact 16:9 native ratio)
 * - Bidirectional scroll-coupled playback (0% to 100% and reverse)
 * - Direct mouse drag and touch swipe scrubbing on the canvas viewport
 * - Progressive frame preloader with visual loading bar
 * - Stage milestone quick-jump navigation
 * - Interactive bespoke ring configurator (silhouette, width, finish, size)
 * - Interactive ring anatomy inspection hotspots & synchronized spec cards
 * - Accessible FAQ accordion
 * - Slide-out atelier order drawer with form submission handling
 * - Accessible fallback for prefers-reduced-motion
 */

(function () {
  'use strict';

  // =========================================================================
  // CONFIGURATION & ATELIER STAGES
  // =========================================================================
  const CONFIG = {
    totalFrames: 168,
    framePathPrefix: 'assets/frames/ezgif-frame-',
    frameExtension: '.jpg',
    nativeWidth: 1920,
    nativeHeight: 1080,
    stages: [
      {
        id: 1,
        code: '01 · HAND SCULPT',
        chapter: 'CHAPTER 01',
        title: 'Hand Sculpting',
        desc: "High-density blue jeweler's wax shaped with precision blade and file to your personal finger geometry.",
        startFrame: 1,
        endFrame: 54,
        keyFrame: 25
      },
      {
        id: 2,
        code: '02 · FOUNDRY CAST',
        chapter: 'CHAPTER 02',
        title: 'Lost-Wax Casting',
        desc: 'Molten sterling silver fills the investment flask, vaporizing and replacing the wax master.',
        startFrame: 55,
        endFrame: 100,
        keyFrame: 80
      },
      {
        id: 3,
        code: '03 · SURFACE POLISH',
        chapter: 'CHAPTER 03',
        title: 'Surface Polishing',
        desc: 'Raw casting skin refined with rotary burs and cotton wheels for a mirror finish.',
        startFrame: 101,
        endFrame: 146,
        keyFrame: 125
      },
      {
        id: 4,
        code: '04 · STERLING SILVER',
        chapter: 'CHAPTER 04',
        title: 'Solid Sterling Silver',
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
    isScrubbingTimeline: false,
    isDraggingCanvas: false,
    activeStageId: 1,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Customizer state
    customizer: {
      silhouette: 'Organic Wave',
      width: '6mm',
      finish: 'Mirror Polish',
      size: 9.0,
      baseWeight: 12.8
    }
  };

  // DOM Elements
  const DOM = {
    // Header & Navigation
    header: document.getElementById('site-header'),
    headerStagePill: document.getElementById('header-stage-pill'),
    navLinks: document.querySelectorAll('.site-nav .nav-link'),
    sections: document.querySelectorAll('main > section[id]'),

    // Hero Canvas & Track
    heroTrack: document.getElementById('hero-track'),
    canvasStage: document.getElementById('canvas-stage'),
    canvas: document.getElementById('hero-canvas'),
    dragHint: document.getElementById('drag-hint-badge'),
    loader: document.getElementById('canvas-loader'),
    loaderBar: document.getElementById('loader-bar'),
    heroOverlayTop: document.getElementById('hero-overlay-top'),

    // Floating Stage Card
    stageCard: document.getElementById('hero-stage-card'),
    stageCardNumber: document.getElementById('stage-card-number'),
    stageCardTitle: document.getElementById('stage-card-title'),
    stageCardDesc: document.getElementById('stage-card-desc'),

    // Interactive HUD
    stageTabs: document.querySelectorAll('.stage-tab'),
    timelineContainer: document.getElementById('timeline-container'),
    timelineProgress: document.getElementById('timeline-progress'),
    timelineThumb: document.getElementById('timeline-thumb'),
    timelineStatus: document.getElementById('timeline-status'),
    reducedMotionControl: document.getElementById('reduced-motion-control'),
    reducedMotionSlider: document.getElementById('reduced-motion-slider'),
    reducedMotionVal: document.getElementById('reduced-motion-val'),

    // Action Links & Buttons
    jumpButtons: document.querySelectorAll('.jump-to-stage-btn'),
    rewatchBtn: document.querySelector('.rewatch-btn'),

    // Ring Customizer
    configButtons: document.querySelectorAll('.config-btn'),
    sizeSlider: document.getElementById('size-slider'),
    sizeDisplay: document.getElementById('size-display'),
    summaryTitle: document.getElementById('summary-title'),
    summaryDesc: document.getElementById('summary-desc'),
    summaryWeight: document.getElementById('summary-weight'),

    // Ring Anatomy Hotspots
    hotspots: document.querySelectorAll('.ring-hotspot'),
    specCards: document.querySelectorAll('.spec-card'),

    // FAQ Accordion
    faqItems: document.querySelectorAll('.faq-item'),

    // Slide-out Order Drawer
    openDrawerBtns: document.querySelectorAll('#open-drawer-btn, .open-order-drawer'),
    drawerCloseBtn: document.getElementById('drawer-close-btn'),
    orderDrawer: document.getElementById('order-drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    orderForm: document.getElementById('order-form'),
    orderSuccess: document.getElementById('order-success'),
    closeSuccessBtn: document.getElementById('close-success-btn'),
    orderSizeSelect: document.getElementById('order-size'),
    orderFinishSelect: document.getElementById('order-finish')
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
  }

  function onAllFramesLoaded() {
    state.isReady = true;
    if (DOM.loader) {
      DOM.loader.classList.add('loaded');
      setTimeout(() => {
        DOM.loader.style.display = 'none';
      }, 600);
    }
    // Re-render current frame with authoritative source
    renderFrame(state.currentFrame);
  }

  // =========================================================================
  // 2. CANVAS SIZING & CONTAIN-SCALING RENDERING
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
   * Contain-scaling: guarantees zero distortion, zero stretching, zero clipping.
   */
  function renderFrame(frameIndex) {
    if (!ctx || !DOM.canvas) return;

    let img = state.images[frameIndex];
    if (!img || !img.complete) {
      // Find nearest loaded frame
      for (let offset = 1; offset < CONFIG.totalFrames; offset++) {
        const prev = state.images[frameIndex - offset];
        if (prev && prev.complete) { img = prev; break; }
        const next = state.images[frameIndex + offset];
        if (next && next.complete) { img = next; break; }
      }
    }

    if (!img || !img.complete) return;

    const cw = DOM.canvas.width;
    const ch = DOM.canvas.height;
    const imgW = img.naturalWidth || CONFIG.nativeWidth;
    const imgH = img.naturalHeight || CONFIG.nativeHeight;

    const canvasAspect = cw / ch;
    const imgAspect = imgW / imgH;

    let drawW, drawH;
    if (canvasAspect > imgAspect) {
      // Canvas wider than 16:9
      drawH = ch;
      drawW = drawH * imgAspect;
    } else {
      // Canvas taller than 16:9 (e.g. mobile portrait)
      drawW = cw;
      drawH = drawW / imgAspect;
    }

    const dx = Math.round((cw - drawW) / 2);
    const dy = Math.round((ch - drawH) / 2);

    // Clear background to neutral studio tone
    ctx.fillStyle = '#eae8e2';
    ctx.fillRect(0, 0, cw, ch);

    // Render frame
    ctx.drawImage(img, dx, dy, drawW, drawH);

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
    return Math.min(Math.max(scrolled / scrollRange, 0), 1);
  }

  function updateScroll() {
    const progress = getScrollProgress();
    state.scrollProgress = progress;

    // Map progress to frame index (1 to 168)
    const target = Math.min(
      CONFIG.totalFrames,
      Math.max(1, Math.round(progress * (CONFIG.totalFrames - 1)) + 1)
    );

    state.targetFrame = target;
  }

  // RAF Animation Loop
  function tick() {
    if (state.currentFrame !== state.targetFrame) {
      const diff = state.targetFrame - state.currentFrame;
      const step = Math.sign(diff) * Math.max(1, Math.min(Math.abs(diff), Math.ceil(Math.abs(diff) * 0.4)));
      state.currentFrame += step;

      renderFrame(state.currentFrame);
      updateHUD(state.currentFrame, state.scrollProgress);
    }

    requestAnimationFrame(tick);
  }

  // =========================================================================
  // 4. CUSTOMER-FACING HUD UPDATES (ZERO FRAME NUMBERS)
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
    const pct = Math.round(((frame - 1) / (CONFIG.totalFrames - 1)) * 100);

    // 1. Customer-Facing Transformation Status
    if (DOM.timelineStatus) {
      DOM.timelineStatus.textContent = `Transformation: ${pct}% Complete`;
    }

    // 2. Timeline Progress Bar
    if (DOM.timelineProgress) {
      DOM.timelineProgress.style.width = `${pct}%`;
    }
    if (DOM.timelineThumb) {
      DOM.timelineThumb.style.left = `${pct}%`;
    }

    // 3. Stage Information Card & Header Pill
    const stage = getStageForFrame(frame);
    if (stage.id !== state.activeStageId) {
      state.activeStageId = stage.id;

      if (DOM.headerStagePill) {
        const textSpan = DOM.headerStagePill.querySelector('.stage-text');
        if (textSpan) textSpan.textContent = stage.code;
      }

      if (DOM.stageCardNumber) DOM.stageCardNumber.textContent = stage.chapter;
      if (DOM.stageCardTitle) DOM.stageCardTitle.textContent = stage.title;
      if (DOM.stageCardDesc) DOM.stageCardDesc.textContent = stage.desc;

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

    // 4. Hero Overlay Editorial Fade
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

    // 5. Sync Accessible Slider
    if (DOM.reducedMotionSlider) {
      DOM.reducedMotionSlider.value = pct;
    }
    if (DOM.reducedMotionVal) {
      DOM.reducedMotionVal.textContent = `${pct}% Processed`;
    }
  }

  // =========================================================================
  // 5. DIRECT CANVAS DRAG & TOUCH SWIPE SCRUBBING
  // =========================================================================
  function setupCanvasDirectDrag() {
    if (!DOM.canvasStage || !DOM.heroTrack) return;

    let isPointerDown = false;
    let startX = 0;
    let startScrollY = 0;
    let dragDistance = 0;

    DOM.canvasStage.style.cursor = 'grab';

    function onPointerDown(e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return; // Left button only for mouse
      isPointerDown = true;
      startX = e.clientX;
      startScrollY = window.scrollY;
      dragDistance = 0;

      DOM.canvasStage.style.cursor = 'grabbing';
      if (DOM.canvasStage.setPointerCapture) {
        try {
          DOM.canvasStage.setPointerCapture(e.pointerId);
        } catch (err) {
          // Fallback if pointer capture is not supported
        }
      }

      // Hide drag hint badge permanently after first direct drag
      if (DOM.dragHint) {
        DOM.dragHint.style.opacity = '0';
        DOM.dragHint.style.transition = 'opacity 0.4s ease';
      }
    }

    function onPointerMove(e) {
      if (!isPointerDown) return;

      const deltaX = e.clientX - startX;
      dragDistance += Math.abs(deltaX);

      // Sensitivity: scrubbing 400px horizontally navigates ~40% of the sequence
      const scrollRange = DOM.heroTrack.offsetHeight - window.innerHeight;
      const trackTop = DOM.heroTrack.offsetTop;
      const sensitivity = (scrollRange / 700);

      // Dragging right advances, dragging left rewinds
      const targetScrollY = Math.max(
        trackTop,
        Math.min(trackTop + scrollRange, startScrollY + deltaX * sensitivity)
      );

      window.scrollTo(0, targetScrollY);
    }

    function onPointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      DOM.canvasStage.style.cursor = 'grab';

      if (DOM.canvasStage.releasePointerCapture) {
        try {
          DOM.canvasStage.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Ignore
        }
      }
    }

    DOM.canvasStage.addEventListener('pointerdown', onPointerDown);
    DOM.canvasStage.addEventListener('pointermove', onPointerMove);
    DOM.canvasStage.addEventListener('pointerup', onPointerUp);
    DOM.canvasStage.addEventListener('pointercancel', onPointerUp);
  }

  // =========================================================================
  // 6. TIMELINE SCRUBBING & STAGE NAVIGATION
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

    DOM.timelineContainer.addEventListener('mousedown', (e) => {
      state.isScrubbingTimeline = true;
      handleTimelineScrub(e);

      const onMouseMove = (moveEvent) => {
        if (!state.isScrubbingTimeline) return;
        handleTimelineScrub(moveEvent);
      };

      const onMouseUp = () => {
        state.isScrubbingTimeline = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

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

    // Jump to Stage buttons in Process Cards
    DOM.jumpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const stageNum = parseInt(btn.getAttribute('data-target-stage'), 10);
        const frameNum = parseInt(btn.getAttribute('data-target-frame'), 10);

        if (!isNaN(stageNum)) {
          const stage = CONFIG.stages.find(s => s.id === stageNum);
          if (stage) scrollToFrame(stage.keyFrame);
        } else if (!isNaN(frameNum)) {
          scrollToFrame(frameNum);
        }
      });
    });

    // Rewatch Transformation Button
    if (DOM.rewatchBtn) {
      DOM.rewatchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToFrame(1);
      });
    }
  }

  // =========================================================================
  // 7. BESPOKE RING CONFIGURATOR / CUSTOMIZER
  // =========================================================================
  function setupCustomizer() {
    // Configurator Buttons (Silhouette, Width, Finish)
    DOM.configButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const param = btn.getAttribute('data-param');
        const value = btn.getAttribute('data-value');

        // Deactivate siblings in this group
        const parentGroup = btn.closest('.config-options');
        if (parentGroup) {
          parentGroup.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
        }
        btn.classList.add('active');

        if (param === 'silhouette') state.customizer.silhouette = value;
        if (param === 'width') {
          state.customizer.width = value;
          const weightStr = btn.getAttribute('data-weight');
          if (weightStr) {
            state.customizer.baseWeight = parseFloat(weightStr);
          }
        }
        if (param === 'finish') state.customizer.finish = value;

        updateCustomizerPreview();
      });
    });

    // Size Slider
    if (DOM.sizeSlider) {
      DOM.sizeSlider.addEventListener('input', (e) => {
        const sizeVal = parseFloat(e.target.value);
        state.customizer.size = sizeVal;
        updateCustomizerPreview();
      });
    }

    updateCustomizerPreview();
  }

  function updateCustomizerPreview() {
    const { silhouette, width, finish, size, baseWeight } = state.customizer;

    // Calculate approximate inner diameter
    const diameter = (11.63 + size * 0.82).toFixed(1);

    if (DOM.sizeDisplay) {
      DOM.sizeDisplay.textContent = `US Size ${size.toFixed(1)} (${diameter}mm diameter)`;
    }

    // Dynamic weight calculation based on width base weight and ring diameter scaling
    const scaledWeight = (baseWeight * (size / 9.0)).toFixed(1);

    if (DOM.summaryTitle) {
      DOM.summaryTitle.textContent = `Bespoke ${width} ${silhouette} Ring`;
    }

    if (DOM.summaryDesc) {
      DOM.summaryDesc.textContent = `Sculpted by your hand in blue carving wax, lost-wax cast in solid sterling silver with ${finish.toLowerCase()} finish.`;
    }

    if (DOM.summaryWeight) {
      DOM.summaryWeight.textContent = `~${scaledWeight} grams`;
    }

    // Sync default selections into order drawer if not yet touched by user
    if (DOM.orderSizeSelect) {
      const nearestSize = `US ${Math.round(size)}`;
      for (const opt of DOM.orderSizeSelect.options) {
        if (opt.value.startsWith(nearestSize)) {
          DOM.orderSizeSelect.value = opt.value;
          break;
        }
      }
    }

    if (DOM.orderFinishSelect) {
      for (const opt of DOM.orderFinishSelect.options) {
        if (opt.value.toLowerCase().includes(finish.toLowerCase()) || finish.toLowerCase().includes(opt.value.toLowerCase())) {
          DOM.orderFinishSelect.value = opt.value;
          break;
        }
      }
    }
  }

  // =========================================================================
  // 8. RING ANATOMY INTERACTIVE HOTSPOTS
  // =========================================================================
  function setupRingHotspots() {
    function activatePin(pinId) {
      // Activate hotspot
      DOM.hotspots.forEach(pin => {
        if (pin.getAttribute('data-pin') === String(pinId)) {
          pin.classList.add('active');
        } else {
          pin.classList.remove('active');
        }
      });

      // Activate spec card
      DOM.specCards.forEach(card => {
        if (card.getAttribute('data-spec-card') === String(pinId)) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }

    DOM.hotspots.forEach(pin => {
      const pinId = pin.getAttribute('data-pin');
      pin.addEventListener('click', () => activatePin(pinId));
      pin.addEventListener('mouseenter', () => activatePin(pinId));
      pin.addEventListener('focus', () => activatePin(pinId));
    });

    DOM.specCards.forEach(card => {
      const cardId = card.getAttribute('data-spec-card');
      card.addEventListener('click', () => activatePin(cardId));
      card.addEventListener('mouseenter', () => activatePin(cardId));
    });
  }

  // =========================================================================
  // 9. FAQ ACCORDION
  // =========================================================================
  function setupFAQAccordion() {
    DOM.faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other items
        DOM.faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // =========================================================================
  // 10. SLIDE-OUT ATELIER ORDER DRAWER
  // =========================================================================
  function setupOrderDrawer() {
    function openDrawer() {
      if (DOM.orderDrawer && DOM.drawerBackdrop) {
        DOM.orderDrawer.classList.add('active');
        DOM.orderDrawer.setAttribute('aria-hidden', 'false');
        DOM.drawerBackdrop.classList.add('active');
        DOM.drawerBackdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('drawer-open');

        // Focus first field
        const nameInput = document.getElementById('order-name');
        if (nameInput) setTimeout(() => nameInput.focus(), 250);
      }
    }

    function closeDrawer() {
      if (DOM.orderDrawer && DOM.drawerBackdrop) {
        DOM.orderDrawer.classList.remove('active');
        DOM.orderDrawer.setAttribute('aria-hidden', 'true');
        DOM.drawerBackdrop.classList.remove('active');
        DOM.drawerBackdrop.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('drawer-open');
      }
    }

    DOM.openDrawerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });

    if (DOM.drawerCloseBtn) {
      DOM.drawerCloseBtn.addEventListener('click', closeDrawer);
    }

    if (DOM.drawerBackdrop) {
      DOM.drawerBackdrop.addEventListener('click', closeDrawer);
    }

    // Escape key closes drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.orderDrawer && DOM.orderDrawer.classList.contains('active')) {
        closeDrawer();
      }
    });

    // Form Submission Handling
    if (DOM.orderForm && DOM.orderSuccess) {
      DOM.orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        DOM.orderForm.style.display = 'none';
        DOM.orderSuccess.style.display = 'flex';
      });
    }

    if (DOM.closeSuccessBtn) {
      DOM.closeSuccessBtn.addEventListener('click', () => {
        closeDrawer();
        setTimeout(() => {
          if (DOM.orderForm && DOM.orderSuccess) {
            DOM.orderForm.reset();
            DOM.orderForm.style.display = 'flex';
            DOM.orderSuccess.style.display = 'none';
          }
        }, 400);
      });
    }
  }

  // =========================================================================
  // 11. NAVIGATION SCROLL SPY & HEADER SCROLL STATE
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

  function updateNavSpy() {
    const scrollPosition = window.scrollY + 120;

    DOM.sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height) {
        DOM.navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  // =========================================================================
  // 12. ACCESSIBILITY & PREFERS-REDUCED-MOTION
  // =========================================================================
  function setupReducedMotion() {
    if (!state.reducedMotion) return;

    if (DOM.reducedMotionControl && DOM.reducedMotionSlider) {
      DOM.reducedMotionControl.style.display = 'flex';

      DOM.reducedMotionSlider.addEventListener('input', (e) => {
        const pct = parseInt(e.target.value, 10);
        const targetFrame = Math.min(
          CONFIG.totalFrames,
          Math.max(1, Math.round((pct / 100) * (CONFIG.totalFrames - 1)) + 1)
        );

        state.currentFrame = targetFrame;
        state.targetFrame = targetFrame;
        renderFrame(targetFrame);
        updateHUD(targetFrame, pct / 100);

        // Synchronize scroll position smoothly
        if (DOM.heroTrack) {
          const scrollRange = DOM.heroTrack.offsetHeight - window.innerHeight;
          const trackTop = DOM.heroTrack.offsetTop;
          window.scrollTo(0, trackTop + (pct / 100) * scrollRange);
        }
      });
    }
  }

  // =========================================================================
  // 13. INITIALIZATION
  // =========================================================================
  function init() {
    initPreloader();
    setupCanvasDirectDrag();
    setupTimelineEvents();
    setupStageNavigation();
    setupCustomizer();
    setupRingHotspots();
    setupFAQAccordion();
    setupOrderDrawer();
    setupReducedMotion();

    // Debounced Resize listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 80);
    }, { passive: true });

    // Passive Scroll listener
    window.addEventListener('scroll', () => {
      updateScroll();
      updateHeaderOnScroll();
      updateNavSpy();
    }, { passive: true });

    // Initial pass
    updateScroll();
    updateHeaderOnScroll();
    updateNavSpy();

    // Start RAF loop
    requestAnimationFrame(tick);

    // Global testing API
    window.__BISHU__ = {
      state,
      CONFIG,
      scrollToFrame,
      renderFrame,
      updateCustomizerPreview
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
