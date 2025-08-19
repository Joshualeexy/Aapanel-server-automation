const router = require('express').Router();
router.get('/ping', (_,res)=>res.json({ok:true, ts:Date.now()}));
module.exports = router;
