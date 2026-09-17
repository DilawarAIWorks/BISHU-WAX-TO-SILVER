/**
 * BISHU Atelier — Canvas Renderer Module
 * Centralized multi-canvas renderer with single requestAnimationFrame loop,
 * cover-scaling focal-point math, DPR capping, and IntersectionObserver visibility culling.
 */

import { FOCAL_POINTS } from './focal-data.js';

export class CanvasRenderer {
  constructor(frameLoader) {
    this.frameLoader = frameLoader;
    this.canvases = new Map();
    this.rafId = null;
    this.isRunning = false;
    this.observer = null;
    this.nativeWidth = 1920;
    this.nativeHeight = 1080;
    this.lerpFactor = 0.12;

    this.initObserver();
    this.initVisibilityListener();
  }

  initObserver() {
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const item = this.canvases.get(entry.target);
        if (item) {
          item.isVisible = entry.isIntersecting;
          if (item.isVisible) {
            item.needsRedraw = true;
            this.startLoop();
          }
        }
      }
    }, {
      rootMargin: '100px 0px 100px 0px',
      threshold: 0
    });
  }

  initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopLoop();
      } else {
        // Mark visible canvases for redraw and restart
        for (const item of this.canvases.values()) {
          if (item.isVisible) item.needsRedraw = true;
        }
        this.startLoop();
      }
    });
  }

  registerCanvas({ id, element, frameRange, lerp = true }) {
    if (!element) return;

    const ctx = element.getContext('2d', { alpha: false, desynchronized: true });
    const item = {
      id,
      canvas: element,
      ctx,
      frameRange, // [start, end]
      lerp,
      targetProgress: 0,
      currentProgress: 0,
      lastDrawnFrame: -1,
      isVisible: true,
      needsRedraw: true,
      width: 0,
      height: 0,
      dpr: 1
    };

    this.canvases.set(element, item);
    this.updateCanvasDimensions(item);
    if (this.observer) {
      this.observer.observe(element);
    }

    return item;
  }

  updateCanvasDimensions(item) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = item.canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (w > 0 && h > 0 && (item.width !== w || item.height !== h || item.dpr !== dpr)) {
      item.width = w;
      item.height = h;
      item.dpr = dpr;
      item.canvas.width = Math.round(w * dpr);
      item.canvas.height = Math.round(h * dpr);
      item.needsRedraw = true;
    }
  }

  handleResize() {
    for (const item of this.canvases.values()) {
      this.updateCanvasDimensions(item);
    }
    this.startLoop();
  }

  setProgress(element, progress) {
    const item = this.canvases.get(element);
    if (!item) return;

    const clamped = Math.max(0, Math.min(1, progress));
    if (item.targetProgress !== clamped) {
      item.targetProgress = clamped;
      if (!item.lerp) {
        item.currentProgress = clamped;
      }
      this.startLoop();
    }
  }

  resolveFrameIndex(item) {
    const [start, end] = item.frameRange;
    const p = item.currentProgress;
    return Math.round(start + (end - start) * p);
  }

  drawFrame(item, frameIndex) {
    const img = this.frameLoader.getFrame(frameIndex);
    if (!img || !item.ctx) return;

    const { width: canvasW, height: canvasH, dpr, ctx } = item;
    if (canvasW <= 0 || canvasH <= 0) return;

    const frameW = this.nativeWidth;
    const frameH = this.nativeHeight;

    // Cover scale calculation
    const scale = Math.max(canvasW / frameW, canvasH / frameH);
    const scaledW = frameW * scale;
    const scaledH = frameH * scale;

    const overflowX = scaledW - canvasW;
    const overflowY = scaledH - canvasH;

    // Focal-point calculation
    const focal = FOCAL_POINTS[frameIndex - 1] || [960, 540];
    const focalX = focal[0];
    const focalY = focal[1];

    // Center on focal point while clamping to keep zero gaps
    const idealDx = (canvasW * 0.5) - (focalX * scale);
    const idealDy = (canvasH * 0.5) - (focalY * scale);

    const dx = Math.max(-overflowX, Math.min(0, idealDx));
    const dy = Math.max(-overflowY, Math.min(0, idealDy));

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, scaledW, scaledH);
    ctx.restore();

    item.lastDrawnFrame = frameIndex;
    item.needsRedraw = false;
  }

  startLoop() {
    if (this.isRunning || document.hidden) return;
    this.isRunning = true;
    this.rafId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  renderLoop() {
    let stillAnimating = false;

    for (const item of this.canvases.values()) {
      if (!item.isVisible) continue;

      if (item.lerp) {
        const diff = item.targetProgress - item.currentProgress;
        if (Math.abs(diff) > 0.0004) {
          item.currentProgress += diff * this.lerpFactor;
          stillAnimating = true;
        } else {
          item.currentProgress = item.targetProgress;
        }
      } else {
        item.currentProgress = item.targetProgress;
      }

      const targetFrame = this.resolveFrameIndex(item);
      if (item.needsRedraw || targetFrame !== item.lastDrawnFrame) {
        this.drawFrame(item, targetFrame);
      }
    }

    if (stillAnimating) {
      this.rafId = requestAnimationFrame(this.renderLoop.bind(this));
    } else {
      this.isRunning = false;
      this.rafId = null;
    }
  }

  forceRedrawAll() {
    for (const item of this.canvases.values()) {
      if (item.isVisible) {
        item.needsRedraw = true;
        const frameIndex = this.resolveFrameIndex(item);
        this.drawFrame(item, frameIndex);
      }
    }
  }

  teardown() {
    this.stopLoop();
    if (this.observer) {
      this.observer.disconnect();
    }
    this.canvases.clear();
  }
}
