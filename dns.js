// dns.js
const ap = require('./aapanel');  // loads dotenv internally

(async () => {
  try {
    const domain = process.argv[2];
    if (!domain) throw new Error("Usage: node dns.js <domain>");

    const resp = await ap('/plugin?action=a&name=dns_manager&s=add_domain', {
      domain,
      domain_ip: process.env.SERVER_PUBLIC_IP,
      soa: process.env.DEFAULT_SOA,
      ns1domain: process.env.DEFAULT_NS1,
      ns2domain: process.env.DEFAULT_NS2
    });

    console.log("Added domain:", domain);
    console.log("aaPanel response:", resp);
  } catch (err) {
    console.error("Failed to add domain");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Body:", err.response.data);
    } else {
      console.error(err);
    }
  }
})();
