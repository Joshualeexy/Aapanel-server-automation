const { ap } = require('./aapanel');
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain is required' });

    const resp = await ap('/plugin?action=a&name=dns_manager&s=add_domain', {
      domain,
      ip: process.env.SERVER_PUBLIC_IP,
      ns1: process.env.DEFAULT_NS1,
      ns2: process.env.DEFAULT_NS2,
      soa: process.env.DEFAULT_SOA
    });

    res.json({ ok: true, domain, aapanel: resp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to add domain' });
  }
});

module.exports = router;
