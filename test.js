// restructure_safe.js
// Only creates folders and moves existing files. No new code is written.

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const root = process.cwd();
const srcDir = path.join(root, 'src');
const binDir = path.join(root, 'bin');
const scriptsDir = path.join(srcDir, 'scripts');

// Create folders
ensureDir(srcDir);
ensureDir(binDir);
ensureDir(scriptsDir);

// Files to move into src/scripts
const scriptFiles = [
  'dns.js',
  'site.js',
  'ssl.js',
  'editconfig.js',
  'mail.js',
  'mailsetup.js',
  'mailbox.js'
];

scriptFiles.forEach(f => {
  const from = path.join(root, f);
  const to = path.join(scriptsDir, f);
  if (fs.existsSync(from)) {
    if (!fs.existsSync(to)) {
      fs.renameSync(from, to);
      console.log(`Moved: ${f} -> src/scripts/`);
    } else {
      console.log(`Skipped (already exists): ${to}`);
    }
  }
});

// Move aapanel.js into src
const apiFile = path.join(root, 'aapanel.js');
const apiDest = path.join(srcDir, 'aapanel.js');
if (fs.existsSync(apiFile)) {
  if (!fs.existsSync(apiDest)) {
    fs.renameSync(apiFile, apiDest);
    console.log('Moved: aapanel.js -> src/');
  } else {
    console.log(`Skipped (already exists): ${apiDest}`);
  }
}

console.log('\n✅ Restructure done (folders + moves only, no code created).');
