import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function AnomalyPage() {
  const { groupId, batchId } = useParams();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchAnomalies = async () => {
    try {
      const { data } = await api.get(`/anomalies/batches/${batchId}`);
      setAnomalies(data);
    } catch { setError('Failed to load anomalies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnomalies(); }, [batchId]);

  const resolve = async (anomalyId, action) => {
    try {
      await api.patch(`/anomalies/${anomalyId}/resolve`, { action, groupId: Number(groupId) });
      fetchAnomalies();
    } catch (err) { setError(err.response?.data?.error || 'Failed to resolve'); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  const pending  = anomalies.filter((a) => a.status === 'PENDING');
  const resolved = anomalies.filter((a) => a.status !== 'PENDING');

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Anomaly Review</h1>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Batch #{batchId} — {pending.length} pending, {resolved.length} resolved
      </p>

      {error && <div className="error-msg">{error}</div>}

      {pending.map((a) => (
        <div key={a.id} className="card" style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span className="badge badge-warning">{a.detectorName}</span>
            <span className="badge badge-warning">PENDING</span>
          </div>
          <div style={{ background: 'var(--color-surface2)', padding: 12, borderRadius: 8, marginBottom: 12, fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {JSON.stringify(a.rowData, null, 2)}
          </div>
          <p style={{ marginBottom: 12, fontSize: '0.9rem' }}>
            <strong>Suggested action:</strong> {a.suggestedAction}
          </p>
          <div className="flex gap-8">
            <button id={`approve-${a.id}`} className="btn btn-success btn-sm" onClick={() => resolve(a.id, 'APPROVED')}>
              ✓ Approve
            </button>
            <button id={`reject-${a.id}`} className="btn btn-danger btn-sm" onClick={() => resolve(a.id, 'REJECTED')}>
              ✗ Reject
            </button>
          </div>
        </div>
      ))}

      {pending.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-success)' }}>
          ✅ All anomalies have been resolved!
        </div>
      )}

      {resolved.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Resolved</h3>
          {resolved.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-muted">{a.detectorName} — {a.rowData?.description}</span>
              <span className={`badge ${a.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
