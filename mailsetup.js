// mail_dns_setup_simple.js
// Adds MX (@), SPF (@), DKIM (default._domainkey), DMARC (_dmarc)

const ap = require('./aapanel');
const TTL = 600;

function isOK(r) {
  if (!r) return false;
  if (r?.status === -1) return false;
  const s = JSON.stringify(r);
  if (/fail|error/i.test(s)) return false;
  return true;
}

function logRes(label, res) {
  if (isOK(res)) console.log(`✅ ${label} — added`, res);
  else console.error(`❌ ${label} — failed`, res);
}

async function fileGet(path) {
  const r = await ap('/files?action=GetFileBody', { path });
  return r?.data || r?.body || '';
}

async function getDKIM(domain) {
  const base = `/www/server/dkim/${domain}/default.pub`;
  const raw = await fileGet(base);
  s = String(raw);
  const m = /p\s*=\s*([A-Za-z0-9+/=]+)/i.exec(s);
  if (m) return `v=DKIM1; k=rsa; ${m[0]}`;

  throw new Error(`DKIM not found in ${base}/default.txt or default.pub`);
}

async function add(domain, type, host, value, mxPriority) {
  const payload = { domain, type, host, ttl: TTL, value, act: 'add' };
  if (type === 'MX') payload.mx_priority = mxPriority ?? 10;
  return ap('/plugin?action=a&name=dns_manager&s=act_resolve', payload);
}

(async () => {
  try {
    const domain = process.argv[2];
    if (!domain) throw new Error('Usage: node mail_dns_setup_simple.js <domain>');

    // MX
    try {
      const mx = await add(domain, 'MX', '@', `mail.${domain}`, 10);
      logRes('MX @ → mail.' + domain, mx);
    } catch (e) { console.error('❌ MX error:', e.message || e); }

    // SPF
    try {
      const spf = await add(domain, 'TXT', '@', 'v=spf1 +a +mx -all');
      logRes('SPF TXT @', spf);
    } catch (e) { console.error('❌ SPF error:', e.message || e); }

    // DKIM
    try {
      const dkimV = await getDKIM(domain);
      const dkim = await add(domain, 'TXT', 'default._domainkey', dkimV);
      logRes('DKIM TXT default._domainkey', dkim);
    } catch (e) { console.error('❌ DKIM error:', e.message || e); }

    // DMARC
    try {
      const dmarc = await add(domain, 'TXT', '_dmarc', `v=DMARC1;p=quarantine;rua=mailto:admin@${domain}`);
      logRes('DMARC TXT _dmarc', dmarc);
    } catch (e) { console.error('❌ DMARC error:', e.message || e); }

    console.log('Done.');
  } catch (e) {
    console.error('Failed:', e.message || e);
    process.exit(1);
  }
})();
