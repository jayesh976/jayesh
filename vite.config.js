import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const PAGES = ['/', '/about', '/products', '/services', '/industries', '/how-we-work', '/contact'];

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
    plugins: [react(), seoFiles(env.VITE_SITE_URL || 'https://www.example.com')],
    build: env.VITE_PREVIEW
      ? { outDir: 'preview-dist', assetsInlineLimit: 0, rollupOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
    server: { port: 3000, host: true },
    preview: { port: 3000, host: true },
  };
});
