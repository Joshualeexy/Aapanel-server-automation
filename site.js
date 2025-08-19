const router = require('express').Router();
const { ap } = require('./aapanel');
const { patchNginxConf } = require('./nginx');

router.post('/add', async (req, res) => {
  const { domain, aliases = [], php = 'PHP-83' } = req.body;
  try {
    await ap('/site?action=AddSite', {
      domain: [domain, ...aliases].join('\n'),
      root: `/www/wwwroot/${domain}`,
      type: 'PHP', php, ftp:'false', db:'false'
    });
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

router.post('/ssl', async (req, res) => {
  const { domain, names, email } = req.body; // names: [domain, 'www.domain']
  try {
    await ap('/acme?action=Apply', { domain, domains: JSON.stringify(names), auth_type:'http', email });
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

router.post('/nginx-fix', async (req, res) => {
  const { domain } = req.body;
  try {
    const conf = await ap('/site?action=GetNginxConfig', { domain });
    const patched = patchNginxConf(conf?.config || '');
    if (patched !== conf?.config) {
      await ap('/site?action=SaveNginxConfig', { domain, config: patched });
      await ap('/system?action=ServiceAdmin', { name:'nginx', type:'reload' });
    }
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

module.exports = router;
