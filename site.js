const ap = require('./aapanel'); // your helper already loads dotenv

function baseFromDomain(host) {
  return (host.split('.')[0] || host).replace(/[^a-z0-9_]/g, '_');
}

function genPass(len = 18) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  let s = ''; for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

(async () => {
  try {
    const [, , domain, ...aliases] = process.argv;
    if (!domain) {
      console.error('Usage: node site_add_v2.js <domain> [alias1 alias2 ...]');
      process.exit(1);
    }

    const host = domain;
    const base = baseFromDomain(host);

    const webname = JSON.stringify({
      domain: `${host}\r`,
      domainlist: [],
      count: 0
    });

    const payload = {
      webname,
      port: 80,
      type: 'PHP',
      ps: base,                             // description = domain without extension
      path: `/www/wwwroot/${base}`,         // site dir based on base name
      ftp: 'false',
      sql: 'MySQL',                                                                                            // create DB
      codeing: 'utf8',
      version: '83',                        // PHP 8.3 (v2 expects number string)
      type_id: 0,
      set_ssl: 0,
      force_ssl: 0,
      is_create_default_file: true,
      datauser: base,       // db user
      datapassword: genPass(18)             // db pass
    };

    const res = await ap('/v2/site?action=AddSite', payload);
    console.log('✅ AddSite OK added', host);
    console.log('Response:', res);
  } catch (err) {
    console.error('❌ AddSite failed');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', err.response.data);
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
})();
