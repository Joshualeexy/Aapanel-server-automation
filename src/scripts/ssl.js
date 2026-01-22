// ssl.js
// Usage: node ssl.js example.com

const ap = require('../aapanel');

(async () => {
    try {
        const domain = process.argv[2];
        if (!domain) {
            console.error("Usage: node ssl_install.js <domain>");
            process.exit(1);
        }

        // Include both domain and www.domain
        const domains = [domain, `www.${domain}`];

        // Build the aaPanel payload
        const payload = {
            auth_type: "http",                     // always HTTP-01
            auto_wildcard: 0,                      // no wildcard by default
            domains: JSON.stringify(domains),      // pass both domains
            deploy: 1                              // auto-install after issue
        };

        console.log(`Requesting SSL for: ${domains.join(', ')}`);
        const resp = await ap("/v2/ssl_domain?action=apply_new_ssl", payload);

        console.log("aaPanel response:", resp);

        if (resp && resp.status === 0) {
            console.log(`✅ SSL certificate requested & will auto-install for ${domains.join(', ')}`);

        } else {
            console.warn("⚠️ SSL request failed. Check logs:", resp.message?.path || resp);
        }

        // Wait a few seconds to let aaPanel apply SSL
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Enable Force HTTPS only for the base domain
        console.log("Enabling Force HTTPS...");
        const forceResp = await ap("/v2/site?action=HttpToHttps", { siteName: domain });
        console.log("Force HTTPS response:", forceResp);

        // Also apply for www.domain if it's a separate site
        const wwwDomain = `www.${domain}`;
        console.log("Enabling Force HTTPS for:", wwwDomain);
        const forceRespWww = await ap("/v2/site?action=HttpToHttps", { siteName: wwwDomain });
        console.log("Force HTTPS response (www):", forceRespWww);

    } catch (err) {
        console.error("❌ SSL installation failed");
        if (err.response) {
            console.error("Body:", err.response);
        } else {
            console.error(err);
        }
        process.exit(1);
    }
})();
