#!/usr/bin/env node
/**
 * pull_sheets.js — Sinkronisasi satu arah Google Sheets -> snapshot CSV di repo
 * (Blueprint §1.2 & §3.3; LOG-012).
 *
 * Sheets adalah master. CSV di repo hanya snapshot dan tidak diedit langsung.
 * Versi Node ini dipakai selama Python belum terpasang (rencana awal: pull_sheets.py).
 *
 * Pemakaian:
 *   npm run pull:sheets -- --key instrument_index --from-file <csv-unduhan>
 *   npm run pull:sheets -- --key instrument_index --from-file <csv> --dry-run
 *
 * Cara mendapat CSV: buka Sheets (URL di google_workspace_registry.json), pilih tab
 * `sync_tab`, lalu File -> Download -> Comma Separated Values (.csv). Claude Code juga
 * boleh membuat CSV ini dari konektor Google Sheets (get_values tab yang sama).
 *
 * Yang diperiksa sebelum menulis (gagal = exit 1, file repo tidak disentuh):
 *   - semua `required_columns` dari registry ada di header;
 *   - tidak ada nama kolom ganda atau kosong;
 *   - setiap baris punya jumlah sel sama dengan header;
 *   - `key_column` terisi dan unik di setiap baris.
 * Output: CSV RFC 4180, akhir baris LF, urutan kolom & baris sama dengan Sheets,
 * plus ringkasan perbedaan terhadap snapshot lama (tag baru/hilang/berubah, kolom).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const REGISTRY = path.join(ROOT, '06_COLLABORATIVE_WORKSPACE', 'google_workspace_registry.json');

function fail(msg) { console.error(`\n✗ ${msg}`); process.exit(1); }

function parseArgs(argv) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--key') out.key = argv[++i];
    else if (a === '--from-file') out.fromFile = argv[++i];
    else fail(`Argumen tidak dikenal: ${a}`);
  }
  if (!out.key || !out.fromFile) {
    fail('Wajib: --key <registry key> --from-file <csv>\n  Contoh: npm run pull:sheets -- --key instrument_index --from-file "%USERPROFILE%\\Downloads\\index.csv"');
  }
  return out;
}

/** Parser CSV RFC 4180 yang toleran: tanda kutip di tengah sel tanpa kutip dibaca apa adanya. */
function parseCsv(text) {
  const t = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let atCellStart = true;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (quoted) {
      if (c === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"' && atCellStart) { quoted = true; atCellStart = false; continue; }
    if (c === ',') { row.push(cell); cell = ''; atCellStart = true; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; atCellStart = true; continue; }
    cell += c;
    atCellStart = false;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));   // buang baris kosong total
}

const quoteCell = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCsv = (rows) => rows.map((r) => r.map(quoteCell).join(',')).join('\n') + '\n';

function main() {
  const args = parseArgs(process.argv.slice(2));

  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const doc = (registry.documents || []).find((d) => d.key === args.key);
  if (!doc) fail(`Key '${args.key}' tidak ada di registry.`);
  if (doc.sync_direction !== 'sheets_to_repo' || !doc.repo_snapshot) {
    fail(`Dokumen '${args.key}' tidak dikonfigurasi untuk sinkronisasi Sheets -> repo.`);
  }
  const required = doc.required_columns || [];
  const keyCol = doc.key_column;

  const srcPath = path.resolve(args.fromFile);
  if (!fs.existsSync(srcPath)) fail(`File sumber tidak ditemukan: ${srcPath}`);
  const rows = parseCsv(fs.readFileSync(srcPath, 'utf8'));
  if (rows.length < 1) fail('CSV sumber kosong.');

  const header = rows[0].map((h) => h.trim());
  const body = rows.slice(1);
  const errors = [];

  const seen = new Set();
  header.forEach((h, i) => {
    if (!h) errors.push(`Header kolom ke-${i + 1} kosong.`);
    else if (seen.has(h)) errors.push(`Nama kolom ganda: ${h}`);
    seen.add(h);
  });
  for (const col of required) if (!seen.has(col)) errors.push(`Kolom wajib tidak ada: ${col}`);

  const keyIdx = keyCol ? header.indexOf(keyCol) : -1;
  const keys = new Set();
  body.forEach((r, i) => {
    const line = i + 2;
    if (r.length !== header.length) errors.push(`Baris ${line}: ${r.length} sel, header ${header.length} kolom.`);
    if (keyIdx >= 0) {
      const k = (r[keyIdx] || '').trim();
      if (!k) errors.push(`Baris ${line}: ${keyCol} kosong.`);
      else if (keys.has(k)) errors.push(`Baris ${line}: ${keyCol} '${k}' ganda.`);
      keys.add(k);
    }
  });

  if (errors.length) {
    console.error(`Validasi gagal (${errors.length}):`);
    errors.forEach((e) => console.error('  x ' + e));
    fail('Snapshot repo tidak diubah.');
  }

  // Ringkasan perbedaan terhadap snapshot lama
  const destPath = path.join(ROOT, doc.repo_snapshot);
  const oldRows = fs.existsSync(destPath) ? parseCsv(fs.readFileSync(destPath, 'utf8')) : [];
  const oldHeader = (oldRows[0] || []).map((h) => h.trim());
  const addedCols = header.filter((h) => !oldHeader.includes(h));
  const removedCols = oldHeader.filter((h) => !header.includes(h));
  const index = (hdr, data) => {
    const ki = hdr.indexOf(keyCol);
    const m = new Map();
    if (ki < 0) return m;
    for (const r of data) m.set((r[ki] || '').trim(), Object.fromEntries(hdr.map((h, i) => [h, (r[i] || '').trim()])));
    return m;
  };
  const oldMap = index(oldHeader, oldRows.slice(1));
  const newMap = index(header, body);
  const addedKeys = [...newMap.keys()].filter((k) => !oldMap.has(k));
  const removedKeys = [...oldMap.keys()].filter((k) => !newMap.has(k));
  const changed = [];
  for (const [k, nv] of newMap) {
    const ov = oldMap.get(k);
    if (!ov) continue;
    const cols = header.filter((h) => oldHeader.includes(h) && ov[h] !== nv[h]);
    if (cols.length) changed.push(`${k} (${cols.join(', ')})`);
  }

  console.log('=== PULL SHEETS ===');
  console.log(`Dokumen  : ${doc.title} [${args.key}]`);
  console.log(`Sumber   : ${srcPath}`);
  console.log(`Tujuan   : ${doc.repo_snapshot}`);
  console.log(`Ukuran   : ${header.length} kolom, ${body.length} baris data`);
  console.log(`Kolom    : +[${addedCols.join(', ')}] -[${removedCols.join(', ')}]`);
  console.log(`Baris    : +${addedKeys.length} ${addedKeys.join(' ')} | -${removedKeys.length} ${removedKeys.join(' ')}`);
  console.log(`Berubah  : ${changed.length ? changed.join('; ') : '-'}`);

  if (args.dryRun) { console.log('\nDRY RUN: snapshot tidak ditulis.'); return; }
  fs.writeFileSync(destPath, toCsv([header, ...body]), 'utf8');
  console.log(`\n✓ Snapshot ditulis. Perbarui log revisi companion .md dan catat di log riwayat.`);
}

main();
