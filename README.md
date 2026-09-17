# BISHU — Wax to Silver
### Production-Grade Interactive Atelier Experience

A commercial, editorial, interactive product experience for **BISHU: Wax to Silver**, engineered exclusively with **HTML5, CSS3, and Pure Vanilla JavaScript** (zero external dependencies, zero frameworks, zero animation libraries).

---

## Concept & Visual Narrative

BISHU bridges tactile hand sculpting with traditional foundry casting:

$$\text{BLUE WAX BLANK} \longrightarrow \text{HAND SCULPTING} \longrightarrow \text{LOST-WAX CASTING} \longrightarrow \text{SURFACE POLISHING} \longrightarrow \text{SOLID STERLING SILVER}$$

1. **Chapter 01 · Hand Sculpting**: Shaping and carving high-density blue jeweler's wax using fine blades and files to match personal finger geometry.
2. **Chapter 02 · Lost-Wax Casting**: Molten 925 sterling silver is poured into the investment flask mold, replacing the wax master in micron-level detail.
3. **Chapter 03 · Surface Polishing**: Rotary bench tools smooth internal comfort fit before a cotton buffing wheel imparts high-mirror reflectivity.
4. **Chapter 04 · Solid Sterling Silver**: The completed heirloom band in solid 925 sterling silver, captured forever in precious metal.

---

## Key Interactive Features

- **Direct Canvas Drag & Touch Scrubbing**: Click and drag horizontally or touch-swipe across the canvas viewport to smoothly scrub backwards and forwards through the transformation with 1:1 tactile responsiveness.
- **Scroll-Coupled Playback**: Bidirectional scrub mapping (0% to 100% and 100% to 0%) coupled to the 420vh hero track powered by `requestAnimationFrame`.
- **Customer-Facing Milestone HUD**: Clean, luxury customer journey indicators (`Transformation: 0% → 100% Complete`, chapter indicators) with zero raw developer artifacts or frame numbers.
- **Bespoke Ring Configurator**:
  - Interactive selection of band silhouettes (*Organic Wave*, *Faceted Chisel*, *Soft Dome*).
  - Band width selection (*4mm*, *6mm*, *8mm*).
  - Surface treatment toggles (*High Mirror*, *Foundry Matte*, *Chiseled Raw*).
  - Continuous ring size slider (*US 5.0 to 13.0*) with live millimeter diameter calculation.
  - Live metallurgical weight estimation scaling with width and ring geometry.
- **Interactive Ring Anatomy Hotspots**: Four interactive inspection pins highlighting the crest silhouette, mirror polish, radiused comfort-fit core, and solid 925 purity hallmark, synchronized with descriptive annotation cards.
- **Atelier FAQ Accordion**: Expandable/collapsible drawer answering key customer questions regarding at-home wax carving and lost-wax foundry casting.
- **Slide-Out Atelier Order Drawer**:
  - Modal side drawer with background blur and scroll-lock.
  - Automatically pre-populates ring size and finish based on choices made in the bespoke configurator.
  - Handles complete reservation submission with order confirmation feedback.
- **Contain-Scaling Canvas Guarantee**: Sub-pixel aspect ratio containment (`16:9`) preserving visual fidelity with zero stretching, distortion, or clipping across all viewports.
- **Full Responsive Viewport Adaptation**: Optimized layouts for Ultra-wide Desktop (`1920x1080`), Laptop (`1440x900`), Tablet (`768x1024`), and Mobile Portrait (`390x844`).

---

## Technical Architecture

```
.
├── index.html                  # Semantic markup, ARIA roles & luxury atelier structure
├── css/
│   └── style.css               # Design system, layout grid, hotspots, drawer & responsive tokens
├── js/
│   └── script.js               # Canvas renderer, drag engine, customizer logic & drawer state
├── assets/
│   └── frames/                 # 168 extracted high-definition frames (ezgif-frame-001.jpg to 168.jpg)
├── verify-site.js              # Self-contained automated test suite (in-process HTTP + CDP)
└── README.md                   # Project documentation and specifications
```

---

## Running Locally

Because this is a pure static website with no compilation or build steps, it can be run directly:

### Option 1: Python Built-in Server
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js
```bash
npx serve .
```

### Option 3: Direct File Opening
Open `index.html` directly in modern Chrome, Edge, Safari, or Firefox.

---

## Automated Verification Suite

Run the built-in end-to-end verification script:
```bash
node verify-site.js
```

The script automatically:
1. Spawns an in-process Node HTTP static server.
2. Launches headless Microsoft Edge via Chrome DevTools Protocol (CDP).
3. Preloads all 168 frames.
4. Asserts zero developer frame numbers or prototype artifacts.
5. Verifies forward and reverse scroll stages (0%, 50%, 100%).
6. Simulates canvas direct horizontal pointer dragging.
7. Validates quick milestone tab jumps.
8. Exercises the bespoke configurator (silhouette, width, finish, size, and weight calculation).
9. Tests ring anatomy hotspots and spec card synchronization.
10. Validates FAQ accordion expansion/collapse.
11. Tests order drawer opening, configurator synchronization, and form submission.
12. Tests mobile portrait layout (`390x844`).
13. Asserts 0 console errors and 0 uncaught exceptions.
