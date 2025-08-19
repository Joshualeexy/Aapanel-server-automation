// nginx.js
require('dotenv').config();
const { ap } = require('./aapanel');

/**
 * Patch the Nginx config for a given domain.
 * @param {string} domain - Domain name (e.g. example.com)
 * @param {string} find - String to find in the config (optional)
 * @param {string} replace - String to replace with (optional)
 */
async function patchNginxConf(domain, find, replace) {
  // 1. Fetch current Nginx config from aaPanel
  const getResp = await ap('/site?action=GetSiteConfig', { siteName: domain });
  if (!getResp?.nginx) {
    throw new Error(`Failed to get Nginx config for ${domain}`);
  }

  let conf = getResp.nginx;

  // 2. Modify config (if find/replace provided)
  if (find && replace) {
    conf = conf.replace(find, replace);
  }

  // 3. Save updated config back to aaPanel
  const saveResp = await ap('/site?action=SaveFileBody', {
    path: getResp.path,
    data: conf
  });

  return saveResp;
}

module.exports = { patchNginxConf };
