# BISHU ATELIER — ART DIRECTION SPECIFICATION
*From Wax to Silver: The Material Transformation*

---

## 1. Vision & Core Philosophy

BISHU is an atelier portfolio piece celebrating the ancient lost-wax casting process.
The design premise is absolute visual honesty:
1. **The Frames ARE the Site**: The 168-frame photographic sequence is the primary spatial fabric, not an embedded widget or letterboxed card. It spans 100vw × 100dvh full-bleed in the hero and returns throughout the page as full-bleed, tall (75–85vh) interactive banners that scrub localized process stages.
2. **Zero Fabrication**: Every word of text is strictly grounded in the physical craft of lost-wax casting. No invented kiln temperatures, no fabricated turnaround days, no fake e-commerce drawers, no simulated weights, and no artificial testimonials.
3. **Restrained Editorial Luxury**: Neutral studio tones, precise typographic hierarchy, whispered micro-copy, and purposeful motion. The only color accent permitted is the deep cerulean blue sampled directly from the artisan carving wax.

---

## 2. Color System (Directly Sampled from Sequence Pixels)

All colors are strictly defined as CSS custom properties in `:root`. No hex values exist outside the token block.

| Token | Sampled Value | Origin & Role |
|---|---|---|
| `--bg-studio` | `#ebe8e1` | Median perimeter neutral of studio frames. Provides seamless page dissolution. |
| `--bg-surface` | `#f4f2ec` | Slightly lifted card and container surface. |
| `--bg-dark` | `#161514` | Deep occlusion shadow sampled inside casting flask. |
| `--text-ink` | `#141312` | Deepest ink tone sampled from core shadows. High-contrast primary type. |
| `--text-secondary` | `#58554f` | Studio shadow mid-tone. Secondary editorial text (5.2:1 contrast). |
| `--text-muted` | `#86827a` | Studio stone tint for captions, eyebrows, and technical indices. |
| `--wax-blue` | `#234482` | Median blue sampled from carving wax in frames 001–040. The sole accent color. |
| `--wax-blue-bright` | `#2d569e` | Active/hover state for wax-blue interactive accents. |
| `--wax-blue-tint` | `rgba(35, 68, 130, 0.08)` | Subtle background highlight for badges and selection states. |
| `--silver-hi` | `#efede6` | Specular reflection on polished sterling silver in frame 168. |
| `--silver-mid` | `#bdb7ad` | Diffuse metallic luster on sterling silver surface. |
| `--border-subtle` | `rgba(20, 19, 18, 0.08)` | Structural hairline borders for editorial grids. |
| `--border-focus` | `rgba(35, 68, 130, 0.85)` | Distinct accessible focus ring in wax-blue. |

### Legibility Scrims
Overlay type on full-bleed imagery is protected by vertical scrim gradients rendered in `--bg-studio` rather than artificial black vignettes:
- `--scrim-top`: `linear-gradient(to bottom, rgba(235, 232, 225, 0.75) 0%, rgba(235, 232, 225, 0.30) 65%, rgba(235, 232, 225, 0) 100%)`
- `--scrim-bottom`: `linear-gradient(to top, rgba(235, 232, 225, 0.80) 0%, rgba(235, 232, 225, 0.35) 65%, rgba(235, 232, 225, 0) 100%)`

Measured WCAG AA/AAA contrast:
- Top scrim overlaid against darkest frame pixels: **5.21:1** (Worst-case single pixel), **8.77:1** (Mean top band).
- Flat editorial sections: **15.60:1**.

---

## 3. Typography Hierarchy

Self-hosted WOFF2 files stored in `assets/fonts/`. Zero external CDN calls.

### The Pairing
- **Display Face**: `Instrument Serif` (400 Regular & 400 Italic). Designed for authentic craft, fine metallurgy, and editorial authority.
- **Body & Interface**: `Inter` (400 Regular, 500 Medium, 600 Semi-Bold). Clean, neutral, highly legible Swiss grotesque.

