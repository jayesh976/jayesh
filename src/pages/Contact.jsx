import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Arrow, Chat, Mail } from '../components/Icons.jsx';
import { CATEGORY_OPTIONS, COMPANY, unsplash, whatsappLink } from '../data.js';
import { submitEnquiry } from '../lib/supabase.js';
import { usePageMeta } from '../lib/seo.js';

const FIELDS = ['name', 'company', 'phone', 'email', 'category', 'quantity', 'location', 'details'];

const contactSchema = (site) => [{
  '@type': 'ContactPage',
  url: `${site}/contact`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Shree Mahaganpati Enterprises',
    contactPoint: { '@type': 'ContactPoint', telephone: '+91-7249217070', email: 'Shreemahaganapati72@gmail.com', contactType: 'sales', areaServed: 'IN', availableLanguage: ['en', 'hi', 'mr'] },
  },
}];

function summarise(v) {
  return [
    `Name: ${v.name}`, `Company: ${v.company}`, `Phone: ${v.phone}`, `Email: ${v.email}`,
    `Category: ${v.category}`, `Quantity: ${v.quantity}`, `Delivery location: ${v.location}`,
    '', 'Requirement details:', v.details,
  ].join('\n');
}

export default function Contact() {
  usePageMeta({
    title: 'Contact & Send Your Requirement | Shree Mahaganpati Enterprises',
    description: 'Send your industrial supply requirement to Shree Mahaganpati Enterprises, Shirur, Pune. Call +91 72492 17070 or email Shreemahaganapati72@gmail.com.',
    path: '/contact',
    crumb: 'Contact',
    schema: contactSchema,
  });

  const [params] = useSearchParams();
  const requested = params.get('category');
  const initialCategory = CATEGORY_OPTIONS.includes(requested) ? requested : 'General requirement';
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const values = Object.fromEntries(FIELDS.map((k) => [k, (fd.get(k) || '').toString().trim()]));
    setStatus('sending');
    setError(null);
    try {
      await submitEnquiry({ ...values, website: (fd.get('website') || '').toString() });
      setSent(values);
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError({ message: err.message, field: err.field });
      setStatus('error');
      if (err.field) form.elements[err.field]?.focus();
    }
  };

  const subject = sent ? `Requirement: ${sent.category} — ${sent.name}${sent.company ? ` (${sent.company})` : ''}` : '';
  const mailto = sent ? `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summarise(sent))}` : '';
  const invalid = (k) => (error?.field === k ? 'true' : undefined);

  return (
    <>
      <section data-screen-label="Contact" className="bb2">
        <div className="wrap pad-intro stack g20">
          <p className="eyebrow">Contact · Enquiry</p>
          <h1 className="h1">Send your requirement</h1>
          <p className="lead-lg" style={{ maxWidth: 720 }}>Fill in the form and your requirement reaches us directly. You can also call or WhatsApp us.</p>
        </div>
      </section>

      <section>
        <div className="wrap pad-list grid items-start" style={{ '--min': '380px', '--gap': '56px 80px' }}>
          <form ref={formRef} className="form" onSubmit={onSubmit} noValidate={false} aria-describedby="form-status">
            <div className="form-row">
              <label className="field">Your name *<input name="name" required maxLength={120} autoComplete="name" aria-invalid={invalid('name')} /></label>
              <label className="field">Company<input name="company" maxLength={160} autoComplete="organization" /></label>
              <label className="field">Phone *<input name="phone" type="tel" required minLength={6} maxLength={30} pattern="[\d\s+\-\(\)]{6,30}" title="Digits, spaces, +, - and brackets only" autoComplete="tel" inputMode="tel" aria-invalid={invalid('phone')} /></label>
              <label className="field">Email<input name="email" type="email" maxLength={200} autoComplete="email" aria-invalid={invalid('email')} /></label>
            </div>
            <label className="field">Product / service category
              <select name="category" defaultValue={initialCategory} key={initialCategory}>
                {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <div className="form-row">
              <label className="field">Quantity<input name="quantity" maxLength={200} placeholder="e.g. 500 pcs, 2 tonnes" /></label>
              <label className="field">Delivery location<input name="location" maxLength={200} placeholder="City / site" /></label>
            </div>
            <label className="field">Requirement details *<textarea name="details" required maxLength={5000} rows={6} placeholder="Specification, grade, size, timeline…" aria-invalid={invalid('details')} /></label>
            <div className="hp" aria-hidden="true">
              <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Your Requirement'}<Arrow size={18} />
            </button>
            <div id="form-status" aria-live="polite">
              {status === 'sent' && sent && (
                <div role="status" className="notice">
                  <strong>Thank you, {sent.name}. Your requirement has been received.</strong> Mr Om Jagtap will contact you on {sent.phone} soon.
                  <div className="actions">
                    <a className="wa" href={whatsappLink(`Hello, I just sent a requirement on your website.\n\n${summarise(sent)}`)} target="_blank" rel="noopener"><Chat size={16} />Also send on WhatsApp</a>
                    <a href={mailto}><Mail />Also send by email</a>
                  </div>
                </div>
              )}
              {status === 'error' && error && (
                <div role="alert" className="notice error">
                  {error.message} You can also email us at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, call <a href={`tel:${COMPANY.phoneTel}`}>{COMPANY.phoneDisplay}</a> or <a href={whatsappLink()} target="_blank" rel="noopener">message us on WhatsApp</a>.
                </div>
              )}
            </div>
          </form>

          <aside className="contact-aside">
            <div><span className="label">Contact person</span><span className="val">{COMPANY.contact}</span></div>
            <div><span className="label">Phone</span><a href={`tel:${COMPANY.phoneTel}`} className="val">{COMPANY.phoneDisplay}</a></div>
            <div><span className="label">Email</span><a href={`mailto:${COMPANY.email}`} className="val" style={{ fontSize: 17, wordBreak: 'break-all' }}>{COMPANY.email}</a></div>
            <div>
              <span className="label">Address</span>
              <address style={{ fontStyle: 'normal', fontSize: 17, lineHeight: 1.6, fontWeight: 600 }}>
                {COMPANY.addressLines.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}
              </address>
              <a href={COMPANY.mapsUrl} target="_blank" rel="noopener" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Open in Google Maps</a>
            </div>
            <div><span className="label">Service area</span><span style={{ fontSize: 17, fontWeight: 600 }}>Pune and all over India</span></div>
            <img src={unsplash('photo-1504307651254-35680f356dfd', 900)} alt="Construction workers placing steel reinforcement bars on site" width="900" height="506" loading="lazy" style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover', display: 'block', marginTop: 8 }} />
          </aside>
        </div>
      </section>
    </>
  );
}
