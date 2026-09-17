/**
 * BISHU Atelier — Frame Loader Module
 * Handles immediate frame 001 decoding, parallel sequence preloading with concurrency cap,
 * and determinate progress reporting.
 */

export class FrameLoader {
  constructor(totalFrames = 168) {
    this.totalFrames = totalFrames;
    this.frames = new Array(totalFrames + 1);
    this.loadedCount = 0;
    this.onProgress = null;
    this.onFirstFrame = null;
    this.onComplete = null;
    this.concurrencyCap = 10;
  }

  getFramePath(index) {
    const pad = String(index).padStart(3, '0');
    return `assets/frames/ezgif-frame-${pad}.jpg`;
  }

  async loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      if ('fetchPriority' in img) {
        img.fetchPriority = index <= 30 ? 'high' : 'auto';
      }

      const finish = () => {
        this.frames[index] = img;
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount / this.totalFrames, this.loadedCount, this.totalFrames);
        }
        resolve(img);
      };

      img.onload = async () => {
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {
            // decode failure or aborted — proceed with loaded image
          }
        }
        finish();
      };

      img.onerror = () => {
        // In case of error, resolve null gracefully
        resolve(null);
      };

      img.src = this.getFramePath(index);
    });
  }

  async init() {
    // Step 1: Immediately fetch and decode frame 001 to eliminate white flash
    const firstImg = await this.loadFrame(1);
    if (this.onFirstFrame && firstImg) {
      this.onFirstFrame(firstImg);
    }

    // Step 2: Queue the rest with concurrency cap (8-12 parallel, default 10)
    let nextIndex = 2;
    const workers = [];

    const worker = async () => {
      while (nextIndex <= this.totalFrames) {
        const currentIndex = nextIndex++;
        await this.loadFrame(currentIndex);
      }
    };

    const count = Math.min(this.concurrencyCap, this.totalFrames - 1);
    for (let i = 0; i < count; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (this.onComplete) {
      this.onComplete();
    }
  }

  getFrame(index) {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(index)));
    // If target frame is not yet loaded, find nearest loaded frame
    if (this.frames[clamped]) return this.frames[clamped];
    for (let d = 1; d < this.totalFrames; d++) {
      if (clamped - d >= 1 && this.frames[clamped - d]) return this.frames[clamped - d];
      if (clamped + d <= this.totalFrames && this.frames[clamped + d]) return this.frames[clamped + d];
    }
    return this.frames[1] || null;
  }

  isLoaded(index) {
    return !!this.frames[index];
  }
}
