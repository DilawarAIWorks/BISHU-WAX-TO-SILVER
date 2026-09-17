# BISHU — Wax to Silver
### Premium Scroll-Controlled Product Experience

An editorial, scroll-driven interactive product showcase for **BISHU: Wax to Silver**, built exclusively with **HTML5, CSS3, and Pure Vanilla JavaScript** (zero external dependencies or frameworks).

---

## The Concept & Visual Narrative

The website brings to life the complete bespoke jewelry creation process:

$$\text{BLUE WAX} \longrightarrow \text{HAND CARVING} \longrightarrow \text{CASTING} \longrightarrow \text{RAW SILVER} \longrightarrow \text{POLISHING} \longrightarrow \text{STERLING SILVER RING}$$

1. **Stage 01 — Carve (`Frames 001–054`)**: Shaping and carving the high-density blue jeweler's wax ring blank using hand blades and files.
2. **Stage 02 — Cast (`Frames 055–100`)**: Lost-wax casting where molten 925 sterling silver is poured into the flask mold, replacing the wax master.
3. **Stage 03 — Finish (`Frames 101–146`)**: Mechanical rotary tool refinement and high-speed cotton buffing wheel polish.
4. **Stage 04 — Sterling Silver (`Frames 147–168`)**: The completed organic solid 925 sterling silver ring resting on the studio plinth.

---

## Technical Specifications & Architecture

- **Authoritative Visual Source**: 168 sequential high-definition JPEG frames (`ezgif-frame-001.jpg` to `ezgif-frame-168.jpg`).
- **Rendering Engine**: HTML5 Canvas with native `1920x1080` frame resolution, sub-pixel scaling, and high-DPI / `devicePixelRatio` support.
- **Aspect Ratio Guarantee**: `object-fit: contain` equivalent math ensuring zero stretching, zero distortion, and zero cropping on any device.
- **Scroll Mapping**: Bidirectional scrub mapping (0% to 100% and 100% to 0%) across a 420vh scroll track (~25px per frame) powered by `requestAnimationFrame`.
- **Intelligent Preloader**: Frame 1 paints instantly on load; remaining 167 frames preload in parallel with progressive loading feedback.
- **Redundant Redraw Elimination**: Canvas renders only when the calculated frame index changes or on viewport resize.
- **Accessibility & Reduced Motion**: Native semantic HTML, visible focus states, ARIA live region updates, and automatic `prefers-reduced-motion` integration with interactive manual scrub slider.

---

## Project Structure

```
.
├── index.html                  # Semantic markup & accessible document structure
├── css/
│   └── style.css               # Modern vanilla CSS design system & responsive layout
├── js/
│   └── script.js               # Canvas frame loader, scroll mapping & HUD controller
├── assets/
│   └── frames/                 # 168 extracted animation frames (ezgif-frame-001.jpg to 168.jpg)
├── verify-site.js              # Automated Chrome DevTools Protocol (CDP) test suite
└── README.md                   # Documentation and technical summary
```

---

## Running Locally

Because this is a pure static website with no compilation or build steps, it can be served with any static web server:

### Option 1: Python
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js / npx
```bash
npx serve .
```

### Option 3: VS Code Live Server
Right-click `index.html` and choose **"Open with Live Server"**.

---

## Verification & Testing

The website has been verified using headless Microsoft Edge automated via Chrome DevTools Protocol (`verify-site.js`):

- Verified forward frame playback across 0%, 25%, 50%, 75%, and 100% scroll milestones.
- Verified reverse playback from frame 168 back to frame 001.
- Verified smooth unpinning and release into the Process, Materials, The Ring, and CTA sections.
- Verified mobile portrait responsiveness (`390x844`).
- Confirmed zero browser console errors and zero uncaught exceptions.
