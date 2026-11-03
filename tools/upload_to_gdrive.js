/**
 * upload_to_gdrive.js — Unggah isi folder DRIVE_ROOT ke Google Drive lewat CLI `gdrive`.
 *
 * Konfigurasi (di .env.local root repo, lihat .env.example):
 *   DRIVE_ROOT              folder lokal sumber, mis. D:\rahul\CAPSTONE_DME_AREA1
 *   GDRIVE_ROOT_FOLDER_ID   ID folder tujuan di Google Drive
 *
 * Prasyarat: CLI `gdrive` terpasang & sudah login di PATH.
 *
 * ⚠️ Tidak idempoten: setiap kali dijalankan, skrip MEMBUAT folder baru dan
 *    mengunggah ulang semua file, sehingga muncul duplikat di Drive. Gunakan
 *    hanya untuk unggahan awal ke folder kosong. Sinkronisasi rutin dikerjakan
 *    di Fase 2 (integrasi Google Drive oleh Antigravity).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { requireEnv } = require('./lib/env');

const rootSource = requireEnv('DRIVE_ROOT');
const rootFolderId = requireEnv('GDRIVE_ROOT_FOLDER_ID');

function runGdrive(cmd) {
    console.log(`Executing: ${cmd}`);
    const out = execSync(cmd, { encoding: 'utf8' });
    return out.trim();
}

function extractFolderId(output) {
    const match = output.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    throw new Error(`Failed to extract folder ID from output: ${output}`);
}

async function main() {
    console.log('=== UPLOAD CAPSTONE_DME_AREA1 TO GOOGLE DRIVE ===');
    const folderMap = new Map();
    folderMap.set('', rootFolderId);

    // Collect all directories and files
    function traverse(currentRelPath) {
        const fullPath = path.join(rootSource, currentRelPath);
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });

        // First pass: directories
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subRelPath = path.join(currentRelPath, entry.name).replace(/\\/g, '/');
                const parentRel = currentRelPath.replace(/\\/g, '/');
                const parentId = folderMap.get(parentRel);

                console.log(`\nCreating folder: ${entry.name} under parent ${parentId} (${parentRel || 'root'})...`);
                const cmd = `gdrive mutate mkdir "${entry.name}" --parent ${parentId}`;
                const res = runGdrive(cmd);
                const newId = extractFolderId(res);
                console.log(`  -> Created with ID: ${newId}`);
                folderMap.set(subRelPath, newId);

                traverse(subRelPath);
            }
        }
    }

    // Traverse to create all folders first
    traverse('');

    // Second pass: upload files
    function uploadFiles(currentRelPath) {
        const fullPath = path.join(rootSource, currentRelPath);
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const parentRel = currentRelPath.replace(/\\/g, '/');
        const parentId = folderMap.get(parentRel);

        for (const entry of entries) {
            if (entry.isFile()) {
                const filePath = path.join(fullPath, entry.name);
                const stats = fs.statSync(filePath);
                const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`\nUploading file: ${entry.name} (${sizeMb} MB) to folder ID: ${parentId} [${parentRel || 'root'}]...`);
                const cmd = `gdrive mutate upload "${filePath}" --parent ${parentId}`;
                const res = runGdrive(cmd);
                console.log(`  -> ${res}`);
            }
        }

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subRelPath = path.join(currentRelPath, entry.name).replace(/\\/g, '/');
                uploadFiles(subRelPath);
            }
        }
    }

    uploadFiles('');
    console.log('\n=== ALL FILES UPLOADED SUCCESSFULLY! ===');
}

main().catch(err => {
    console.error('Upload error:', err);
    process.exit(1);
});

