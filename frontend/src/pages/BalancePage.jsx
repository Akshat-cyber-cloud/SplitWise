import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function BalancePage() {
  const { groupId } = useParams();
  const [balances, setBalances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get(`/balances/groups/${groupId}`)
      .then(({ data }) => setBalances(data))
      .catch(() => setError('Failed to load balances'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const viewDetail = async (userId) => {
    setSelected(userId);
    try {
      const { data } = await api.get(`/balances/groups/${groupId}/members/${userId}`);
      setDetail(data);
    } catch { setDetail(null); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  const fmt = (n) => `₹${Number(n).toFixed(2)}`;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Balances</h1>
      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: summary */}
        <div>
          {balances.map((b) => (
            <div
              key={b.user.id}
              className="card"
              style={{ marginBottom: 12, cursor: 'pointer', borderColor: selected === b.user.id ? 'var(--color-primary)' : undefined }}
              onClick={() => viewDetail(b.user.id)}
            >
              <div className="flex-between">
                <div>
                  <strong>{b.user.name}</strong>
                  {b.leftAt && <span className="badge badge-warning" style={{ marginLeft: 8 }}>Left</span>}
                </div>
                <span
                  style={{ fontWeight: 700, fontSize: '1.1rem' }}
                  className={b.netBalance >= 0 ? 'text-success' : 'text-danger'}
                >
                  {b.netBalance >= 0 ? '+' : ''}{fmt(b.netBalance)}
                </span>
              </div>
              <p className="text-muted" style={{ marginTop: 4, fontSize: '0.82rem' }}>
                Paid {fmt(b.totalPaid)} · Owed {fmt(b.totalOwed)}
              </p>
            </div>
          ))}
        </div>

        {/* Right: drill-down */}
        <div>
          {detail ? (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Breakdown — {detail.user.name}</h3>

              <section style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Expenses paid</p>
                {detail.breakdown.paidExpenses.map((e) => (
                  <div key={e.id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-muted">{e.description}</span>
                    <span className="text-success">+{fmt(e.amountInInr)}</span>
                  </div>
                ))}
                {detail.breakdown.paidExpenses.length === 0 && <p className="text-muted">None</p>}
              </section>

              <section style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Share owed</p>
                {detail.breakdown.splitRows.map((r) => (
                  <div key={r.id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-muted">{r.expense?.description}</span>
                    <span className="text-danger">-{fmt(r.shareAmount)}</span>
                  </div>
                ))}
                {detail.breakdown.splitRows.length === 0 && <p className="text-muted">None</p>}
              </section>

              <section>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Settlements</p>
                {[...detail.breakdown.sentPayments.map((p) => ({ ...p, dir: 'sent' })),
                  ...detail.breakdown.receivedPayments.map((p) => ({ ...p, dir: 'received' }))
                ].sort((a, b) => new Date(a.date) - new Date(b.date)).map((p) => (
                  <div key={`${p.dir}-${p.id}`} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-muted">{p.dir === 'sent' ? 'Paid out' : 'Received'}</span>
                    <span className={p.dir === 'sent' ? 'text-danger' : 'text-success'}>
                      {p.dir === 'sent' ? '-' : '+'}{fmt(p.amount)}
                    </span>
                  </div>
                ))}
              </section>

              <div className="flex-between" style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid var(--color-border)' }}>
                <strong>Net balance</strong>
                <strong className={detail.netBalance >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '1.2rem' }}>
                  {detail.netBalance >= 0 ? '+' : ''}{fmt(detail.netBalance)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="card flex-center" style={{ height: 200 }}>
              <p className="text-muted">Click a member to see their breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
