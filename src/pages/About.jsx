import Film from '../components/Film.jsx';
import Photo from '../components/Photo.jsx';
import { COMPANY } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

const personSchema = (site) => [{
  '@type': 'Person',
  name: 'Om Jagtap',
  jobTitle: 'Founder',
  image: `${site}/assets/founder-om-jagtap.jpg`,
  worksFor: { '@type': 'Organization', name: 'Shree Mahaganpati Enterprises', url: `${site}/` },
}];

export default function About() {
  usePageMeta({
    title: 'About Us & Founder Om Jagtap | Shree Mahaganpati Enterprises',
    description: 'Industrial supplier based at Pabal Phata, Shirur, Pune. Founded by Om Jagtap, with a background in wooden pallet manufacturing.',
    path: '/about',
    crumb: 'About',
    schema: personSchema,
  });

  return (
    <>
      <section data-screen-label="About — Intro" className="bb2">
        <div className="wrap pad-intro stack g20">
          <p className="eyebrow">About</p>
          <h1 className="h1" style={{ maxWidth: 880 }}>About Shree Mahaganpati Enterprises</h1>
          <p className="lead-lg">We are an industrial supplier based at Pabal Phata, Shirur, Pune. Our customers get a broad range of industrial and commercial materials, plus help with sourcing, vendor coordination and supply, all from one partner.</p>
        </div>
      </section>

      <section className="bb">
        <div className="wrap pad grid">
          <div className="stack g20">
            <h2 className="h2-sm">Our story</h2>
            <p className="lead">The business grew out of wooden pallet manufacturing. Making pallets meant working closely with the packaging, storage and dispatch needs of industrial customers. That experience led naturally into supplying the other materials those customers use every day.</p>
            <p className="lead">Today we supply fasteners, cotton waste, packaging products, wooden pallets, scrap, housekeeping products, plastic raw material, industrial stationery, construction material and safety products. We work to each customer's specification, quantity and delivery requirement.</p>
            <p className="slogan" style={{ fontSize: 16 }}>{COMPANY.slogan}</p>
          </div>
          <Photo id="photo-1513828583688-c52646db42da" alt="Clean industrial facility with stainless steel piping and a blue fan motor" />
        </div>
      </section>

      <section id="founder" data-screen-label="About — Founder" className="bb" style={{ scrollMarginTop: 80 }}>
        <div className="wrap pad grid items-start" style={{ '--min': '400px', '--gap': '48px 64px' }}>
          <div className="stack g24">
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <picture>
                <source srcSet="/assets/founder-om-jagtap.webp" type="image/webp" />
                <img src="/assets/founder-om-jagtap.jpg" alt="Mr Om Jagtap, Founder of Shree Mahaganpati Enterprises" width="720" height="960" loading="lazy" className="founder-img" />
              </picture>
              <div className="stack g10" style={{ minWidth: 180, flex: 1 }}>
                <p className="eyebrow">Founder</p>
                <h2 style={{ margin: 0, fontSize: 'clamp(30px,3.2vw,44px)', lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.015em' }}>Mr Om Jagtap</h2>
              </div>
            </div>
            <p className="lead" style={{ maxWidth: 560 }}>Om Jagtap has a background in wooden pallet manufacturing and experience in building and developing the business. He is the contact for all enquiries and requirements.</p>
            <dl className="facts">
              <dt>Born</dt><dd>2003</dd>
              <dt>Education</dt><dd>BBA</dd>
              <dt>Background</dt><dd>Wooden pallet manufacturing</dd>
              <dt>Contact</dt><dd><a href={`tel:${COMPANY.phoneTel}`}>{COMPANY.phoneDisplay}</a></dd>
            </dl>
          </div>
          <div className="stack g14">
            <Film />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>Shree Mahaganpati Enterprises: Industrial Supplies &amp; Business Solutions</p>
          </div>
        </div>
      </section>
    </>
  );
}
