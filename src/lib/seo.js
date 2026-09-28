import { useEffect } from 'react';

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageMeta({ title, description, path, crumb, noindex = false, schema }) {
  useEffect(() => {
    const url = SITE_URL + path;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', `${SITE_URL}/assets/industrial-technology-network-hero.jpeg`);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setLink('canonical', url);

    const graph = [];
    if (crumb) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: crumb, item: url },
        ],
      });
    }
    if (schema) graph.push(...schema(SITE_URL));
    let script = document.getElementById('page-jsonld');
    if (graph.length) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'page-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, crumb, noindex, schema]);
}
