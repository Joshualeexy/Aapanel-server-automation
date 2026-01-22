// mail.js
// Usage: node mail.js example.com

const crypto = require('crypto');
const ap = require('../aapanel'); // loads dotenv internally

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

(async () => {
  try {
    const domain = (process.argv[2] || '').trim().toLowerCase();
    if (!domain) {
      console.error('Usage: node mail.js <domain>');
      process.exit(1);
    }

    const QUOTA_GB = parseInt(process.env.MAIL_DOMAIN_QUOTA_GB, 10) || 1;
    const MAX_MAILBOXES = parseInt(process.env.MAIL_MAX_MAILBOXES, 10) || 50;

    // ---- 1) Read site certificate & compute hash (REQUIRED FIRST) ----
    const certPath = `/www/server/panel/vhost/cert/${domain}/fullchain.pem`;
    console.log(`🔎 Reading certificate: ${certPath}`);

    const getFile = await ap('/files?action=GetFileBody', { path: certPath });
    if (!getFile || typeof getFile.data !== 'string') {
      throw new Error(`Could not read fullchain.pem for ${domain}`);
    }

    const hash = md5(getFile.data);

    // ---- 2) Add mail domain (AUTOMATIC DNS) ----
    const addPayload = {
      domain,
      a_record: '',
      ips: '',
      quota: `${QUOTA_GB} GB`,
      mailboxes: MAX_MAILBOXES,
      automatic: 1,
      hash
    };

    console.log('➕ Adding mail domain (automatic)');
    await ap(
      '/v2/plugin?action=a&name=mail_sys&s=add_domain_new',
      addPayload
    );

    // ---- 3) Short wait for mail module readiness ----
    await new Promise(res => setTimeout(res, 5000));

    // ---- 4) Auto-deploy SSL to mail (reuse SAME hash) ----
    console.log('🚀 Auto-deploying mail SSL');
    await ap('/v2/plugin?action=a&name=mail_sys&s=auto_deploy_cert', {
      domain,
      hash
    });

    console.log(`✅ Mail domain ready (automatic DNS + SSL): ${domain}`);
  } catch (err) {
    console.error('❌ Failed.');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', err.response.data);
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
})();
