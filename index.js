const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const {
  AAPANEL_URL, AAPANEL_API_KEY, SERVER_PUBLIC_IP,
  LE_EMAIL, ADMIN_TOKEN, DEFAULT_NS1, DEFAULT_NS2
} = process.env;

const app = express();

// Enable CORS (adjust origin for your React frontend)
app.use(cors({
  origin: ['http://localhost:3000',"http://localhost:5173"],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-admin-token']
}));

app.use(express.json());

// Simple API auth
app.use((req, res, next) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

// aaPanel API helper
async function ap(path, data = {}) {
  const url = `${AAPANEL_URL}${path}`;
  const body = { request_token: AAPANEL_API_KEY, ...data };
  const r = await axios.post(url, body, { timeout: 45000, validateStatus: s => s < 500 });
  if (r.status >= 400) throw new Error(`aaPanel HTTP ${r.status}: ${r.data?.msg || r.statusText}`);
  if (r.data && r.data.status === false) throw new Error(`aaPanel error: ${r.data.msg || 'unknown'}`);
  return r.data;
}

// Nginx QUIC/default fix
function patchNginxConf(text) {
  return text
    .replace(/listen\s+443\s+ssl\s+http2\s+default_server;?/g, 'listen 443 ssl http2;')
    .replace(/listen\s+443\s+quic;?/g, '');
}

app.post('/api/provision', async (req, res) => {
  const { domain, phpVersion = 'PHP-83', createDb = false, createMailbox = false, mailboxName } = req.body;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return res.status(400).json({ error: 'invalid domain' });

  const www = `www.${domain}`;
  const mailHost = `mail.${domain}`;
  const summary = { domain, steps: [] };

  try {
    // 1) DNS
    await ap('/dns?action=AddDomain', { domain, ip: SERVER_PUBLIC_IP, ns1: DEFAULT_NS1, ns2: DEFAULT_NS2 });
    await ap('/dns?action=AddRecord', { domain, name: '@', type: 'A', value: SERVER_PUBLIC_IP, ttl: 300 });
    await ap('/dns?action=AddRecord', { domain, name: 'www', type: 'A', value: SERVER_PUBLIC_IP, ttl: 300 });
    await ap('/dns?action=AddRecord', { domain, name: 'mail', type: 'A', value: SERVER_PUBLIC_IP, ttl: 300 });
    await ap('/dns?action=AddRecord', { domain, name: '@', type: 'MX', value: `${mailHost}.`, mx: 10, ttl: 300 });
    await ap('/dns?action=AddRecord', { domain, name: '@', type: 'TXT', value: 'v=spf1 a mx ~all', ttl: 300 });
    summary.steps.push('dns');

    // 2) Website
    await ap('/site?action=AddSite', {
      domain: `${domain}\n${www}`,
      root: `/www/wwwroot/${domain}`,
      type: 'PHP',
      php: phpVersion,
      ftp: 'false', db: 'false'
    });
    summary.steps.push('site.add');

    await ap('/acme?action=Apply', {
      domain, domains: JSON.stringify([domain, www]),
      auth_type: 'http', email: LE_EMAIL
    });
    summary.steps.push('ssl.apply');

    const confGet = await ap('/site?action=GetNginxConfig', { domain });
    const patched = patchNginxConf(confGet?.config || '');
    if (patched !== confGet?.config) {S
      await ap('/site?action=SaveNginxConfig', { domain, config: patched });
      await ap('/system?action=ServiceAdmin', { name: 'nginx', type: 'reload' });
      summary.steps.push('nginx.patch+reload');
    }

    // 3) Mail domain
    await ap('/mailserver?action=AddDomain', { domain, a_record: mailHost, dns_mode: 'manual', quota_gb: 5, mailboxes: 50 });
    const dkim = await ap('/mailserver?action=GetDKIM', { domain });
    if (dkim?.public_key) {
      await ap('/dns?action=AddRecord', { domain, name: 'default._domainkey', type: 'TXT', value: dkim.public_key, ttl: 300 });
    }
    await ap('/dns?action=AddRecord', { domain, name: '_dmarc', type: 'TXT', value: `v=DMARC1; p=none; rua=mailto:postmaster@${domain}`, ttl: 300 });
    summary.steps.push('mail.domain+dkim+dmarc');

    // 4) Database
    if (createDb) {
      const base = domain.replace(/\W/g, '').slice(0, 16);
      const dbName = base;
      const dbUser = (base + '_u').slice(0, 16);
      const dbPass = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      await ap('/database?action=AddDatabase', { name: dbName, db_user: dbUser, password: dbPass, access: '127.0.0.1' });
      summary.db = { dbName, dbUser, dbPass };
      summary.steps.push('db.create');
    }

    // 5) Mailbox
    if (createMailbox) {
      const localPart = mailboxName || 'admin';
      const mailbox = `${localPart}@${domain}`;
      const pass = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      await ap('/mailserver?action=AddMailbox', { domain, name: localPart, password: pass, quota_gb: 5, status: 1 });
      summary.mailbox = { mailbox, pass };
      summary.steps.push('mailbox.create');
    }

    res.json({ ok: true, summary });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message, summary });
  }
});

app.listen(4000, () => console.log('Provision API running on :4000'));
