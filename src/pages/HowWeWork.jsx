import Photo from '../components/Photo.jsx';
import { Check } from '../components/Icons.jsx';
import { CHECKLIST, STEPS } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

const howToSchema = () => [{
  '@type': 'HowTo',
  name: 'How to send a requirement to Shree Mahaganpati Enterprises',
  step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.long })),
}];

export default function HowWeWork() {
  usePageMeta({
    title: 'How We Work | Shree Mahaganpati Enterprises',
    description: 'A clear four-step process from requirement to delivery: understand the requirement, source the solution, coordinate vendors and deliver with follow-up support.',
    path: '/how-we-work',
    crumb: 'How We Work',
    schema: howToSchema,
  });

  return (
    <>
      <section data-screen-label="How We Work — Intro" className="bb2">
        <div className="wrap pad-intro stack g20">
          <p className="eyebrow">How We Work</p>
          <h1 className="h1">A clear process from requirement to delivery</h1>
        </div>
      </section>

      <section>
        <div className="wrap grid items-start" style={{ paddingTop: 'clamp(40px,5vw,72px)', paddingBottom: 'clamp(40px,5vw,72px)' }}>
          <ol className="process-list">
            {STEPS.map((s) => (
              <li key={s.no}>
                <span className="no">{s.no}</span>
                <div className="stack g10">
                  <h2>{s.name}</h2>
                  <p className="lead" style={{ fontSize: 16, lineHeight: 1.65 }}>{s.long}</p>
                </div>
              </li>
            ))}
          </ol>
          <Photo id="photo-1553413077-190dd305871c" alt="Long warehouse aisle with high racking" ratio="4/5" widths={[600, 1000]} sizes="(max-width: 900px) 100vw, 560px" />
        </div>
      </section>

      <section className="bt">
        <div className="wrap pad-intro grid" style={{ '--min': '420px', '--gap': '32px 72px' }}>
          <div className="stack g16">
            <h2 className="h2-sm">What to include in your requirement</h2>
            <p className="lead">The more detail you send, the faster we can source and quote.</p>
          </div>
          <ul className="check-list">
            {CHECKLIST.map((c) => <li key={c}><Check />{c}</li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
