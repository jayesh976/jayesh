import Photo from '../components/Photo.jsx';
import { SERVICES } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

const serviceSchema = (site) => SERVICES.map((s) => ({
  '@type': 'Service',
  name: s.name,
  description: s.desc,
  areaServed: 'IN',
  provider: { '@type': 'Organization', name: 'Shree Mahaganpati Enterprises', url: `${site}/` },
}));

export default function Services() {
  usePageMeta({
    title: 'Sourcing, Procurement & Supply Services | Shree Mahaganpati Enterprises',
    description: 'Sourcing, vendor coordination, procurement support, project coordination, supply & logistics and custom requirement management for businesses in Pune and across India.',
    path: '/services',
    crumb: 'Services',
    schema: serviceSchema,
  });

  return (
    <>
      <section data-screen-label="Services — Intro" className="bb2">
        <div className="wrap pad-intro stack g20">
          <p className="eyebrow">Services</p>
          <h1 className="h1">Sourcing, coordination and supply, managed end to end</h1>
          <p className="lead-lg">Beyond the materials themselves, we take on the coordination work that slows procurement teams down.</p>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ paddingTop: 'clamp(40px,5vw,72px)', paddingBottom: 'clamp(40px,5vw,72px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))', columnGap: 48 }}>
          {SERVICES.map((s) => (
            <article key={s.no} className="card-col">
              <span className="no">{s.no}</span>
              <h2>{s.name}</h2>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bt">
        <div className="wrap pad-list grid" style={{ '--min': '420px', '--gap': '24px' }}>
          <Photo id="photo-1565793298595-6a879b1d9492" alt="Aerial view of freight trucks lined up at a logistics depot" ratio="3/2" sizes="(max-width: 900px) 100vw, 600px" caption="Supply & logistics" />
          <Photo id="photo-1494412574643-ff11b0a5c1c3" alt="Container port with cranes and stacked shipping containers" ratio="3/2" sizes="(max-width: 900px) 100vw, 600px" caption="Vendor coordination" />
        </div>
      </section>
    </>
  );
}
