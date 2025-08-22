// editconfig.js
// Usage: node editconfig.js <domain>
//
// Uses aaPanel files API:
//   POST /files?action=GetFileBody  { path }
//   POST /files?action=SaveFileBody { path, data, encoding }

const ap = require("../aapanel"); 

function getConfPath(domain) {
  if (!/^[a-z0-9.-]+$/i.test(domain)) {
    throw new Error("Invalid domain format.");
  }
  return `/www/server/panel/vhost/nginx/${domain}.conf`;
}

(async () => {
  try {
    const domain = (process.argv[2] || "").trim().toLowerCase();
    if (!domain) {
      console.error("Usage: node editconfig.js <domain>");
      process.exit(1);
    }

    const confPath = getConfPath(domain);
    console.log(`Reading Nginx conf via aaPanel API: ${confPath}`);

    // 1) Fetch current config
    const getResp = await ap("/files?action=GetFileBody", { path: confPath });
    if (!getResp || typeof getResp.data !== "string") {
      throw new Error("Unexpected response from GetFileBody (missing config data).");
    }
    const original = getResp.data;

    // 2) Remove "listen 443 quic;" lines
    const pattern = /(^|\n)\s*listen\s+443\s+quic;\s*\n/gi;
    const updated = original.replace(pattern, "\n");
    const removed = (original.match(pattern) || []).length;

    if (removed === 0) {
      console.log("No 'listen 443 quic;' line found. Nothing to change.");
      process.exit(0);
    }

    // 3) Save updated config with UTF-8 encoding
    console.log(`Removing ${removed} occurrence(s) and saving...`);
    const saveResp = await ap("/files?action=SaveFileBody", {
      path: confPath,
      data: updated,
      encoding: "utf-8"
    });

    if (saveResp && (saveResp.status === true || saveResp.success === true || saveResp.data === "ok")) {
      console.log("✅ QUIC removed successfully. File saved.");
    } else {
      console.log("ℹ️ Save response:", saveResp);
      console.log("⚠️ Check aaPanel logs if config didn’t update.");
    }
  } catch (err) {
    console.error("❌ Failed to remove QUIC line.");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Body:", err.response.data);
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
})();
