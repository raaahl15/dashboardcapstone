#!/usr/bin/env node
/**
 * sync.js — Sinkronisasi Git yang aman antar perangkat (Blueprint v2.0 §8.3–8.4).
 *
 *   npm run sync:pull
 *   npm run sync:push -- "pesan commit yang deskriptif"
 *   npm run sync:push -- --skip-check "pesan"     (lewati pemeriksaan companion)
 *
 * Perilaku push:
 *   1. Menolak jalan jika ada file untracked yang tidak di-ignore (tampilkan daftarnya).
 *      File baru yang memang dimaksud harus di-`git add <file>` dulu secara eksplisit.
 *   2. Menjalankan tools/check_companions.js (kecuali --skip-check).
 *   3. `git add -u` (hanya file yang sudah dilacak) lalu commit dengan pesan yang diberikan.
 *   4. Jika remote ada: `git pull --rebase` lalu `git push`. Jika belum: commit lokal saja.
 */
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

function git(args, inherit = false) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe' });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function fail(msg) { console.error(`\n✗ ${msg}`); process.exit(1); }
const hasRemote = () => git(['remote']).out.length > 0;

function pull() {
  if (!hasRemote()) { console.log('ℹ Belum ada remote Git (dibuat di Fase 2). Tidak ada yang ditarik.'); return; }
  if (git(['pull', '--rebase'], true).code !== 0) fail('git pull --rebase gagal. Selesaikan konflik, lalu jalankan ulang.');
  console.log('✓ Repo sudah terbaru.');
}

function push(argv) {
  const skipCheck = argv.includes('--skip-check');
  const msg = argv.filter((a) => a !== '--skip-check').join(' ').trim();
  if (msg.length < 10) {
    fail('Pesan commit wajib dan harus deskriptif (min. 10 karakter).\n  Contoh: npm run sync:push -- "calc: isi input orifice FE-101 dari HMB"');
  }

  const lines = git(['status', '--porcelain=v1']).out.split('\n').filter(Boolean);
  const untracked = lines.filter((l) => l.startsWith('??')).map((l) => l.slice(3));
  if (untracked.length) {
    console.error('Ada file baru yang belum dilacak dan tidak di-ignore:');
    untracked.forEach((f) => console.error('   ' + f));
    fail('Tambahkan yang memang dimaksud dengan `git add <file>`, atau masukkan ke .gitignore (mis. file sementara AutoCAD).');
  }

  if (!skipCheck) {
    const r = spawnSync('node', [path.join(ROOT, 'tools', 'check_companions.js')], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) fail('Pemeriksaan companion gagal. Perbaiki dulu, atau jalankan dengan --skip-check jika memang disengaja.');
  }

  if (lines.length) {
    git(['add', '-u']);
    const c = git(['commit', '-m', msg], true);
    if (c.code !== 0) fail('git commit gagal.');
  } else {
    console.log('ℹ Tidak ada perubahan untuk di-commit.');
  }

  if (!hasRemote()) {
    console.log('ℹ Belum ada remote Git (dibuat di Fase 2). Commit tersimpan lokal saja.');
    console.log('  Ingat: catat sesi kerja di PROJECT_HISTORY_AND_AUDIT_LOG.md (BAB IV).');
    return;
  }
  if (git(['pull', '--rebase'], true).code !== 0) fail('git pull --rebase gagal. Selesaikan konflik, lalu jalankan ulang.');
  if (git(['push'], true).code !== 0) fail('git push gagal.');
  console.log('✓ Tersinkron ke remote. Ingat: catat sesi kerja di PROJECT_HISTORY_AND_AUDIT_LOG.md (BAB IV).');
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'pull') pull();
else if (cmd === 'push') push(rest);
else fail('Perintah tidak dikenal. Gunakan: pull | push "<pesan>"');
