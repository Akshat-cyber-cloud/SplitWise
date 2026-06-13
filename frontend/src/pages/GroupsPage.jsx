import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch { setError('Failed to load groups'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', { name });
      setName('');
      fetchGroups();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create group'); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <h1>Your Groups</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Create New Group</h3>
        <form onSubmit={createGroup} className="flex gap-8">
          <input
            id="new-group-name" placeholder="Group name (e.g. Goa Trip)"
            value={name} onChange={(e) => setName(e.target.value)}
            required style={{ flex: 1 }}
          />
          <button id="create-group-btn" type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {groups.map((g) => (
          <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'border-color .2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <h3>{g.name}</h3>
              <p className="text-muted" style={{ marginTop: 4 }}>
                Created {new Date(g.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
        {groups.length === 0 && (
          <p className="text-muted">No groups yet. Create one above!</p>
        )}
      </div>
    </div>
  );
}
