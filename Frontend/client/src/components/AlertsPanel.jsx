import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import './AlertsPanel.css';

const TITLES = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' };

export default function AlertsPanel() {
  const { token, user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !token || !user || authLoading) return;
    let active = true;
    setPending(true);
    setError('');
    apiRequest('/api/alerts', { token })
      .then(result => { if (active) setData(result); })
      .catch(err => { if (active) setError(err.message || 'Could not load alerts'); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, [open, token, user?.id, authLoading]);

  const total = data?.alerts?.length ?? 0;
  return (
    <section className="astra-alert-widget" aria-label="Health alerts">
      <button type="button" className="astra-alert-toggle" aria-expanded={open} aria-controls="astra-alert-list" onClick={() => setOpen(v => !v)}>
        <span><span className="astra-alert-heading">ALERTS</span><span className="astra-alert-subtitle">Health signals and data review</span></span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div id="astra-alert-list" className="astra-alert-list">
          {authLoading ? <p>Checking session…</p> : !token || !user ? <p>Sign in to see your personal alerts.</p> : pending ? <p>Checking health records…</p> : error ? <p role="alert">{error}</p> : (
            <>
              <p className="astra-alert-summary">{total ? `${total} observation${total === 1 ? '' : 's'} for ${user.username}` : 'No current rule matches found.'}</p>
              {['high','medium','low'].map(priority => {
                const items = data?.alerts?.filter(a => a.priority === priority) ?? [];
                if (!items.length) return null;
                return <div className="astra-alert-group" key={priority}>
                  <h3 className={`astra-alert-level astra-alert-level--${priority}`}>{TITLES[priority]} · {items.length}</h3>
                  {items.map(item => <article key={item.id} className="astra-alert-item">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <small>{item.source.replaceAll('_', ' ')} · {item.recordedAt?.replace('T', ' ')}</small>
                  </article>)}
                </div>;
              })}
              <p className="astra-alert-disclaimer">Screening rules for a demo, not a diagnosis. Older records may not reflect current health. Missing or normal-looking alerts do not prove safety.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
