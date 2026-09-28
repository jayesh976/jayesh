import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { usePageMeta } from '../lib/seo.js';
import { Chat, Mail, Phone } from '../components/Icons.jsx';

const STATUSES = [
  ['new', 'New'],
  ['in_progress', 'In progress'],
  ['closed', 'Closed'],
];
const statusLabel = Object.fromEntries(STATUSES);
const COLUMNS = ['created_at', 'status', 'name', 'company', 'phone', 'email', 'category', 'quantity', 'location', 'details', 'admin_notes'];

const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const waNumber = (phone) => {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) { setState('error'); setMessage(error.message); return; }
    setState('sent');
  };

  return (
    <div className="stack g20" style={{ maxWidth: 480 }}>
      <p className="eyebrow">Admin</p>
      <h1 className="h1" style={{ fontSize: 'clamp(30px,3.4vw,42px)' }}>Enquiries — sign in</h1>
      <p className="lead">Enter an admin email address. We'll email you a secure sign-in link.</p>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}</button>
      </form>
      {state === 'sent' && <p role="status" className="notice">Check <strong>{email}</strong> for the sign-in link. Open it in this browser.</p>}
      {state === 'error' && <p role="alert" className="notice error">{message}</p>}
    </div>
  );
}

function EnquiryItem({ enq, onChanged, onDeleted }) {
  const [notes, setNotes] = useState(enq.admin_notes || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => setNotes(enq.admin_notes || ''), [enq.admin_notes]);

  const update = async (patch) => {
    setBusy(true); setErr('');
    const { data, error } = await supabase.from('enquiries').update(patch).eq('id', enq.id).select().single();
    setBusy(false);
    if (error) setErr(error.message); else onChanged(data);
  };
  const remove = async () => {
    if (!window.confirm(`Delete the enquiry from ${enq.name}? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from('enquiries').delete().eq('id', enq.id);
    setBusy(false);
    if (error) setErr(error.message); else onDeleted(enq.id);
  };

  const subject = `Re: your requirement for ${enq.category}`;
  return (
    <details className="enq">
      <summary>
        <span className="stack" style={{ gap: 2 }}>
          <span className="who">{enq.name}{enq.company ? ` · ${enq.company}` : ''}</span>
          <span className="meta">{fmtDate(enq.created_at)}</span>
        </span>
        <span style={{ fontWeight: 600 }}>{enq.category}</span>
        <span className="meta">{enq.phone}</span>
        <span className={`pill ${enq.status}`}>{statusLabel[enq.status]}</span>
      </summary>
      <div className="enq-body">
        <div className="stack g16">
          <dl>
            <dt>Phone</dt><dd>{enq.phone}</dd>
            <dt>Email</dt><dd>{enq.email || '—'}</dd>
            <dt>Company</dt><dd>{enq.company || '—'}</dd>
            <dt>Quantity</dt><dd>{enq.quantity || '—'}</dd>
            <dt>Location</dt><dd>{enq.location || '—'}</dd>
            <dt>Email alert</dt><dd>{enq.email_notified ? 'Sent' : 'Not sent'}</dd>
          </dl>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a className="admin-btn" href={`tel:${enq.phone.replace(/[^\d+]/g, '')}`}><Phone />Call</a>
            <a className="admin-btn" href={`https://wa.me/${waNumber(enq.phone)}`} target="_blank" rel="noopener"><Chat size={16} />WhatsApp</a>
            {enq.email && <a className="admin-btn" href={`mailto:${enq.email}?subject=${encodeURIComponent(subject)}`}><Mail />Email</a>}
          </div>
        </div>
        <div className="stack g16">
          <div className="stack g10">
            <span className="label" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Requirement details</span>
            <p className="details">{enq.details}</p>
          </div>
          <label className="field">Status
            <select value={enq.status} disabled={busy} onChange={(e) => update({ status: e.target.value })}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">Internal notes
            <textarea rows={3} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quote sent, follow-up date…" />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="admin-btn" disabled={busy || notes === (enq.admin_notes || '')} onClick={() => update({ admin_notes: notes || null })}>Save notes</button>
            <button type="button" className="admin-btn danger" disabled={busy} onClick={remove}>Delete</button>
          </div>
          {err && <p role="alert" className="notice error">{err}</p>}
        </div>
      </div>
    </details>
  );
}

function Dashboard({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(1000);
    setLoading(false);
    if (error) setErr(error.message); else setRows(data);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('enquiries-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, (p) => {
        setRows((prev) => {
          if (p.eventType === 'INSERT') return prev.some((r) => r.id === p.new.id) ? prev : [p.new, ...prev];
          if (p.eventType === 'UPDATE') return prev.map((r) => (r.id === p.new.id ? p.new : r));
          if (p.eventType === 'DELETE') return prev.filter((r) => r.id !== p.old.id);
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, in_progress: 0, closed: 0 };
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => (filter === 'all' || r.status === filter) &&
      (!needle || [r.name, r.company, r.phone, r.email, r.category, r.location, r.details].some((v) => (v || '').toLowerCase().includes(needle))));
  }, [rows, filter, q]);

  const exportCsv = () => {
    const cell = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [COLUMNS.join(','), ...visible.map((r) => COLUMNS.map((k) => cell(r[k])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `enquiries-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div className="stack g10">
          <p className="eyebrow">Admin</p>
          <h1 className="h1" style={{ fontSize: 'clamp(30px,3.4vw,42px)' }}>Enquiries</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="meta" style={{ fontSize: 13, color: 'var(--muted)' }}>{session.user.email}</span>
          <button type="button" className="admin-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <div className="stats" style={{ marginTop: 24 }}>
        <div><span className="n">{counts.all}</span><span className="l">Total</span></div>
        <div><span className="n">{counts.new}</span><span className="l">New</span></div>
        <div><span className="n">{counts.in_progress}</span><span className="l">In progress</span></div>
        <div><span className="n">{counts.closed}</span><span className="l">Closed</span></div>
      </div>

      <div className="admin-toolbar">
        <label className="field grow">Search<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, product, location…" /></label>
        <label className="field">Status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <button type="button" className="admin-btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        <button type="button" className="admin-btn" onClick={exportCsv} disabled={!visible.length}>Export CSV</button>
      </div>

      {err && <p role="alert" className="notice error">{err}</p>}
      {!loading && !err && visible.length === 0 && (
        <p className="lead" style={{ padding: '32px 0' }}>{rows.length ? 'No enquiries match these filters.' : 'No enquiries yet. New requirements from the Contact page will appear here automatically.'}</p>
      )}
      {visible.map((enq) => (
        <EnquiryItem key={enq.id} enq={enq}
          onChanged={(row) => setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))}
          onDeleted={(id) => setRows((prev) => prev.filter((r) => r.id !== id))} />
      ))}
    </>
  );
}

export default function Admin() {
  usePageMeta({ title: 'Admin | Shree Mahaganpati Enterprises', description: 'Enquiry management.', path: '/admin', noindex: true });
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admin_emails').select('email').limit(1).then(({ data, error }) => setIsAdmin(!error && data.length > 0));
  }, [session]);

  let body;
  if (session === undefined || (session && isAdmin === null)) body = <p className="lead">Loading…</p>;
  else if (!session) body = <Login />;
  else if (!isAdmin) {
    body = (
      <div className="stack g20" style={{ maxWidth: 560 }}>
        <h1 className="h1" style={{ fontSize: 'clamp(30px,3.4vw,42px)' }}>No admin access</h1>
        <p className="lead">{session.user.email} is not on the admin list. Ask the site owner to add it, then sign in again.</p>
        <div><button type="button" className="admin-btn" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      </div>
    );
  } else body = <Dashboard session={session} />;

  return <section className="admin">{body}</section>;
}
