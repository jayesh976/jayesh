import { Link, useNavigate } from 'react-router-dom';
import HeroVisual from '../components/HeroVisual.jsx';
import Orbit from '../components/Orbit.jsx';
import Photo from '../components/Photo.jsx';
import { Arrow } from '../components/Icons.jsx';
import { COMPANY, INDUSTRIES, PRODUCTS, SERVICES, STEPS } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

export default function Home() {
  const navigate = useNavigate();
  usePageMeta({
    title: 'Industrial Suppliers & Business Solutions | Shree Mahaganpati Enterprises',
    description: 'Shree Mahaganpati Enterprises supplies industrial fasteners, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery and construction materials, with sourcing and supply support.',
    path: '/',
  });

  return (
    <>
      <section data-screen-label="Home — Hero" className="hero">
        <div style={{ position: 'absolute', inset: 0 }}><HeroVisual /></div>
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="eyebrow light">Industrial Supplier · Shirur, Pune · Supplying across India</p>
            <h1>Industrial Solutions. Connected. Coordinated. Delivered.</h1>
            <p className="sub">Your end-to-end industrial and business service partner. We source, coordinate and supply the materials your operations run on, from fasteners and packaging to wooden pallets and construction material.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/contact" className="btn btn-primary">Send Your Requirement<Arrow size={18} /></Link>
              <Link to="/products" className="btn btn-ghost-light">Explore Our Products &amp; Services</Link>
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="Home — Positioning" className="bb">
        <div className="wrap pad grid" style={{ '--min': '420px', '--gap': '32px 72px' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(26px,2.8vw,36px)', lineHeight: 1.15, fontWeight: 700, letterSpacing: '-.01em', textWrap: 'balance' }}>
            One partner for your industrial supplies and the coordination behind them.
          </h2>
          <div className="stack g20">
            <p className="lead">Shree Mahaganpati Enterprises supplies a broad range of industrial and commercial materials. We also handle the work around the order: finding the right source, coordinating vendors, supporting procurement and managing supply to your site.</p>
            <p className="slogan">{COMPANY.slogan}</p>
          </div>
        </div>
      </section>

      <section data-screen-label="Home — Products" className="bb2">
        <div className="wrap pad">
          <div className="section-head">
            <div className="stack g12">
              <p className="eyebrow">01 — Industrial Supplies</p>
              <h2 className="h2">We supply these categories</h2>
            </div>
            <Link to="/products" className="link-arrow">View all products<Arrow /></Link>
          </div>
          <div style={{ width: '100%', minHeight: 320 }}>
            <Orbit items={PRODUCTS} onOpen={(slug) => navigate(`/products#${slug}`)} />
          </div>
          <ul className="sr-only">
            {PRODUCTS.map((p) => <li key={p.slug}><Link to={`/products#${p.slug}`}>{p.name}</Link></li>)}
          </ul>
        </div>
      </section>

      <section data-screen-label="Home — Services" className="bb">
        <div className="wrap pad grid items-start">
          <Photo id="photo-1586528116311-ad8dd3c8310d" alt="Large distribution warehouse with stacked cartons and racking" />
          <div className="stack g28">
            <p className="eyebrow">02 — Services</p>
            <h2 className="h2">More than supply: we coordinate the whole requirement.</h2>
            <ul className="num-list">
              {SERVICES.map((s) => <li key={s.no}><span className="no">{s.no}</span>{s.name}</li>)}
            </ul>
            <Link to="/services" className="link-arrow">About our services<Arrow /></Link>
          </div>
        </div>
      </section>

      <section data-screen-label="Home — How We Work" className="dark-band on-dark">
        <div className="wrap pad">
          <div className="section-head" style={{ marginBottom: 48 }}>
            <div className="stack g12">
              <p className="eyebrow">03 — How We Work</p>
              <h2 className="h2">Four steps from requirement to delivery</h2>
            </div>
            <Link to="/how-we-work" className="link" style={{ color: '#e0b04a' }}>See the process in detail</Link>
          </div>
          <ol className="steps-row">
            {STEPS.map((s) => (
              <li key={s.no}>
                <span className="no">{s.no}</span>
                <h3>{s.name}</h3>
                <p>{s.short}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-screen-label="Home — Industries" className="bb">
        <div className="wrap pad grid items-start">
          <div className="stack g20">
            <p className="eyebrow">04 — Industries</p>
            <h2 className="h2">Supplying the sectors that build and run India</h2>
            <p className="lead">Based in Shirur near Pune's industrial belt, we serve businesses in Pune and across India.</p>
            <Link to="/industries" className="link">Industries we serve</Link>
          </div>
          <ul className="big-list">
            {INDUSTRIES.map((i) => <li key={i.no}>{i.name}</li>)}
          </ul>
        </div>
      </section>

      <section data-screen-label="Home — Founder" className="bb">
        <div className="wrap pad grid items-center" style={{ '--min': '420px' }}>
          <Photo id="photo-1587293852726-70cdb56c2866" alt="Warehouse racking loaded with goods stacked on wooden pallets" />
          <div className="stack g20">
            <p className="eyebrow">05 — About</p>
            <h2 className="h2">Built on a wooden pallet manufacturing background</h2>
            <p className="lead">Founder Om Jagtap began in wooden pallet manufacturing and has since built and developed the business into a wider industrial supply operation.</p>
            <Link to="/about" className="link">Read about the company</Link>
          </div>
        </div>
      </section>
    </>
  );
}
