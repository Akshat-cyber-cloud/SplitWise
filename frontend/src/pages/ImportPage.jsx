import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ImportPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const fd = new FormData();
    fd.append('csv', file);
    try {
      const { data } = await api.post(`/import/groups/${groupId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) { setError(err.response?.data?.error || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Import Expenses</h1>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Upload a CSV with columns: <code>date, description, amount, currency, paid_by</code>
      </p>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>CSV File</label>
            <input id="csv-file-input" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <button id="upload-csv-btn" type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? 'Uploading…' : 'Upload & Process'}
          </button>
        </form>
      </div>

      {result && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Import Result</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Total Rows',  value: result.totalRows },
              { label: 'Committed',   value: result.committed,  cls: 'text-success' },
              { label: 'Anomalies',   value: result.anomalyCount, cls: result.anomalyCount > 0 ? 'text-danger' : 'text-success' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ background: 'var(--color-surface2)', textAlign: 'center' }}>
                <p className={`text-muted`} style={{ marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 700 }} className={s.cls || ''}>{s.value}</p>
              </div>
            ))}
          </div>

          {result.anomalyCount > 0 && (
            <button
              id="review-anomalies-btn"
              className="btn btn-primary"
              onClick={() => navigate(`/groups/${groupId}/import/${result.batchId}/anomalies`)}
            >
              Review {result.anomalyCount} Anomal{result.anomalyCount === 1 ? 'y' : 'ies'} →
            </button>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Expected CSV Format</h3>
        <pre style={{ background: 'var(--color-surface2)', padding: 16, borderRadius: 8, fontSize: '0.85rem', overflowX: 'auto' }}>
{`date,description,amount,currency,paid_by
2024-01-15,Hotel booking,1000,INR,Alice
2024-01-16,Dinner,50,USD,Bob
2024-01-17,Cab ride,200,INR,Alice`}
        </pre>
      </div>
    </div>
  );
}
