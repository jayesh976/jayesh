// Builds a single self-contained HTML file (CSS, JS and images inlined) for a shareable preview page.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, VITE_PREVIEW: '1' } });

const out = 'preview-dist';
const html = readFileSync(join(out, 'index.html'), 'utf8');
const mime = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
const dataUris = {};
for (const f of readdirSync('public/assets')) {
  const ext = f.split('.').pop();
  if (mime[ext]) dataUris[`/assets/${f}`] = `data:${mime[ext]};base64,${readFileSync(join('public/assets', f)).toString('base64')}`;
}
dataUris['/favicon.png'] = `data:image/png;base64,${readFileSync('public/favicon.png').toString('base64')}`;
const embed = (text) => text.replace(/\/(assets\/[\w.-]+\.(?:png|webp|jpe?g)|favicon\.png)/g, (m) => dataUris[m] || m);

const cssFile = html.match(/href="\.?\/?(assets\/index-[\w-]+\.css)"/)[1];
const jsFile = html.match(/src="\.?\/?(assets\/index-[\w-]+\.js)"/)[1];
const css = embed(readFileSync(join(out, cssFile), 'utf8'));
const js = embed(readFileSync(join(out, jsFile), 'utf8')).replace(/<\/script/gi, '<\\/script');

const page = `<title>Shree Mahaganpati Website</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(join(out, 'shree-mahaganpati-preview.html'), page);
console.log(`preview: ${(page.length / 1024).toFixed(0)} KB`);
