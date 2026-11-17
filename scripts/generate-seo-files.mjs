
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);

  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/
    );

    if (!match) continue;

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) continue;

    process.env[key] = rawValue
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.production");
loadEnvFile(".env");

const rawSiteUrl =
  process.env.SITE_URL || process.env.VITE_SITE_URL;

if (!rawSiteUrl) {
  throw new Error(
    "SITE_URL is required. Set it to your production website URL."
  );
}

let siteUrl;

try {
  const parsed = new URL(rawSiteUrl);

  if (
    parsed.protocol !== "https:" &&
    parsed.hostname !== "localhost"
  ) {
    throw new Error("Production SITE_URL must use HTTPS.");
  }

  siteUrl = parsed.origin;
} catch (error) {
  throw new Error(`Invalid SITE_URL: ${error.message}`);
}

const publicPages = [
  "/",
  "/privacy-policy",
  "/terms",
  "/tools",
];

const sitemapItems = publicPages
  .map(
    (route) => `
  <url>
    <loc>${siteUrl}${route}</loc>
  </url>`
  )
  .join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems}
</urlset>
`;

const robots = `User-agent: *
Allow: /

# Authentication
Disallow: /login
Disallow: /signup
Disallow: /reset-password

# Platform administration
Disallow: /admin

# Protected business application
Disallow: /dashboard
Disallow: /customers
Disallow: /deliveries
Disallow: /groups
Disallow: /products
Disallow: /jars
Disallow: /imports
Disallow: /load-unload
Disallow: /routes
Disallow: /events
Disallow: /payments
Disallow: /employee-payments
Disallow: /ledger
Disallow: /invoices
Disallow: /expenses
Disallow: /wallet-transactions
Disallow: /monthly-card
Disallow: /employees
Disallow: /leaves
Disallow: /reports
Disallow: /sms
Disallow: /whatsapp
Disallow: /subscription

# Unpublished placeholder content
Disallow: /blog

Sitemap: ${siteUrl}/sitemap.xml
`;

const publicDir = path.join(root, "public");

fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  sitemap.trim() + "\n",
  "utf8"
);

fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  robots,
  "utf8"
);

console.log("SEO files generated successfully.");
console.log(`Sitemap: ${siteUrl}/sitemap.xml`);
console.log(`Robots: ${siteUrl}/robots.txt`);