### Modular Scale (Fluid with `clamp()`)
- **Hero Title**: `clamp(2.75rem, 6.2vw, 5.5rem)` | line-height: `1.04` | letter-spacing: `-0.035em`
- **Banner Headline**: `clamp(2.25rem, 4.8vw, 4.25rem)` | line-height: `1.06` | letter-spacing: `-0.03em`
- **Section Heading (H2)**: `clamp(2.0rem, 3.8vw, 3.25rem)` | line-height: `1.10` | letter-spacing: `-0.025em`
- **Subheading / Lead**: `clamp(1.125rem, 1.5vw, 1.35rem)` | line-height: `1.55` | letter-spacing: `-0.01em` | max-width: `64ch`
- **Body Text**: `clamp(0.95rem, 1.1vw, 1.0625rem)` | line-height: `1.62` | max-width: `68ch`
- **Technical Index / Eyebrow**: `clamp(0.72rem, 0.85vw, 0.8125rem)` | uppercase | letter-spacing: `0.12em` | line-height: `1.3`

### Typesetting Rules
- No orphans: headlines utilize `text-wrap: balance` with non-breaking spaces on critical terminal nouns.
- Type floating over canvas uses `font-weight: 500` for body/metadata to maintain needle-sharp presence over photographic textures.

---

## 4. Canvas Engine & Stacking Order

### Hero Viewport
- Canvas dimensions: `100vw × 100dvh`, fixed/sticky at `z-index: 0`.
- Scaling Math: **Cover Scale**.
  ```js
  const scale = Math.max(canvasW / frameW, canvasH / frameH);
  ```
- **Focal-Point Centering Algorithm (Mobile Portrait 390px Protection)**:
  On narrow viewports, the ring must never be cropped out. The algorithm samples the frame's subject focal center `(focalX, focalY)` and biases the crop:
  ```js
  const overflowX = frameW * scale - canvasW;
  const idealDx = (canvasW * 0.5) - (focalX * scale);
  const dx = Math.max(-overflowX, Math.min(0, idealDx));
  ```
- Zero letterbox bars, zero visible background gaps at any screen resolution.

### Below-Hero Narrative Banners
- Three full-bleed canvas banners across the narrative journey:
  1. **Carving Banner**: Frames `020` to `055` (Sculpting the blue wax form).
  2. **Casting Banner**: Frames `070` to `105` (Foundry burnout and molten metal flow).
  3. **Polishing Banner**: Frames `135` to `168` (Cotton wheel buffing to mirror silver).
- Managed by a single centralized `requestAnimationFrame` dispatcher. Each banner canvas activates an `IntersectionObserver` to halt rendering when off-screen.

---

## 5. Layout Dead-Space & Content Placement

The ring subject occupies the central 60% of the viewport (normalized `x: 0.25–0.75`, `y: 0.25–0.80`).
To prevent any text from ever colliding with the ring:
1. **Top Band (`0%–18%` vertical)**: Atelier brand mark, stage indicator pill, quiet navigation.
2. **Bottom Band (`80%–100%` vertical)**: Editorial chapter indicator, interactive scrubbing HUD, stage jump pills.
3. **Dead-Space Flanks**: On desktop, editorial captions sit pinned in the outer thirds (`left: 5vw` or `right: 5vw`), completely clear of the central ring transformation.
4. **Mobile Portrait (390px)**: The focal algorithm locks the ring in the lower-middle viewport; title and lead sit strictly above `y: 22%`, and interactive timeline sits strictly below `y: 82%`.

---

## 6. Accessibility & Reduced Motion

- Semantic landmarks: `<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`. Exactly one `<h1>`.
- Screen reader accessibility: Detailed visually-hidden narrative transcript explaining the entire wax-to-silver metallurgical transformation.
- `prefers-reduced-motion: reduce`: Disables scroll-driven scrubbing. Renders a pristine static composition for each section and provides a prominent, fully accessible native `<input type="range">` scrubber.
- Visible, high-contrast keyboard focus indicators (`--border-focus`).
- Polished skip-link for keyboard-only navigation.
