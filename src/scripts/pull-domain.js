// pull-domain.js
const ap = require('../aapanel'); // loads dotenv internally

(async () => {
    try {
        const providerId = Number(process.env.AAPANEL_PROVIDER_CLOUDFLARE);

        if (!providerId) {
            throw new Error(`Missing or invalid provider Id in .env`);
        }

        await ap('/v2/ssl_domain?action=sync_dns_info', {
            id: providerId
        });

        console.log(
            `Pull completed. Provider=Cloudflare (id=${providerId}) synced into aaPanel.`
        );
    } catch (err) {
        console.error('Pull failed');

        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Body:', err.response.data);
        } else {
            console.error(err.message || err);
        }

        process.exit(1);
    }
})();
