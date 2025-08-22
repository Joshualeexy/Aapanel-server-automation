// Orchestrates: dns -> site -> ssl -> quic-patch -> mail-domain -> mail DNS -> mailbox

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const domain = process.argv[2];
if (!domain) {
  console.error('Usage: aapanel-deploy <domain>');
  process.exit(1);
}

function runStep(label, file, args = []) {
  return new Promise((resolve) => {
    console.log(`\n=== ${label} ===`);
    const scriptPath = path.resolve(__dirname, 'scripts', file);
    const p = spawn(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
    p.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${label} — done`);
        resolve(true);
      } else {
        console.error(`❌ ${label} — failed (exit ${code})`);
        resolve(false);
      }
    });
  });
}

(async () => {
  if (!await runStep('Add domain to DNS Manager', 'dns.js', [domain])) process.exit(1);
  if (!await runStep('Add domain to Website section', 'site.js', [domain])) process.exit(1);
  if (!await runStep('Install & Deploy SSL (Let’s Encrypt)', 'ssl.js', [domain])) process.exit(1);
  if (!await runStep('Patch Nginx: remove "listen 443 quic;"', 'editconfig.js', [domain])) process.exit(1);
  if (!await runStep('Add domain to Mail Server', 'mail.js', [domain])) process.exit(1);
  if (!await runStep('Publish MX/SPF/DKIM/DMARC', 'mailsetup.js', [domain])) process.exit(1);
  if (!await runStep('Create support@ mailbox', 'mailbox.js', [domain])) process.exit(1);

  console.log('\n🎉 Provisioning complete for', domain);
})();
