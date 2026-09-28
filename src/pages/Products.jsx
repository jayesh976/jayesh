import { Link } from 'react-router-dom';
import Photo from '../components/Photo.jsx';
import { Arrow } from '../components/Icons.jsx';
import { PRODUCTS } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

const productSchema = (site) => [{
  '@type': 'OfferCatalog',
  name: 'Industrial supplies',
  url: `${site}/products`,
  itemListElement: PRODUCTS.map((p) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Product', name: p.name, description: p.long, url: `${site}/products#${p.slug}` },
  })),
}];

export default function Products() {
  usePageMeta({
    title: 'Industrial Supplies: Fasteners, Pallets, Packaging & More | Shree Mahaganpati Enterprises',
    description: 'Fasteners, cotton waste, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery, construction material and safety products, sourced to your requirement.',
    path: '/products',
    crumb: 'Products',
    schema: productSchema,
  });

  return (
    <>
      <section data-screen-label="Products — Intro" className="bb2">
        <div className="wrap pad-intro grid items-end" style={{ '--min': '420px', '--gap': '40px 72px' }}>
          <div className="stack g20">
            <p className="eyebrow">Products · Industrial Supplies</p>
            <h1 className="h1">Industrial supplies, sourced to your requirement</h1>
            <p className="lead-lg">Ten supply categories for industrial and commercial customers. We confirm specifications, grades, sizes and quantities with you for every requirement.</p>
          </div>
          <Photo id="photo-1504917595217-d4dc5ebe6122" alt="Metal fabrication with sparks from an angle grinder" ratio="16/10" eager />
        </div>
      </section>

      <section data-screen-label="Products — List">
        <div className="wrap pad-list">
          {PRODUCTS.map((p) => (
            <article key={p.slug} id={p.slug} className="product">
              <div className="title">
                <span className="no">{p.no}</span>
                <h2>{p.name}</h2>
              </div>
              <p>{p.long}</p>
              <div>
                <Link to={`/contact?category=${encodeURIComponent(p.name)}`} className="btn btn-outline">Enquire about this<Arrow /></Link>
              </div>
            </article>
          ))}
          <div className="grid items-center" style={{ marginTop: 56, '--min': '420px', '--gap': '40px 72px' }}>
            <Photo id="photo-1566576721346-d4a3b4eaeb55" alt="Corrugated cardboard shipping box being handed over" ratio="16/10" />
            <div className="stack g20">
              <h2 className="h2-sm">Need something not listed?</h2>
              <p className="lead">Send us your specification. If it fits within our supply network, we'll source it and coordinate delivery.</p>
              <Link to="/contact" className="btn btn-primary" style={{ maxWidth: 280 }}>Send Your Requirement<Arrow size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
