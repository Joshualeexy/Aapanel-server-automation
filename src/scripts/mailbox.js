// mailbox.js
// Creates support@<domain> mailbox via aaPanel mail_sys (v2).
// Full name: "<DomainNoTLD> Support" (Capitalized)
// Quota: 500 MB, is_admin: 0, active: 1, quota_active: 1
// Password: <CapitalizedDomainNoTLD><YEAR>$$

const ap = require('../aapanel');

function baseFromDomain(domain) {
    return domain.trim().toLowerCase().replace(/^www\./, '').split('.')[0];
}
function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

(async () => {
    try {
        const domain = process.argv[2];
        if (!domain) throw new Error('Usage: node mailbox.js <domain>');

        const base = capFirst(baseFromDomain(domain));
        const year = new Date().getFullYear();

        const payload = {
            full_name: `${base} Support`,
            quota: process.env.MAILBOX_QUOTA || '500 MB',
            is_admin: 0,
            username: `support@${domain}`,
            password: `${base}${year}$$`,
            active: 1,
            quota_active: 1
        };

        const res = await ap('/v2/plugin?action=a&name=mail_sys&s=add_mailbox_v2', payload);

        const ok = res && res.status !== -1 && !/fail|error/i.test(JSON.stringify(res));
        if (ok) {
            console.log('✅ Mailbox created:', {
                username: payload.username,
                full_name: payload.full_name,
                quota: payload.quota,
                is_admin: payload.is_admin
            });
            console.log('aaPanel response:', res);
        } else {
            console.error('❌ Mailbox create failed:', res);
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Error:', e.message || e);
        process.exit(1);
    }
})();
