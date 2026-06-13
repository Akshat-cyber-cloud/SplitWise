import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AnomalyPage() {
  const { groupId, batchId } = useParams();
  const [group, setGroup] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [grpRes, anomRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/anomalies/batches/${batchId}`),
      ]);
      setGroup(grpRes.data);
      setAnomalies(anomRes.data);
    } catch {
      setError('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [batchId, groupId]);

  const resolve = async (anomalyId, action) => {
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/anomalies/${anomalyId}/resolve`, {
        action,
        groupId: Number(groupId),
      });
      // Refresh anomalies
      const { data } = await api.get(`/anomalies/batches/${batchId}`);
      setAnomalies(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve anomaly');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  const pending = anomalies.filter((a) => a.status === 'PENDING');
  const resolved = anomalies.filter((a) => a.status !== 'PENDING');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}/import`} className="hover:text-teal-800 transition-colors">Import CSV</Link>
        <span>/</span>
        <span className="text-slate-600">Review Anomalies</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Anomaly Review</h1>
        <p className="text-slate-500 mt-1">
          Batch #{batchId} — <span className="font-semibold text-teal-800">{pending.length} pending</span>, {resolved.length} resolved
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      {/* Pending Anomalies */}
      <div className="space-y-6">
        {pending.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                {a.detectorName}
              </span>
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                PENDING REVIEW
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4 font-mono text-xs text-slate-600 overflow-x-auto">
              <pre>{JSON.stringify(a.rowData, null, 2)}</pre>
            </div>

            <p className="text-sm text-slate-700 mb-6">
              <strong className="text-slate-900 font-bold">Suggested Action:</strong> {a.suggestedAction}
            </p>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                id={`reject-${a.id}`}
                className="btn btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50/50 flex items-center justify-center gap-1.5 px-6"
                disabled={actionLoading}
                onClick={() => resolve(a.id, 'REJECTED')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Row
              </button>
              <button
                id={`approve-${a.id}`}
                className="btn btn-primary flex items-center justify-center gap-1.5 px-6 ml-auto"
                disabled={actionLoading}
                onClick={() => resolve(a.id, 'APPROVED')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve & Save
              </button>
            </div>
          </div>
        ))}

        {pending.length === 0 && (
          <div className="py-8 text-center bg-green-50/30 rounded-2xl border border-green-100/30 text-green-700 font-semibold text-sm flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All anomalies have been resolved!
          </div>
        )}
      </div>

      {/* Resolved History */}
      {resolved.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mt-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resolved Anomalies</h3>
          <div className="divide-y divide-slate-100">
            {resolved.map((a) => (
              <div key={a.id} className="flex justify-between items-center py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 text-sm">
                    {a.detectorName} &mdash; <span className="font-normal text-slate-500 font-mono text-xs">{a.rowData?.description || 'Row'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Resolved
                  </span>
                </div>
                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  a.status === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
