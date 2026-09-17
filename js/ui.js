/**
 * BISHU Atelier — UI Module
 * Controls the preloader choreographed transition, editorial stage card and header pill updates,
 * and FAQ accordion interaction.
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

    // Header & Stage Elements
    this.headerStagePill = document.getElementById('header-stage-pill');
    this.stageText = this.headerStagePill ? this.headerStagePill.querySelector('.stage-text') : null;
    this.stageCardNumber = document.getElementById('stage-card-number');
    this.stageCardTitle = document.getElementById('stage-card-title');
    this.stageCardDesc = document.getElementById('stage-card-desc');
    this.currentStage = 1;

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
  }

  init() {
    this.initPreloader();
    this.initFAQ();
    this.initJumpButtons();
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

  updateStage(stageIndex) {
    if (this.currentStage === stageIndex) return;
    this.currentStage = stageIndex;
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
  }

  initJumpButtons() {
    document.querySelectorAll('.jump-to-stage-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stage = parseInt(btn.dataset.targetStage, 10);
        this.scrollController.scrollToStage(stage);
      });
    });
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
}
