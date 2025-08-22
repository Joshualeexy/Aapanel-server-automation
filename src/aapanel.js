// aaPanel client (CommonJS)
const crypto = require('crypto');
const axios = require('axios');
const md5 = (s) => crypto.createHash('md5').update(String(s)).digest('hex');

function sign(apiKey) {
    const request_time = Math.floor(Date.now() / 1000);
    const request_token = md5(String(request_time) + md5(apiKey));
    return { request_time: String(request_time), request_token };
}

function normalizeEndpoint(ep) {
    if (!ep) throw new Error('endpoint is required');
    return ep.startsWith('/') ? ep : `/${ep}`;
}

function toForm(data) {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(data || {})) {
        if (v !== undefined && v !== null) body.append(k, String(v));
    }
    return body;
}

/**
 * Call an aaPanel API endpoint.
 *
 * @param {string} endpoint - e.g. '/system/get_server_info'
 * @param {object} data - extra form fields required by the endpoint
 * @param {object} opts - { baseURL, apiKey, timeout, axios: { ...axiosConfig } }
 */
async function ap(endpoint, data = {}, opts = {}) {
    const baseURL = process.env.AAPANEL_URL.replace(/\/$/, '');
    const apiKey = process.env.AAPANEL_API_KEY;


    const url = baseURL + normalizeEndpoint(endpoint);
    const sig = sign(apiKey);
    const body = toForm({ ...sig, ...data });

    const r = await axios.post(url, body, {
        timeout: opts.timeout ?? 45_000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        validateStatus: (s) => s < 500,
    });

    if (r.status >= 400) {
        const msg = r.data?.msg || r.statusText || r;
        throw new Error(`aaPanel HTTP ${r.status}: ${msg}`);
    }

    const payload = r.data;
    if (payload && payload.status === false) {
        const err = new Error(`aaPanel error: ${payload.msg || payload}`);
        err.code = payload.code;
        throw err;
    }

    return payload;
}

module.exports = ap 