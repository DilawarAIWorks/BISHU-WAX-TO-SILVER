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

  // 3. Initialize UI & Scroll Controllers
  let uiController;
  let scrollController;

  // Register Hero Canvas with auto-loading continuous loop
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    renderer.registerCanvas({
      id: 'hero',
      element: heroCanvas,
      frameRange: [1, TOTAL_FRAMES],
      autoplay: true,
      loop: true,
      fps: 28,
      lerp: false,
      onFrame: (frameIndex) => {
        let stage = 1;
        if (frameIndex >= 149) stage = 4;
        else if (frameIndex >= 111) stage = 3;
        else if (frameIndex >= 51) stage = 2;

        if (uiController) {
          uiController.updateStage(stage);
        }
      }
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

  scrollController = new ScrollController({
    renderer,
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
      get currentStage() {
        return (uiController && uiController.currentStage) ? uiController.currentStage : 1;
      },
      get isLooping() { return true; }
    },
    frameLoader,
    renderer,
    scrollController,
    uiController
  };

  // 6. Begin Sequence Preloading
  frameLoader.init();
});
