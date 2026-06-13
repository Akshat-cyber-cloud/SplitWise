import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/groups/${groupId}`)
      .then(({ data }) => setGroup(data))
      .catch(() => setError('Failed to load group'))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="loading">Loading…</div>;
  if (error)   return <div className="error-msg">{error}</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{group.name}</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>
        {group.memberships?.length} member(s)
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '💸 Expenses',  to: `/groups/${groupId}/expenses`, desc: 'Add & view expenses' },
          { label: '📊 Balances',  to: `/groups/${groupId}/balances`, desc: 'Who owes whom' },
          { label: '📥 Import CSV', to: `/groups/${groupId}/import`,  desc: 'Bulk import expenses' },
        ].map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <h3>{item.label}</h3>
              <p className="text-muted" style={{ marginTop: 4, fontSize: '0.85rem' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Members</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Left</th></tr>
            </thead>
            <tbody>
              {group.memberships?.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td className="text-muted">{m.user.email}</td>
                  <td>{new Date(m.joinedAt).toLocaleDateString()}</td>
                  <td>{m.leftAt ? new Date(m.leftAt).toLocaleDateString() : <span className="badge badge-success">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
