/**
 * BISHU Atelier — Main Orchestrator Module
 * Coordinates FrameLoader, CanvasRenderer, ScrollController, and UIController.
 */

import { FrameLoader } from './frame-loader.js';
import { CanvasRenderer } from './renderer.js';
import { ScrollController } from './scroll-controller.js';
import { UIController } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  const TOTAL_FRAMES = 168;

  // 1. Initialize Frame Loader
  const frameLoader = new FrameLoader(TOTAL_FRAMES);

  // 2. Initialize Canvas Renderer
  const renderer = new CanvasRenderer(frameLoader);

  // Register Hero Canvas
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    renderer.registerCanvas({
      id: 'hero',
      element: heroCanvas,
      frameRange: [1, TOTAL_FRAMES],
      lerp: true
    });
  }

  // Register Below-Hero Narrative Banner Canvases
  const bannerCarve = document.getElementById('banner-canvas-carve');
  if (bannerCarve) {
    renderer.registerCanvas({
      id: 'banner-carve',
      element: bannerCarve,
      frameRange: [20, 55],
      lerp: true
    });
  }

  const bannerCast = document.getElementById('banner-canvas-cast');
  if (bannerCast) {
    renderer.registerCanvas({
      id: 'banner-cast',
      element: bannerCast,
      frameRange: [70, 105],
      lerp: true
    });
  }

  const bannerPolish = document.getElementById('banner-canvas-polish');
  if (bannerPolish) {
    renderer.registerCanvas({
      id: 'banner-polish',
      element: bannerPolish,
      frameRange: [135, 168],
      lerp: true
    });
  }

  // 3. Initialize UI Controller
  let uiController;
  let scrollController;

  scrollController = new ScrollController({
    renderer,
    onHeroProgress: (progress) => {
      if (uiController) uiController.updateHUD(progress);
    },
    onStageChange: (stage) => {
      if (uiController) uiController.updateStage(stage);
    }
  });

  // Register Banners into Scroll Controller
  const secCarve = document.getElementById('banner-carve-section');
  if (secCarve && bannerCarve) scrollController.registerBanner(secCarve, bannerCarve, [20, 55]);

  const secCast = document.getElementById('banner-cast-section');
  if (secCast && bannerCast) scrollController.registerBanner(secCast, bannerCast, [70, 105]);

  const secPolish = document.getElementById('banner-polish-section');
  if (secPolish && bannerPolish) scrollController.registerBanner(secPolish, bannerPolish, [135, 168]);

  // 4. Initialize UI
  uiController = new UIController({ renderer, scrollController, frameLoader });
  uiController.init();
  scrollController.init();

  // 5. Expose State for Inspection & Automation
  window.__BISHU__ = {
    CONFIG: {
      totalFrames: TOTAL_FRAMES
    },
    state: {
      get loadedCount() { return frameLoader.loadedCount; },
      get currentFrame() {
        const item = renderer.canvases.get(heroCanvas);
        return item ? renderer.resolveFrameIndex(item) : 1;
      },
      get currentStage() { return scrollController.currentStageIndex; }
    },
    frameLoader,
    renderer,
    scrollController,
    uiController
  };

  // 6. Begin Sequence Preloading
  frameLoader.init();
});
