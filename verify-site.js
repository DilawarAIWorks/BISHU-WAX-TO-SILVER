/**
 * Automated Verification Script using Chrome DevTools Protocol via native Node WebSocket
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9222;
const TARGET_URL = "http://127.0.0.1:8088/index.html";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.errors = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.exceptionThrown') {
          this.errors.push(msg.params);
          console.error('Browser Exception:', msg.params.exceptionDetails);
        } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          this.errors.push(msg.params);
          console.error('Browser Console Error:', msg.params.args);
        }
      }
    };
  }

  waitOpen() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filename, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Starting headless Edge with remote debugging...');
  const tmpDir = path.join(process.env.TEMP, 'edge-test-profile-' + Date.now());
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1440,900',
    '--no-first-run',
    '--no-default-browser-check',
    TARGET_URL
  ], { stdio: 'ignore' });

  // Wait for remote debugging to be ready
  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      version = await fetchJson(`http://127.0.0.1:${PORT}/json`);
      if (version && version.length > 0) break;
    } catch (e) {
      await sleep(250);
    }
  }

  if (!version || version.length === 0) {
    edgeProc.kill();
    throw new Error('Failed to connect to Edge remote debugging port');
  }

  const targetPage = version.find(p => p.type === 'page') || version[0];
  console.log('Connected to target:', targetPage.title, targetPage.webSocketDebuggerUrl);

  const client = new CDPClient(targetPage.webSocketDebuggerUrl);
  await client.waitOpen();
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Waiting for frames to load...');
  // Wait until all frames or majority are loaded
  for (let i = 0; i < 30; i++) {
    const loaded = await client.eval('window.__BISHU__ ? window.__BISHU__.state.loadedCount : 0');
    const total = await client.eval('window.__BISHU__ ? window.__BISHU__.CONFIG.totalFrames : 168');
    console.log(`Loaded ${loaded} / ${total} frames...`);
    if (loaded >= total) break;
    await sleep(300);
  }

  // Check state
  const frame1 = await client.eval('document.getElementById("frame-counter")?.textContent');
  console.log('Initial Frame Counter:', frame1);
  await client.captureScreenshot('verify-01-start.png');

  // Test Scroll to 25% (Carve phase)
  console.log('Scrolling to 25% (Carving)...');
  const scrollInfo25 = await client.eval(`(() => {
    const track = document.getElementById('hero-track');
    const range = track.offsetHeight - window.innerHeight;
    const targetY = range * 0.25;
    window.scrollTo(0, targetY);
    window.dispatchEvent(new Event('scroll'));
    return {
      scrollY: window.scrollY,
      range: range,
      rectTop: track.getBoundingClientRect().top,
      targetFrame: window.__BISHU__.state.targetFrame,
      currentFrame: window.__BISHU__.state.currentFrame
    };
  })()`);
  console.log('Scroll 25% metrics:', scrollInfo25);
  await sleep(600);
  const frame25 = await client.eval('document.getElementById("frame-counter")?.textContent');
  const stage25 = await client.eval('document.getElementById("stage-card-title")?.textContent');
  console.log(`At 25% scroll: ${frame25} | Stage: ${stage25}`);
  await client.captureScreenshot('verify-02-carving.png');

  // Test Scroll to 50% (Lost-wax Casting phase)
  console.log('Scrolling to 50% (Casting)...');
  const scrollInfo50 = await client.eval(`(() => {
    const track = document.getElementById('hero-track');
    const range = track.offsetHeight - window.innerHeight;
    const targetY = range * 0.50;
    window.scrollTo(0, targetY);
    window.dispatchEvent(new Event('scroll'));
    return {
      scrollY: window.scrollY,
      range: range,
      rectTop: track.getBoundingClientRect().top,
      targetFrame: window.__BISHU__.state.targetFrame,
      currentFrame: window.__BISHU__.state.currentFrame
    };
  })()`);
  console.log('Scroll 50% metrics:', scrollInfo50);
  await sleep(600);
  const frame50 = await client.eval('document.getElementById("frame-counter")?.textContent');
  const stage50 = await client.eval('document.getElementById("stage-card-title")?.textContent');
  console.log(`At 50% scroll: ${frame50} | Stage: ${stage50}`);
  await client.captureScreenshot('verify-03-casting.png');

  // Test Scroll to 75% (Refining / Polishing phase)
  console.log('Scrolling to 75% (Refining)...');
  const scrollInfo75 = await client.eval(`(() => {
    const track = document.getElementById('hero-track');
    const range = track.offsetHeight - window.innerHeight;
    const targetY = range * 0.75;
    window.scrollTo(0, targetY);
    window.dispatchEvent(new Event('scroll'));
    return {
      scrollY: window.scrollY,
      range: range,
      rectTop: track.getBoundingClientRect().top,
      targetFrame: window.__BISHU__.state.targetFrame,
      currentFrame: window.__BISHU__.state.currentFrame
    };
  })()`);
  console.log('Scroll 75% metrics:', scrollInfo75);
  await sleep(600);
  const frame75 = await client.eval('document.getElementById("frame-counter")?.textContent');
  const stage75 = await client.eval('document.getElementById("stage-card-title")?.textContent');
  console.log(`At 75% scroll: ${frame75} | Stage: ${stage75}`);
  await client.captureScreenshot('verify-04-refining.png');

  // Test Scroll to 100% (Finished Silver Ring phase)
  console.log('Scrolling to 100% of hero track (Sterling Silver)...');
  const scrollInfo100 = await client.eval(`(() => {
    const track = document.getElementById('hero-track');
    const range = track.offsetHeight - window.innerHeight;
    const targetY = range * 1.0;
    window.scrollTo(0, targetY);
    window.dispatchEvent(new Event('scroll'));
    return {
      scrollY: window.scrollY,
      range: range,
      rectTop: track.getBoundingClientRect().top,
      targetFrame: window.__BISHU__.state.targetFrame,
      currentFrame: window.__BISHU__.state.currentFrame
    };
  })()`);
  console.log('Scroll 100% metrics:', scrollInfo100);
  await sleep(600);
  const frame100 = await client.eval('document.getElementById("frame-counter")?.textContent');
  const stage100 = await client.eval('document.getElementById("stage-card-title")?.textContent');
  console.log(`At 100% scroll: ${frame100} | Stage: ${stage100}`);
  await client.captureScreenshot('verify-05-finished-ring.png');

  // Test Scrolling beyond Hero into Process section
  console.log('Scrolling into Process section...');
  await client.eval(`(() => {
    const processSec = document.getElementById('process');
    processSec.scrollIntoView({ behavior: 'instant' });
  })()`);
  await sleep(600);
  await client.captureScreenshot('verify-06-process-section.png');

  // Test Scrolling to Materials section
  console.log('Scrolling into Materials section...');
  await client.eval(`(() => {
    const matSec = document.getElementById('materials');
    matSec.scrollIntoView({ behavior: 'instant' });
  })()`);
  await sleep(600);
  await client.captureScreenshot('verify-07-materials-section.png');

  // Test Scrolling to The Ring section
  console.log('Scrolling into The Ring section...');
  await client.eval(`(() => {
    const ringSec = document.getElementById('the-ring');
    ringSec.scrollIntoView({ behavior: 'instant' });
  })()`);
  await sleep(600);
  await client.captureScreenshot('verify-11-the-ring.png');

  // Test Scrolling to CTA & Footer section
  console.log('Scrolling into CTA section...');
  await client.eval(`(() => {
    const ctaSec = document.getElementById('cta');
    ctaSec.scrollIntoView({ behavior: 'instant' });
  })()`);
  await sleep(600);
  await client.captureScreenshot('verify-12-cta.png');

  // Test Reverse Scroll back to Top
  console.log('Testing reverse scroll back to top...');
  await client.eval(`(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
  })()`);
  await sleep(600);
  const frameBack = await client.eval('document.getElementById("frame-counter")?.textContent');
  console.log(`After reverse scroll to top: ${frameBack}`);
  await client.captureScreenshot('verify-08-back-to-top.png');

  // Test Mobile Portrait Viewport (390 x 844, iPhone 14 / modern standard)
  console.log('Testing Mobile Portrait Viewport (390x844)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await client.eval('window.dispatchEvent(new Event("resize"));');
  await sleep(400);
  await client.captureScreenshot('verify-09-mobile-portrait-hero.png');

  // Mobile scroll to casting stage
  await client.eval(`
    const track = document.getElementById('hero-track');
    const range = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: range * 0.5, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  `);
  await sleep(400);
  await client.captureScreenshot('verify-10-mobile-casting.png');

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`Browser Errors / Exceptions: ${client.errors.length}`);
  if (client.errors.length > 0) {
    console.error(client.errors);
  } else {
    console.log('ALL TESTS PASSED: Zero errors, zero console exceptions!');
  }

  client.close();
  edgeProc.kill();
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
