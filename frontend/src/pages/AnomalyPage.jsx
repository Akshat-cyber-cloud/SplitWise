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
      <nav className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}/import`} className="hover:text-teal-800 transition-colors">Import CSV</Link>
        <span>/</span>
        <span className="text-slate-600">Review Anomalies</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Anomaly Review</h1>
        <p className="text-slate-500 mt-1.5 text-sm font-medium">
          Batch #{batchId} — <span className="font-extrabold text-teal-800">{pending.length} pending</span>, {resolved.length} resolved
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
          {error}
        </div>
      )}

      {/* Pending Anomalies */}
      <div className="space-y-8">
        {pending.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 border-2 border-slate-900 shadow-[5px_5px_0px_#0f172a] relative overflow-hidden animate-in fade-in duration-200 pl-8">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-amber-400 border-r-2 border-slate-900"></div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full uppercase tracking-wider border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]">
                {a.detectorName}
              </span>
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-wider border border-slate-300">
                PENDING REVIEW
              </span>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl mb-4 font-mono text-xs text-slate-700 overflow-x-auto shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)]">
              <pre>{JSON.stringify(a.rowData, null, 2)}</pre>
            </div>

            <p className="text-sm text-slate-700 mb-6 leading-relaxed">
              <strong className="text-slate-950 font-black">Suggested Action:</strong> {a.suggestedAction}
            </p>

            <div className="flex gap-4 pt-4 border-t-2 border-dashed border-slate-200">
              <button
                id={`reject-${a.id}`}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-red-50 text-red-700 font-extrabold text-xs shadow-[2.5px_2.5px_0px_#0f172a] hover:bg-red-100 hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                disabled={actionLoading}
                onClick={() => resolve(a.id, 'REJECTED')}
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Row
              </button>
              <button
                id={`approve-${a.id}`}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-xs shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 ml-auto"
                disabled={actionLoading}
                onClick={() => resolve(a.id, 'APPROVED')}
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve & Save
              </button>
            </div>
          </div>
        ))}

        {pending.length === 0 && (
          <div className="py-8 text-center bg-[#e6f4ea] rounded-2xl border-2 border-slate-900 text-emerald-800 font-extrabold text-sm flex flex-col items-center justify-center gap-3 shadow-[4px_4px_0px_#0f172a]">
            <svg className="w-10 h-10 text-emerald-700 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All anomalies have been resolved!
          </div>
        )}
      </div>

      {/* Resolved History */}
      {resolved.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 md:p-8 mt-8 shadow-[4px_4px_0px_#0f172a]">
          <h3 className="text-lg font-black text-slate-900 mb-4">Resolved Anomalies</h3>
          <div className="divide-y-2 divide-slate-200 divide-dashed">
            {resolved.map((a) => (
              <div key={a.id} className="flex justify-between items-center py-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-800 text-sm">
                    {a.detectorName} &mdash; <span className="font-mono text-xs text-slate-500 font-medium">{a.rowData?.description || 'Row'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                    Resolved
                  </span>
                </div>
                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider border ${
                  a.status === 'APPROVED' ? 'bg-[#e6f4ea] text-emerald-800 border-emerald-800/20' : 'bg-[#fce8e6] text-rose-800 border-rose-800/20'
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
