import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPANY, PRODUCTS, SERVICES, INDUSTRIES, STEPS } from './src/data.js';

const PAGES = ['/', '/about', '/products', '/services', '/industries', '/how-we-work', '/contact'];

const NAV = [['Home', '/'], ['About', '/about'], ['Products', '/products'], ['Services', '/services'], ['Industries', '/industries'], ['How We Work', '/how-we-work'], ['Contact', '/contact']];
const li = (items) => `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
const PAGE_CONTENT = {
  '/': { title: 'Industrial Suppliers & Business Solutions | Shree Mahaganpati Enterprises', description: 'Shree Mahaganpati Enterprises supplies industrial fasteners, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery and construction materials, with sourcing and supply support.', h1: 'Industrial Solutions. Connected. Coordinated. Delivered.', body: `<p>Shree Mahaganpati Enterprises is an industrial supplier and end-to-end business service partner based in Shirur, Pune, supplying across India. ${COMPANY.slogan}.</p><h2>We supply these categories</h2>${li(PRODUCTS.map((p) => p.name))}<h2>Services</h2>${li(SERVICES.map((x) => x.name))}` },
  '/about': { title: 'About Us & Founder Om Jagtap | Shree Mahaganpati Enterprises', description: 'Industrial supplier based at Pabal Phata, Shirur, Pune. Founded by Om Jagtap, with a background in wooden pallet manufacturing.', h1: 'About Shree Mahaganpati Enterprises', body: '<p>We are an industrial supplier based at Pabal Phata, Shirur, Pune. The business grew out of wooden pallet manufacturing and now supplies fasteners, cotton waste, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery, construction material and safety products.</p><h2>Founder: Mr Om Jagtap</h2><p>Om Jagtap has a background in wooden pallet manufacturing and experience in building and developing the business.</p>' },
  '/products': { title: 'Industrial Supplies: Fasteners, Pallets, Packaging & More | Shree Mahaganpati Enterprises', description: 'Fasteners, cotton waste, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery, construction material and safety products, sourced to your requirement.', h1: 'Industrial supplies, sourced to your requirement', body: PRODUCTS.map((p) => `<h2>${p.name}</h2><p>${p.long}</p>`).join('') },
  '/services': { title: 'Sourcing, Procurement & Supply Services | Shree Mahaganpati Enterprises', description: 'Sourcing, vendor coordination, procurement support, project coordination, supply & logistics and custom requirement management for businesses in Pune and across India.', h1: 'Sourcing, coordination and supply, managed end to end', body: SERVICES.map((x) => `<h2>${x.name}</h2><p>${x.desc}</p>`).join('') },
  '/industries': { title: 'Industries We Supply | Shree Mahaganpati Enterprises', description: 'Industrial supplies for engineering and manufacturing, automotive, construction and infrastructure, energy and utilities, and commercial businesses across India.', h1: 'Industries we supply', body: INDUSTRIES.map((x) => `<h2>${x.name}</h2><p>${x.desc}</p><p>Relevant supplies: ${x.supplies}</p>`).join('') },
  '/how-we-work': { title: 'How We Work | Shree Mahaganpati Enterprises', description: 'A clear four-step process from requirement to delivery: understand the requirement, source the solution, coordinate vendors and deliver with follow-up support.', h1: 'A clear process from requirement to delivery', body: STEPS.map((x) => `<h2>${x.name}</h2><p>${x.long}</p>`).join('') },
  '/contact': { title: 'Contact & Send Your Requirement | Shree Mahaganpati Enterprises', description: `Send your industrial supply requirement to Shree Mahaganpati Enterprises, Shirur, Pune. Call ${COMPANY.phoneDisplay} or email ${COMPANY.email}.`, h1: 'Send your requirement', body: `<p>Contact person: ${COMPANY.contact}. Phone: ${COMPANY.phoneDisplay}. Email: ${COMPANY.email}.</p><address>${COMPANY.addressLines.join(' ')}</address>` },
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Writes one static HTML file per page (about.html, products.html, ...) so search engines
// see unique titles and real content without running JavaScript. React replaces it on load.
function prerender(siteUrl) {
  return {
    name: 'prerender-pages',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir;
      const base = siteUrl.replace(/\/$/, '');
      const template = readFileSync(join(dir, 'index.html'), 'utf8');
      for (const [path, c] of Object.entries(PAGE_CONTENT)) {
        const url = base + path;
        let html = template
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(c.description)}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(c.title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(c.description)}$2`)
          .replace('</head>', `    <meta property="og:url" content="${url}" />\n    <link rel="canonical" href="${url}" />\n  </head>`);
        const nav = NAV.map(([l, h]) => `<a href="${h}">${l}</a>`).join(' | ');
        const shell = `<div class="sr-only"><nav aria-label="Main">${nav}</nav><main><h1>${esc(c.h1)}</h1>${c.body}</main></div>`;
        html = html.replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
        if (path === '/') writeFileSync(join(dir, 'index.html'), html);
        else writeFileSync(join(dir, `${path.slice(1)}.html`), html);
      }
    },
  };
}

// Writes sitemap.xml and robots.txt with absolute URLs for the configured production domain.
function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const base = siteUrl.replace(/\/$/, '');
      const today = new Date().toISOString().slice(0, 10);
      const urls = PAGES.map((p) => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), seoFiles(env.VITE_SITE_URL || 'https://www.example.com'), ...(env.VITE_PREVIEW ? [] : [prerender(env.VITE_SITE_URL || 'https://www.example.com')])],
    build: env.VITE_PREVIEW
      ? { outDir: 'preview-dist', assetsInlineLimit: 0, rollupOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
    server: { port: 3000, host: true },
    preview: { port: 3000, host: true },
  };
});
