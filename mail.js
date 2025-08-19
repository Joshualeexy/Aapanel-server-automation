const router = require('express').Router();
const { ap } = require('./aapanel');

router.post('/domain', async (req, res) => {
  const { domain, a_record, quota_gb = 5, mailboxes = 50 } = req.body;
  try {
    await ap('/mailserver?action=AddDomain', { domain, a_record, dns_mode:'manual', quota_gb, mailboxes });
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

router.post('/dkim', async (req, res) => {
  const { domain } = req.body;
  try {
    const dkim = await ap('/mailserver?action=GetDKIM', { domain });
    res.json({ ok:true, dkim });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

router.post('/mailbox', async (req, res) => {
  const { domain, localPart, password, quota_gb = 5 } = req.body;
  try {
    await ap('/mailserver?action=AddMailbox', { domain, name: localPart, password, quota_gb, status:1 });
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
});

module.exports = router;
