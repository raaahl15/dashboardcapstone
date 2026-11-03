#!/usr/bin/env node
/**
 * build_manifest.js — Bundel data rekayasa ke cockpit (Blueprint §3.6, BAB IV modul 6, 9, 10 + panel
 * Kesehatan Data). Data statis TIDAK disimpan di Firestore; disalin ke apps/operations-cockpit/public/data/
 * dan ikut ter-deploy bersama website.
 *
 *   node tools/build_manifest.js          tulis ulang public/data/*.json
 *   node tools/build_manifest.js --check  exit 1 bila public/data/ basi (sumber berubah sejak dibundel)
 *
 * Dijalankan otomatis oleh `npm run build` di root. Vercel membangun dari apps/operations-cockpit saja,
 * jadi file hasil WAJIB di-commit (dicek oleh check_companions.js).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'apps', 'operations-cockpit', 'public', 'data');
const P = (...p) => path.join(ROOT, ...p);
const SRC = {
  hmb: P('01_PROCESS_SIMULATION_DWSIM', 'exported_data', 'hmb_streams.json'),
  tags: P('01_PROCESS_SIMULATION_DWSIM', 'exported_data', 'tag_validation_report.json'),
  registry: P('06_COLLABORATIVE_WORKSPACE', 'google_workspace_registry.json'),
  calcDir: P('02_ENGINEERING_CALCULATORS'),
};
const ARTIFACT_DIR_RE = /^0[0-7]_/;
const MAX_BODY_CHARS = 60000; // batas isi per dokumen di manifest (menjaga ukuran bundel)

// Hash isi teks dengan akhir baris dinormalisasi (CRLF -> LF): Git di Windows dapat mengubah akhir baris
// saat checkout (core.autocrlf), dan itu tidak boleh membuat data cockpit dianggap basi.
const sha = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function gitFiles() {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git ls-files gagal: ' + r.stderr);
  return r.stdout.split('\0').filter(Boolean).filter((f) => fs.existsSync(path.join(ROOT, f)));
}

/** Parser CSV RFC 4180 sederhana (sama dengan pull_sheets.js). */
function parseCsv(text) {
  const t = text.replace(/^﻿/, '');
  const rows = []; let row = []; let cell = ''; let q = false; let start = true;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"' && start) { q = true; start = false; continue; }
    if (c === ',') { row.push(cell); cell = ''; start = true; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; start = true; continue; }
    cell += c; start = false;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/** Frontmatter YAML sederhana (format baku Blueprint §5.2). */
function splitFrontmatter(text) {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return null;
  const end = t.indexOf('\n---', 4);
  if (end < 0) return null;
  const fm = {}; let key = null;
  for (const line of t.slice(4, end).split('\n')) {
    let m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) {
      key = m[1];
      let v = m[2].trim().replace(/\s+#.*$/, '');
      if (v.startsWith('"')) v = v.slice(1, v.indexOf('"', 1) > 0 ? v.indexOf('"', 1) : undefined);
      else if (v.startsWith('[')) v = v.slice(1, v.lastIndexOf(']')).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
      fm[key] = v;
      continue;
    }
    m = line.match(/^\s+-\s+"?(.*?)"?\s*$/);
    if (m && key) { if (!Array.isArray(fm[key])) fm[key] = []; fm[key].push(m[1]); }
  }
  return { fm, body: t.slice(end + 4).replace(/^\n+/, '') };
}

function calcResults() {
  const files = fs.readdirSync(SRC.calcDir).filter((f) => /^CALC_.*\.csv$/.test(f)).sort();
  return files.map((file) => {
    const rows = parseCsv(fs.readFileSync(path.join(SRC.calcDir, file), 'utf8'));
    const byTag = {};
    for (const r of rows) (byTag[r.TAG] ||= []).push(r);
    const items = Object.entries(byTag).map(([tag, rs]) => {
      const concl = rs.find((r) => r.SECTION === 'KESIMPULAN');
      const info = rs.find((r) => r.SECTION === 'INFO');
      return {
        tag,
        description: info ? info.VALUE : '',
        result: concl ? concl.VALUE : 'BELUM DIHITUNG',
        data_status: (concl || info || rs[0]).DATA_STATUS,
        rows: rs.map((r) => ({ section: r.SECTION, parameter: r.PARAMETER, symbol: r.SYMBOL, value: r.VALUE, unit: r.UNIT, source: r.SOURCE, status: r.DATA_STATUS })),
      };
    });
    return { file, items };
  });
}

function libraryManifest(files) {
  const docs = [];
  for (const f of files) {
    if (!ARTIFACT_DIR_RE.test(f) || !f.endsWith('.md')) continue;
    const parsed = splitFrontmatter(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    if (!parsed) continue;
    const { fm, body } = parsed;
    docs.push({
      path: f,
      folder: f.split('/')[0],
      id: fm.id || '', title: fm.title || path.basename(f), category: fm.category || '', standard: fm.standard || '',
      status: fm.status || '', author: fm.author || '', reviewer: fm.reviewer || '', last_updated: fm.last_updated || '',
      google_ref: fm.google_ref || '', target_files: Array.isArray(fm.target_files) ? fm.target_files : [],
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      body: body.length > MAX_BODY_CHARS ? body.slice(0, MAX_BODY_CHARS) + '\n\n[... dipotong; baca file lengkap di repo]' : body,
    });
  }
  return docs.sort((a, b) => a.path.localeCompare(b.path));
}

function companionCheck() {
  const r = spawnSync('node', [P('tools', 'check_companions.js'), '--no-data-check'], { cwd: ROOT, encoding: 'utf8' });
  const m = r.stdout.match(/berpasangan companion\s*:\s*(\d+)\s*\/\s*(\d+)/);
  return { covered: m ? +m[1] : null, total: m ? +m[2] : null, pass: r.status === 0 };
}

function sourceHashes(files) {
  const list = [SRC.hmb, SRC.tags, SRC.registry,
    ...fs.readdirSync(SRC.calcDir).filter((f) => /^CALC_.*\.csv$/.test(f)).map((f) => path.join(SRC.calcDir, f)),
    ...files.filter((f) => ARTIFACT_DIR_RE.test(f) && f.endsWith('.md')).map((f) => path.join(ROOT, f))];
  return Object.fromEntries(list.sort().map((f) => [rel(f), sha(f)]));
}

function build() {
  const files = gitFiles();
  const hmb = JSON.parse(fs.readFileSync(SRC.hmb, 'utf8'));
  const tags = JSON.parse(fs.readFileSync(SRC.tags, 'utf8'));
  const registry = JSON.parse(fs.readFileSync(SRC.registry, 'utf8'));
  const calc = calcResults();
  const library = libraryManifest(files);
  const calcItems = calc.flatMap((c) => c.items);
  const statusCount = {};
  for (const d of library) statusCount[d.status || '(kosong)'] = (statusCount[d.status || '(kosong)'] || 0) + 1;

  const health = {
    generated_at: new Date().toISOString(),
    hmb: {
      extracted_at: hmb.meta.extracted_at, solver_status: hmb.meta.solver_status,
      model_saved_on: hmb.meta.model_saved_on, source_sha256: hmb.meta.source_sha256,
      mass_balance_max_error_pct: hmb.validation.mass_balance_max_error_pct, warnings: hmb.validation.warnings.length,
    },
    calc: {
      total: calcItems.length,
      pass: calcItems.filter((i) => i.result === 'PASS').length,
      fail: calcItems.filter((i) => i.result === 'FAIL').length,
      not_calculated: calcItems.filter((i) => i.result === 'BELUM DIHITUNG').length,
      placeholder: calcItems.filter((i) => i.data_status === 'PLACEHOLDER').length,
    },
    tags: { generated_at: tags.meta.generated_at, ...tags.summary, pid_checked: tags.meta.pid_dxf_checked.length },
    companions: { ...companionCheck(), status_distribution: statusCount },
    sources: sourceHashes(files),
  };
  return {
    'hmb_streams.json': hmb,
    'tag_validation_report.json': tags,
    'google_workspace_registry.json': registry,
    'calc_results.json': { generated_at: health.generated_at, calculators: calc },
    'library_manifest.json': { generated_at: health.generated_at, documents: library },
    'health.json': health,
  };
}

function check() {
  const healthPath = path.join(OUT, 'health.json');
  if (!fs.existsSync(healthPath)) return ['public/data/health.json belum ada; jalankan `node tools/build_manifest.js`'];
  const recorded = JSON.parse(fs.readFileSync(healthPath, 'utf8')).sources || {};
  const current = sourceHashes(gitFiles());
  const stale = [];
  for (const [f, h] of Object.entries(current)) if (recorded[f] !== h) stale.push(f);
  for (const f of Object.keys(recorded)) if (!(f in current)) stale.push(f + ' (dihapus)');
  return stale.map((f) => `data cockpit basi: ${f} berubah sejak dibundel; jalankan \`node tools/build_manifest.js\``);
}

if (process.argv.includes('--check')) {
  const problems = check();
  problems.forEach((p) => console.error('  x ' + p));
  process.exit(problems.length ? 1 : 0);
} else {
  const out = build();
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, data] of Object.entries(out)) {
    fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 1) + '\n', 'utf8');
    console.log(`  ${name.padEnd(32)} ${(fs.statSync(path.join(OUT, name)).size / 1024).toFixed(1)} KB`);
  }
  console.log(`✓ Data cockpit ditulis ke ${rel(OUT)}/`);
}
