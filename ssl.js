// ssl_install.js
// Usage: node ssl_install.js example.com

const ap = require('./aapanel');

(async () => {
    try {
        const domain = process.argv[2];
        if (!domain) {
            console.error("Usage: node ssl_install.js <domain>");
            process.exit(1);
        }

        // Build the aaPanel payload
        const payload = {
            auth_type: "http",                // always HTTP-01
            auto_wildcard: 0,                // no wildcard by default
            domains: JSON.stringify([domain]), // aaPanel expects JSON array
            deploy: 1                         // auto-install after issue
        };

        console.log(`Requesting SSL for: ${domain}`);
        const resp = await ap("/v2/ssl_domain?action=apply_new_ssl", payload);

        console.log("aaPanel response:", resp);

        if (resp && resp.status === 0) {
            console.log(`✅ SSL certificate requested & will auto-install for ${domain}`);
        } else {
            console.warn("⚠️ SSL request failed issue encountered check logs at ", resp.message.path);
        }
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
