#!/usr/bin/env node
/**
 * check_companions.js — Pemeriksa aturan companion .md & kesehatan repo.
 *
 * Mengacu Blueprint v2.0:
 *   §1.4  siklus status dokumen
 *   §2.2  kebijakan penyimpanan (tidak ada file > 5 MB di Git)
 *   §5.1  aturan companion per artefak
 *   BAB VI DoD Fase 1.5 (tanpa file duplikat)
 *
 * Pemakaian:  npm run check        (atau: node tools/check_companions.js)
 * Exit code:  0 = semua lolos, 1 = ada pelanggaran.
 *
 * Catatan: ditulis dengan Node.js (bukan Python) karena tool ini adalah
 * kebersihan repo, sejajar dengan build_manifest.js. Pipeline data
 * rekayasa (DWSIM, kalkulator, validasi tag) tetap Python mulai Fase 3.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ARTIFACT_DIR_RE = /^0[0-7]_/;                 // folder 00_ s.d. 07_
const ARTIFACT_EXT = new Set(['.csv', '.json', '.dwxmz', '.lin', '.yaml', '.yml']);
const VALID_STATUS = ['Draft', 'WIP', 'Review Internal', 'Diajukan', 'ACC Pembimbing', 'Revisi'];
const NEED_EVIDENCE = new Set(['Diajukan', 'ACC Pembimbing']);
const MAX_BYTES = 5 * 1024 * 1024;
const DUP_MIN_BYTES = 64;                            // abaikan file sangat kecil (mis. .gitkeep)

// ---------------------------------------------------------------- utilitas
function listRepoFiles() {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error('Gagal menjalankan git ls-files:', r.stderr);
    process.exit(2);
  }
  return r.stdout.split('\0').filter(Boolean)
    .filter((p) => fs.existsSync(path.join(ROOT, p)));   // abaikan file terhapus yang belum di-stage
}

function parseScalar(raw) {
  let v = raw.trim();
  if (v === '') return '';
  if (v.startsWith('"')) {
    const end = v.indexOf('"', 1);
    return end > 0 ? v.slice(1, end) : v.slice(1);
  }
  if (v.startsWith('[')) {
    const inner = v.slice(1, v.lastIndexOf(']'));
    return inner.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
  return v.replace(/\s+#.*$/, '').trim();
}

/** Parser frontmatter YAML sederhana (cukup untuk format baku Blueprint §5.2). */
function parseFrontmatter(text) {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');   // buang BOM (editor Windows) & CRLF
  if (!t.startsWith('---\n')) return null;
  const end = t.indexOf('\n---', 4);
  if (end < 0) return null;
  const fm = {};
  let curKey = null;
  let curObj = null;
  for (const line of t.slice(4, end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    let m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) { curKey = m[1]; curObj = null; fm[curKey] = parseScalar(m[2]); continue; }
    m = line.match(/^\s+-\s+(.*)$/);
    if (m && curKey) {
      if (!Array.isArray(fm[curKey])) fm[curKey] = [];
      const kv = m[1].match(/^([A-Za-z_]\w*):\s*(.*)$/);
      if (kv) { curObj = { [kv[1]]: parseScalar(kv[2]) }; fm[curKey].push(curObj); }
      else { curObj = null; fm[curKey].push(parseScalar(m[1])); }
      continue;
    }
    m = line.match(/^\s+([A-Za-z_]\w*):\s*(.*)$/);
    if (m && curObj) curObj[m[1]] = parseScalar(m[2]);
  }
  return fm;
}

const toPosix = (p) => p.split(path.sep).join('/');
const asList = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

// ---------------------------------------------------------------- pemeriksaan
const errors = [];
const warnings = [];
const files = listRepoFiles();
const fileSet = new Set(files);

// 1) Baca semua companion .md di folder 00_–07_
const companions = [];
for (const f of files) {
  if (!ARTIFACT_DIR_RE.test(f) || path.extname(f).toLowerCase() !== '.md') continue;
  const fm = parseFrontmatter(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  if (!fm) { warnings.push(`${f}: .md tanpa frontmatter (tidak dianggap companion)`); continue; }
  companions.push({ file: f, fm });
}

// 2) Validasi isi frontmatter
const coveredByTarget = new Set();
for (const { file, fm } of companions) {
  const dir = path.posix.dirname(file);
  const status = fm.status;
  if (!status) errors.push(`${file}: field 'status' kosong`);
  else if (!VALID_STATUS.includes(status)) {
    errors.push(`${file}: status '${status}' tidak valid (harus salah satu: ${VALID_STATUS.join(' | ')})`);
  }
  if (NEED_EVIDENCE.has(status) && !fm.review_evidence) {
    errors.push(`${file}: status '${status}' wajib mengisi 'review_evidence' (kode WO / referensi MoM)`);
  }
  if ('target_file' in fm && !('target_files' in fm)) {
    warnings.push(`${file}: masih memakai field lama 'target_file' — ganti ke 'target_files' (list)`);
  }
  for (const t of asList(fm.target_files).concat(asList(fm.target_file))) {
    if (typeof t !== 'string' || !t) continue;
    const rel = path.posix.normalize(path.posix.join(dir, t));
    if (!fileSet.has(rel)) errors.push(`${file}: target_files '${t}' tidak ditemukan di repo`);
    coveredByTarget.add(rel);
  }
}

// 3) Setiap artefak teknis wajib punya companion
const artifacts = files.filter((f) => ARTIFACT_DIR_RE.test(f) && ARTIFACT_EXT.has(path.extname(f).toLowerCase()));
let covered = 0;
const companionFiles = new Set(companions.map((c) => c.file));
for (const a of artifacts) {
  const twin = a.slice(0, -path.extname(a).length) + '.md';
  if (companionFiles.has(twin) || coveredByTarget.has(a)) covered++;
  else errors.push(`${a}: artefak tanpa companion .md`);
}

// 4) Ukuran file (seluruh repo)
for (const f of files) {
  const size = fs.statSync(path.join(ROOT, f)).size;
  if (size > MAX_BYTES) errors.push(`${f}: ${(size / 1048576).toFixed(1)} MB > batas 5 MB (pindahkan ke Drive)`);
}

// 5) File duplikat (hash identik)
const byHash = new Map();
for (const f of files) {
  const abs = path.join(ROOT, f);
  if (fs.statSync(abs).size < DUP_MIN_BYTES) continue;
  const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push(f);
}
for (const group of byHash.values()) {
  if (group.length > 1) errors.push(`File duplikat (isi identik): ${group.join(', ')}`);
}

// ---------------------------------------------------------------- laporan
const statusCount = {};
for (const { fm } of companions) statusCount[fm.status || '(kosong)'] = (statusCount[fm.status || '(kosong)'] || 0) + 1;

console.log('=== CHECK COMPANIONS & REPO HEALTH ===');
console.log(`File dalam repo (tracked + untracked tidak di-ignore): ${files.length}`);
console.log(`Artefak teknis berpasangan companion           : ${covered} / ${artifacts.length}`);
console.log(`Companion .md terbaca                          : ${companions.length}`);
console.log(`Sebaran status                                 : ${Object.entries(statusCount).map(([k, v]) => `${k}=${v}`).join(', ') || '-'}`);
if (warnings.length) { console.log(`\nPERINGATAN (${warnings.length}):`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) {
  console.log(`\nPELANGGARAN (${errors.length}):`);
  errors.forEach((e) => console.log('  x ' + e));
  console.log('\nHASIL: FAIL');
  process.exit(1);
}
console.log('\nHASIL: PASS');
