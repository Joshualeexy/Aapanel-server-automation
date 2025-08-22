// mail.js
// Usage: node mail.js example.com

require('dotenv').config();
const crypto = require('crypto');
const ap = require('../aapanel'); // your signed aaPanel request helper

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

    // ---- 1) Add mail domain ----
    const QUOTA_GB = 1; // default quota in GB
    const MAX_MAILBOXES = 50; // default max mailboxes

    const addPayload = {
      domain,
      a_record: `mail.${domain}`,
      ips: process.env.SERVER_PUBLIC_IP,
      quota: `${QUOTA_GB} GB`,         // matches UI format
      mailboxes: MAX_MAILBOXES,
    };

    console.log('➕ Adding mail domain via')
    const addResp = await ap('/v2/plugin?action=a&name=mail_sys&s=add_domain_new', addPayload);
    console.log('added domain to email domain:', addResp);

    // ---- 1.5) Wait 5 seconds (non-blocking) ----
    console.log('⏳ Waiting 5s before deploying mail cert...');
    await new Promise(res => setTimeout(res, 5000));
    // ---- 2) Compute hash of site fullchain.pem and auto-deploy to mail ----
    const certPath = `/www/server/panel/vhost/cert/${domain}/fullchain.pem`;
    console.log(`🔎 Reading certificate: ${certPath}`);
    const getFile = await ap('/files?action=GetFileBody', { path: certPath });
    if (!getFile || typeof getFile.data !== 'string') {
      throw new Error(`Could not read fullchain.pem for ${domain}`);
    }
    const hash = md5(getFile.data);

    console.log('🚀 Auto-deploying SSL mail domain');
    const deployResp = await ap('/v2/plugin?action=a&name=mail_sys&s=auto_deploy_cert', {
      domain,
      hash
    });

    console.log(`✅ Done: mail domain added and SSL deployed for ${domain}`);
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
