const ap = require('../aapanel'); // your helper already loads dotenv

function baseFromDomain(host) {
  return (host.split('.')[0] || host).replace(/[^a-z0-9_]/g, '_');
}

function genPass(len = 18) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

(async () => {
  try {
    const [, , domain] = process.argv;
    if (!domain) {
      console.error('Usage: node site_add_v2.js <domain>');
      process.exit(1);
    }

    const host = domain;
    const base = baseFromDomain(host);

    // Always add www.<domain>
    const domainlist = [`www.${host}`];

    const webname = JSON.stringify({
      domain: `${host}\r`,
      domainlist,
      count: 0
    });

    const payload = {
      webname,
      port: 80,
      type: 'PHP',
      ps: base,
      path: `/www/wwwroot/${base}`,
      ftp: 'false',
      sql: 'MySQL',
      codeing: 'utf8',
      version: process.env.PHP_VERSION || '83',  // PHP version (default: 8.3)
      type_id: 0,
      set_ssl: 0,                 // let ssl.js handle SSL
      force_ssl: 0,               // force HTTPS will be done in ssl.js
      is_create_default_file: true,
      datauser: base,
      datapassword: genPass(18)
    };

    const res = await ap('/v2/site?action=AddSite', payload);
    console.log(`✅ AddSite OK, added ${host} and alias www.${host}`);
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
