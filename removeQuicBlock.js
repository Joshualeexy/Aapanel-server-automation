function patchNginxConf(text) {
  return (text || '')
    .replace(/listen\s+443\s+ssl\s+http2\s+default_server;?/g, 'listen 443 ssl http2;')
    .replace(/listen\s+443\s+quic;?/g, '');
}
module.exports = { patchNginxConf };