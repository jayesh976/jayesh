import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { COMPANY, FOOTER_NAV, NAV, whatsappLink } from '../data.js';
import { Arrow, Chat, MenuIcon } from './Icons.jsx';

function isCurrent(href, location) {
  const [path, hash] = href.split('#');
  if (hash) return location.pathname === path && location.hash === `#${hash}`;
  if (path === '/about') return location.pathname === '/about' && location.hash !== '#founder';
  return location.pathname === path;
}

function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = NAV.map(([label, href]) => ({ label, href, current: isCurrent(href, location) ? 'page' : undefined }));
  const contactCurrent = location.pathname === '/contact' ? 'page' : undefined;

  return (
    <header data-print-hide className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap header-bar">
        <Link to="/" className="brand" aria-label="Shree Mahaganpati Enterprises — Home">
          <img src="/assets/logo-mark.png" alt="" width="50" height="44" />
          <span className="brand-text">
            <span className="sm">SHREE</span>
            <span className="lg">MAHAGANPATI</span>
            <span className="sm">ENTERPRISES</span>
          </span>
        </Link>
        <div className="desk-nav">
          <nav aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="nav-link" aria-current={l.current}>{l.label}</Link>
            ))}
          </nav>
          <Link to="/contact" className="nav-cta" aria-current={contactCurrent}>Contact Us<Arrow /></Link>
        </div>
        <button type="button" className="burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
          <MenuIcon open={open} />
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Main">
          {[...links, { label: 'Contact Us', href: '/contact', current: contactCurrent }].map((l) => (
            <Link key={l.href} to={l.href} className="m-link" aria-current={l.current}>{l.label}</Link>
          ))}
          <Link to="/contact" className="btn btn-primary">Send Your Requirement<Arrow /></Link>
        </nav>
      )}
    </header>
  );
}

function CtaBand() {
  return (
    <section data-screen-label="CTA band" className="cta-band">
      <div className="wrap pad-intro grid items-end" style={{ '--min': '420px', '--gap': '32px 72px' }}>
        <h2>Have a requirement? Send us the material, quantity and specification.</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/contact" className="btn btn-white">Send Your Requirement<Arrow size={18} /></Link>
          <a href={`tel:${COMPANY.phoneTel}`} className="btn btn-ghost-dark">Call {COMPANY.phoneDisplay}</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="stack g14">
          <picture>
            <source srcSet="/assets/logo-full.webp" type="image/webp" />
            <img src="/assets/logo-full.png" alt="Shree Mahaganpati Enterprises logo" width="160" height="160" loading="lazy" className="footer-logo" />
          </picture>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{COMPANY.slogan}</p>
        </div>
        <nav aria-label="Footer" className="stack g10" style={{ fontSize: 14 }}>
          {FOOTER_NAV.map(([label, href]) => <Link key={href} to={href}>{label}</Link>)}
        </nav>
        <div className="stack g10" style={{ fontSize: 14, lineHeight: 1.6 }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>{COMPANY.contact}</span>
          <a href={`tel:${COMPANY.phoneTel}`}>{COMPANY.phoneDisplay}</a>
          <a href={`mailto:${COMPANY.email}`} style={{ wordBreak: 'break-all' }}>{COMPANY.email}</a>
        </div>
        <address style={{ fontStyle: 'normal', fontSize: 14, lineHeight: 1.6 }}>
          {COMPANY.addressLines.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}
        </address>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Shree Mahaganpati Enterprises</span>
        <span>Industrial supplier · Pune &amp; all over India</span>
      </div>
    </footer>
  );
}

function useScrollOnNavigate() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0, timer;
    const go = () => {
      const el = document.getElementById(id);
      if (!el) { if (++tries < 20) timer = setTimeout(go, 50); return; }
      // Entry animations translate sections, which would skew the measured position.
      document.getElementById('main')?.getAnimations?.({ subtree: true })
        .filter((a) => a.animationName === 'pageIn' || a.animationName === 'secIn')
        .forEach((a) => a.finish());
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
      if (el.classList.contains('product')) {
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      }
    };
    go();
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);
}

export default function Layout() {
  const { pathname } = useLocation();
  useScrollOnNavigate();
  return (
    <div className="app">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      {import.meta.env.VITE_PREVIEW && (
        <p className="preview-bar">Preview only. Stock photos, the contact form and the admin panel work once the site is live at www.shreemahaganpatienterprises.org.</p>
      )}
      <Header />
      <main id="main" key={pathname} className="page-enter" tabIndex={-1}>
        <Outlet />
        {pathname !== '/contact' && <CtaBand />}
      </main>
      <Footer />
      <a data-print-hide href={whatsappLink()} target="_blank" rel="noopener" aria-label="Chat on WhatsApp" className="wa-float">
        <Chat />
        <span>WhatsApp</span>
      </a>
    </div>
  );
}
