/**
 * env.js — Loader konfigurasi per perangkat (Blueprint v2.0 §8.2, lapisan 3).
 *
 * Membaca `.env.local` lalu `.env` di root repo (format KEY=VALUE, baris `#` = komentar)
 * tanpa dependensi eksternal. Variabel yang sudah ada di environment tidak ditimpa.
 *
 *   const { requireEnv } = require('./lib/env');
 *   const driveRoot = requireEnv('DRIVE_ROOT');
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, '.env.local'));
loadEnvFile(path.join(ROOT, '.env'));

function requireEnv(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`✗ Variabel '${key}' belum diisi. Salin .env.example → .env.local di root repo, lalu isi '${key}'.`);
    process.exit(1);
  }
  return v;
}

module.exports = { ROOT, requireEnv };
