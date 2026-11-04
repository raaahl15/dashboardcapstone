#!/usr/bin/env node
/**
 * smoke_console.js — Uji DoD Fase 4 butir 2: semua modul cockpit dibuka tanpa error di console browser.
 *
 * Pemakaian (di PC/laptop yang punya Chrome atau Edge):
 *   node tools/smoke_console.js --url https://<domain-produksi>
 *   node tools/smoke_console.js --url http://localhost:5173 --login-timeout 300
 *   node tools/smoke_console.js --url <URL> --dump     (simpan teks tiap modul ke laporan untuk cek isi data)
 *
 * Alur:
 *   1. Membuka Chrome/Edge dengan PROFIL SEMENTARA (bukan profil pribadi) + remote debugging.
 *   2. Menunggu PENGGUNA login sendiri di jendela itu (skrip tidak pernah membaca/mengisi password).
 *   3. Setelah menu cockpit muncul, mengklik setiap menu dan sub-tab (navigation.ts, 8 menu / 14 modul),
 *      menunggu sebentar per modul, dan mencatat error console (console.error, exception tak tertangkap,
 *      error jaringan/log browser).
 *   4. Menulis laporan JSON ke tools/out/smoke_console_<waktu>.json dan ringkasan di layar.
 * Exit code 0 bila 0 error setelah login, 1 bila ada error, 2 bila gagal menjalankan uji.
 * Memakai WebSocket bawaan Node ≥ 22 (tanpa dependensi).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const NAV_FILE = path.join(ROOT, 'apps', 'operations-cockpit', 'src', 'components', 'layout', 'navigation.ts');
const PORT = 9333;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}

/** Baca struktur menu dari navigation.ts (sumber tunggal), bukan daftar yang ditulis ulang di sini. */
function readNav() {
  const src = fs.readFileSync(NAV_FILE, 'utf8');
  const groups = [];
  const re = /\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)',\s*section:[^,]+,\s*tabs:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    const tabs = [...m[3].matchAll(/\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}/g)].map((t) => ({ key: t[1], label: t[2] }));
    groups.push({ key: m[1], label: m[2], tabs });
  }
  if (!groups.length) throw new Error(`gagal membaca menu dari ${NAV_FILE}`);
  return groups;
}

function findBrowser() {
  const c = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ];
  const hit = c.find((p) => p && fs.existsSync(p));
  if (!hit) throw new Error('Chrome/Edge tidak ditemukan');
  return hit;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* browser belum siap */ }
    await sleep(200);
  }
  throw new Error('tidak bisa terhubung ke remote debugging browser');
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        this.listeners.forEach((fn) => fn(msg));
      }
    };
  }
  open() { return new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; }); }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result.value;
  }
}

/** Klik tombol yang teks terlihatnya persis `label` (menu atau sub-tab). */
const clickByText = (label) => `(() => {
  const want = ${JSON.stringify(label)};
  const btn = [...document.querySelectorAll('button, a, [role="tab"]')]
    .find((b) => b.offsetParent !== null && b.innerText.trim() === want);
  if (!btn) return false;
  btn.click();
  return true;
})()`;

async function main() {
  const url = arg('url');
  if (!url) {
    console.error('Pemakaian: node tools/smoke_console.js --url <URL cockpit> [--login-timeout detik] [--dwell ms]');
    process.exit(2);
  }
  const loginTimeout = Number(arg('login-timeout', '600')) * 1000;
  const dwell = Number(arg('dwell', '2500'));
  const dump = process.argv.includes('--dump');
  const nav = readNav();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cockpit-smoke-'));
  const browser = spawn(findBrowser(), [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--new-window', url,
  ], { stdio: 'ignore' });

  const errors = [];
  let phase = 'sebelum-login';
  const cdp = new Cdp(await pageWsUrl());
  await cdp.open();
  cdp.listeners.push((m) => {
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'assert')) {
      errors.push({ phase, kind: 'console.error', text: m.params.args.map((a) => a.value ?? a.description ?? '').join(' ') });
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push({ phase, kind: 'exception', text: d.exception?.description || d.text });
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      errors.push({ phase, kind: `log:${m.params.entry.source}`, text: `${m.params.entry.text} ${m.params.entry.url || ''}`.trim() });
    }
  });
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const firstMenu = nav[1].label; // "Work Order": hanya muncul setelah login
  console.log(`Browser terbuka di ${url}. Silakan LOGIN di jendela itu (menunggu maks ${loginTimeout / 1000} detik)...`);
  const t0 = Date.now();
  let loggedIn = false;
  while (Date.now() - t0 < loginTimeout) {
    loggedIn = await cdp.eval(`[...document.querySelectorAll('button')].some((b) => b.offsetParent !== null && b.innerText.trim() === ${JSON.stringify(firstMenu)})`).catch(() => false);
    if (loggedIn) break;
    await sleep(1000);
  }
  const report = { url, started_at: new Date().toISOString(), logged_in: loggedIn, modules: [], errors };
  if (loggedIn) {
    console.log('Login terdeteksi. Mengklik semua modul...');
    await sleep(dwell);
    for (const g of nav) {
      for (const t of g.tabs) {
        phase = `${g.label} › ${t.label}`;
        const before = errors.length;
        const okGroup = await cdp.eval(clickByText(g.label));
        await sleep(400);
        const okTab = g.tabs.length > 1 ? await cdp.eval(clickByText(t.label)) : true;
        await sleep(dwell);
        const mod = { menu: g.label, tab: t.label, key: t.key, clicked: Boolean(okGroup && okTab), errors: errors.length - before };
        if (dump) {
          // --dump: simpan teks halaman agar isi data (Gantt, WO, MoM, dst.) bisa dicocokkan di luar browser
          mod.text = String(await cdp.eval('document.querySelector("main")?.innerText || document.body.innerText')).slice(0, 60000);
        }
        report.modules.push(mod);
        console.log(`  ${mod.clicked ? '✓' : '✗ tidak ditemukan'}  ${phase}  — ${mod.errors} error`);
      }
    }
  } else {
    console.log('Login tidak terdeteksi dalam batas waktu; uji modul dilewati.');
  }
  report.finished_at = new Date().toISOString();
  const after = errors.filter((e) => e.phase !== 'sebelum-login');
  report.summary = {
    modules_total: report.modules.length,
    modules_clicked: report.modules.filter((m) => m.clicked).length,
    errors_after_login: after.length,
    errors_before_login: errors.length - after.length,
  };
  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `smoke_console_${report.started_at.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nModul diklik: ${report.summary.modules_clicked}/${report.summary.modules_total}; ` +
    `error setelah login: ${after.length}; sebelum login: ${report.summary.errors_before_login}`);
  after.forEach((e) => console.log(`  [${e.phase}] ${e.kind}: ${e.text.slice(0, 300)}`));
  console.log(`Laporan: ${path.relative(ROOT, out)}`);
  browser.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* profil masih dikunci browser */ }
  const pass = loggedIn && after.length === 0 && report.summary.modules_clicked === report.summary.modules_total;
  console.log(pass ? 'HASIL: PASS' : 'HASIL: FAIL');
  process.exit(!loggedIn ? 2 : pass ? 0 : 1);
}

main().catch((e) => { console.error(`GAGAL: ${e.message}`); process.exit(2); });
