// Orchestrates: dns -> site -> ssl -> quic-patch -> mail-domain -> mail DNS -> mailbox

const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

const args = process.argv.slice(2);
const domain = args.find(a => !a.startsWith('--'));
const skipDns = args.includes('--skipdns');

if (!domain) {
  console.error('Usage: aapanel-deploy <domain> [--skipdns]');
  process.exit(1);
}

function runStep(label, file, args = []) {
  return new Promise((resolve) => {
    console.log(`\n=== ${label} ===`);
    const scriptPath = path.resolve(__dirname, 'src', 'scripts', file);
    console.log(`Running: node ${scriptPath}`);
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
  if (!skipDns) {
    if (!await runStep('Add domain to DNS Manager', 'dns.js', [domain])) {
      process.exit(1);
    }
  } else {
    console.log('\n⚠️  DNS creation skipped — assuming domain already exists and is managed externally');
    if (!await runStep('Syncing all Cloudflare domains to aaPanel', 'pull-domain.js', [domain])) {
      process.exit(1);
    }
  }
  if (!await runStep('Add domain to Website section', 'site.js', [domain])) process.exit(1);
  if (!await runStep('Install & Deploy SSL (Let’s Encrypt)', 'ssl.js', [domain])) process.exit(1);
  if (!await runStep('Patch Nginx: remove "listen 443 quic;"', 'editconfig.js', [domain])) process.exit(1);
  const mailOk = await runStep('Add domain to Mail Server', 'mail.js', [domain]);
  if (!mailOk) {
    console.warn(
      '⚠️  Mail SSL not installed yet.\n' +
      '    Website SSL is likely still pending (DNS not propagated).\n' +
      '    Mail domain was added; continuing with mailbox creation.'
    );
  }
  if (!await runStep('Create support@ mailbox', 'mailbox.js', [domain])) process.exit(1);

  console.log('\n🎉 Provisioning complete for', domain);
})();
