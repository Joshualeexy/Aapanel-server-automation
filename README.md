# aapanel-deploy

A CLI tool to **fully automate domain provisioning** on [aaPanel](https://www.aapanel.com/). One command sets up your website, SSL, Nginx config, and email server.

---

## 🎯 What This Is

**aapanel-deploy** is a command-line automation tool that eliminates the repetitive, manual work of adding a new domain to your server. 

If you've ever had to:
- Log into aaPanel, click through menus to add a domain
- Wait for DNS to propagate, then manually request an SSL certificate
- Edit Nginx configs to fix compatibility issues
- Set up a mail domain, configure MX/SPF/DKIM/DMARC records
- Create a mailbox for the new domain

...then you know this process takes **15-30 minutes per domain**, and it's easy to forget a step.

**This tool does all of that in one command:**

```bash
aapanel-deploy example.com
```

Within 2-3 minutes, your domain is fully provisioned with:
- ✅ DNS records pointing to your server
- ✅ Website directory created and ready for files
- ✅ SSL certificate installed with Force HTTPS enabled
- ✅ Nginx config patched for compatibility
- ✅ Mail domain with all DNS records (MX, SPF, DKIM, DMARC)
- ✅ A working `support@example.com` mailbox

### The Logic Behind the Pipeline

Each step in the pipeline depends on the previous one:

1. **DNS First** — Without DNS, nothing else works. The domain must resolve to your server's IP before SSL can be issued or mail can be delivered.

2. **Website Second** — aaPanel needs a site entry before it can manage SSL certificates for that domain.

3. **SSL Third** — Let's Encrypt validates domain ownership via HTTP (port 80). Once the site exists and DNS resolves, SSL can be issued.

4. **Nginx Patch Fourth** — Some aaPanel versions add `listen 443 quic;` which causes errors on servers without HTTP/3 support. We remove it automatically.

5. **Mail Domain Fifth** — Uses the same SSL certificate from the website. The `automatic: 1` flag tells aaPanel's mail plugin to create all DNS records (MX, SPF, DKIM, DMARC) automatically.

6. **Mailbox Last** — Once the mail domain exists, we create a default `support@` mailbox for receiving emails.

If any step fails, you get a clear error message and the pipeline stops (except for mail SSL, which is non-blocking since DNS propagation can delay it).

---

## 🚫 What This Is NOT

This tool is **not for everyone**. Before you proceed, make sure you understand what this tool assumes:

### ❌ NOT for Shared Hosting Users
If you're on shared hosting (Bluehost, GoDaddy, Hostinger, etc.), you don't control the server. aaPanel isn't installed, and you can't run this tool. Use your hosting provider's control panel instead.

### ❌ NOT for Users Without aaPanel
This tool communicates directly with aaPanel's API. If you use a different panel (cPanel, Plesk, CyberPanel) or no panel at all, this won't work. The API endpoints are specific to aaPanel.

### ❌ NOT for External DNS Without Cloudflare Integration
If your DNS is managed by a provider other than Cloudflare (e.g., Route53, DigitalOcean DNS, Namecheap), and you haven't integrated it with aaPanel, the `--skipdns` flag won't fully work. Mail DNS records require write access to your DNS provider through aaPanel.

### ❌ NOT a "Set and Forget" Solution
You still need to:
- Upload your actual website files to `/www/wwwroot/<domain>/`
- Change the default mailbox password after creation
- Monitor SSL certificate renewals (aaPanel handles this, but check occasionally)

---

## 👤 Who This Is For

This tool is built for **system administrators, developers, and agencies** who:

- 🖥️ **Manage their own VPS/dedicated servers** — You have root access and aaPanel installed
- 🌐 **Run their own DNS infrastructure** — Either through aaPanel's DNS Manager or Cloudflare integrated with aaPanel
- 📧 **Host their own email** — Using aaPanel's Mail Server plugin instead of external services like Google Workspace
- 🔄 **Provision domains frequently** — Agencies adding client domains, SaaS platforms with custom domains, etc.
- ⏱️ **Value automation** — You'd rather run one command than click through 20 screens

### Ideal Setup

The tool works best when you control the full stack:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR VPS SERVER                      │
├─────────────────────────────────────────────────────────┤
│  aaPanel (Control Panel)                                │
│  ├── DNS Manager Plugin    ← Manages your DNS zones     │
│  ├── Nginx                 ← Serves your websites       │
│  ├── PHP 8.3               ← Runs your applications     │
│  ├── MySQL                 ← Stores your data           │
│  └── Mail Server Plugin    ← Handles email              │
├─────────────────────────────────────────────────────────┤
│  Your domains point NS records to this server           │
│  (ns1.yourdomain.com, ns2.yourdomain.com)               │
└─────────────────────────────────────────────────────────┘
```

If you use **Cloudflare** for DNS, that's also supported — just use `--skipdns` and ensure Cloudflare is integrated in aaPanel's provider list.

---

## ✨ Features

- 🌐 **DNS Management** — Adds domain to aaPanel DNS Manager (or syncs from Cloudflare)
- 🖥️ **Website Creation** — Creates site with PHP, MySQL database, and proper directory structure
- 🔒 **SSL Certificates** — Installs Let's Encrypt SSL with auto-renewal and Force HTTPS
- ⚙️ **Nginx Optimization** — Patches config to remove unsupported QUIC directives
- 📧 **Mail Server** — Adds mail domain with automatic DNS records (MX, SPF, DKIM, DMARC)
- 📬 **Mailbox Creation** — Creates `support@yourdomain.com` mailbox automatically

---

## 📋 Prerequisites

- **aaPanel** installed on your server with:
  - DNS Manager plugin (if managing DNS internally)
  - Mail Server plugin
  - Nginx web server
  - PHP 8.3 (or configure `PHP_VERSION` in `.env`)
- **Cloudflare** (optional) — If DNS is managed externally, use `--skipdns` flag
- **Node.js** v18+ installed

## 🚀 Installation

```bash
# Clone or download the project
cd addwebsite

# Install dependencies
npm install

# Install globally (optional)

## ⚙️ Configuration

Copy the `.env.example` file to `.env` and edit it with your server details:

# Server & admin (REQUIRED)
SERVER_PUBLIC_IP=123.45.67.89
LE_EMAIL=admin@yourdomain.com
ADMIN_TOKEN=000000

# DNS defaults (for internal DNS Manager)
DEFAULT_NS1=ns1.yourdomain.com
DEFAULT_NS2=ns2.yourdomain.com
DEFAULT_SOA=ns1.yourdomain.com
DNS_DEFAULT_TTL=600

# Provider IDs (check aaPanel → SSL → DNS Providers)
AAPANEL_PROVIDER_CLOUDFLARE=1
AAPANEL_PROVIDER_DNS_MANAGER=2

# Site defaults
PHP_VERSION=83

# Mail domain defaults
MAIL_DOMAIN_QUOTA_GB=1
MAIL_MAX_MAILBOXES=50

# Mailbox defaults
MAILBOX_QUOTA=500 MB
```

### Finding Your aaPanel API Key

1. Log into aaPanel
2. Go to **Settings** → **API**
3. Enable API and copy the key

### Finding Provider IDs

1. Go to **Domains**  → **Provider List**
2. The ID is usually order of addition/integration shown next to each provider (usually Cloudflare=1 if added first)

## 📖 Usage

### Basic Usage (Internal DNS)

```bash
aapanel-deploy example.com
```

This runs the full pipeline:
1. Adds domain to DNS Manager
2. Creates website (`/www/wwwroot/example/`)
3. Installs SSL certificate
4. Patches Nginx config
5. Adds mail domain with automatic DNS
6. Creates `support@example.com` mailbox

### External DNS (Cloudflare) support only if not using cloudflare somethings may fail eg mail domain wont be added cause dns cant be written.

```bash
aapanel-deploy example.com --skipdns
```

When `--skipdns` is used:
- Skips DNS Manager creation
- Syncs all domains from Cloudflare into aaPanel
- Continues with website, SSL, and mail setup

## 🔧 Individual Scripts

You can run each step independently:

| Script | Description |
|--------|-------------|
| `node src/scripts/dns.js <domain>` | Add domain to DNS Manager |
| `node src/scripts/pull-domain.js` | Sync Cloudflare domains to aaPanel |
| `node src/scripts/site.js <domain>` | Create website |
| `node src/scripts/ssl.js <domain>` | Install Let's Encrypt SSL |
| `node src/scripts/editconfig.js <domain>` | Remove QUIC from Nginx config |
| `node src/scripts/mail.js <domain>` | Add mail domain + deploy SSL |
| `node src/scripts/mailbox.js <domain>` | Create support@ mailbox |

## 📁 Project Structure

```
addwebsite/
├── bin/
│   └── aapanel-deploy      # CLI entry point
├── src/
│   ├── aapanel.js          # aaPanel API client
│   └── scripts/
│       ├── dns.js          # DNS Manager integration
│       ├── pull-domain.js  # Cloudflare sync
│       ├── site.js         # Website creation
│       ├── ssl.js          # SSL installation
│       ├── editconfig.js   # Nginx patching
│       ├── mail.js         # Mail domain + SSL
│       └── mailbox.js      # Mailbox creation
├── index.js                # Main orchestrator
├── .env                    # Configuration
├── .env.example            # Configuration template
└── package.json
```

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    aapanel-deploy <domain>                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      [--skipdns NOT set]             [--skipdns set]
              │                               │
              ▼                               ▼
        ┌─────────┐                  ┌────────────────┐
        │ dns.js  │                  │ pull-domain.js │
        └────┬────┘                  └───────┬────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                        ┌──────────┐
                        │ site.js  │
                        └────┬─────┘
                              ▼
                        ┌──────────┐
                        │ ssl.js   │
                        └────┬─────┘
                              ▼
                      ┌──────────────┐
                      │ editconfig.js│
                      └──────┬───────┘
                              ▼
                        ┌──────────┐
                        │ mail.js  │ (non-blocking)
                        └────┬─────┘
                              ▼
                       ┌───────────┐
                       │ mailbox.js│
                       └─────┬─────┘
                              ▼
                    🎉 Provisioning Complete
```

## 🔐 Mail Credentials

After provisioning, the mailbox is created with:

| Field | Value |
|-------|-------|
| **Email** | `support@<domain>` |
| **Password** | `<Domain>2026$$` (e.g., `Example2026$$`) |
| **Quota** | 500 MB (configurable) |

> ⚠️ **Note**: Change the password after first login!

## 🐛 Troubleshooting

### SSL Certificate Fails
- Ensure DNS is propagated (use `dig A yourdomain.com`)
- Check that port 80 is open for HTTP-01 validation

### Mail SSL Not Installed
- Website SSL must be installed first
- The script will continue and create the mailbox anyway
- Re-run command after SSL propagates

### Cloudflare Sync Fails
- Verify `AAPANEL_PROVIDER_CLOUDFLARE` ID is correct
- Ensure Cloudflare is configured in aaPanel

### "AAPANEL_URL is not configured"
- Check that `.env` file exists in the project root
- Verify the URL includes the port (e.g., `https://panel.example.com:8888`)

## 📄 License

ISC

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.
