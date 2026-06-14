import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ImportPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/groups/${groupId}`)
      .then(({ data }) => setGroup(data))
      .catch(() => {});
  }, [groupId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.append('csv', file);
    try {
      const { data } = await api.post(`/import/groups/${groupId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <span className="text-slate-600">Import CSV</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Import Expenses</h1>
        <p className="text-slate-500 mt-1.5 text-sm font-medium">
          Upload a CSV with columns: <code className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-teal-800">date, description, amount, currency, paid_by</code>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 md:p-8 mb-8 shadow-[4px_4px_0px_#0f172a]">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-900 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-slate-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-slate-900 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-900 font-extrabold">
                    {file ? file.name : 'Click to upload your CSV'}
                  </p>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">CSV file up to 10MB</p>
                </div>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              id="upload-csv-btn"
              type="submit"
              className="px-8 py-3 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-sm shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading || !file}
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 md:p-8 mb-8 shadow-[4px_4px_0px_#0f172a] animate-in fade-in duration-200">
          <h3 className="text-lg font-black text-slate-900 mb-6">Import Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-50/50 rounded-xl p-5 border-2 border-slate-900 text-center shadow-[3px_3px_0px_#0f172a]">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Rows</p>
              <p className="text-2xl font-black font-mono text-slate-800">{result.totalRows}</p>
            </div>
            
            <div className="bg-[#e6f4ea] rounded-xl p-5 border-2 border-slate-900 text-center shadow-[3px_3px_0px_#0f172a]">
              <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1">Committed</p>
              <p className="text-2xl font-black font-mono text-emerald-800">{result.committed}</p>
            </div>
 
            <div className={`rounded-xl p-5 border-2 border-slate-900 text-center shadow-[3px_3px_0px_#0f172a] ${result.anomalyCount > 0 ? 'bg-[#fce8e6]' : 'bg-slate-50/50'}`}>
              <p className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${result.anomalyCount > 0 ? 'text-rose-900' : 'text-slate-500'}`}>Anomalies</p>
              <p className={`text-2xl font-black font-mono ${result.anomalyCount > 0 ? 'text-rose-800' : 'text-slate-700'}`}>{result.anomalyCount}</p>
            </div>
          </div>
 
          {result.anomalyCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                id="review-anomalies-btn"
                className="px-6 py-3 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-sm shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all flex items-center gap-1.5"
                onClick={() => navigate(`/groups/${groupId}/import/${result.batchId}/anomalies`)}
              >
                Review {result.anomalyCount} Anomal{result.anomalyCount === 1 ? 'y' : 'ies'} &rarr;
              </button>
            </div>
          )}
 
          {result.normalizations && result.normalizations.length > 0 && (
            <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-6">
              <h4 className="text-sm font-black text-slate-900 mb-3">Normalizations Applied</h4>
              <ul className="space-y-3">
                {result.normalizations.map((n, i) => (
                  <li key={i} className="text-xs text-slate-700 bg-slate-50 border-2 border-slate-900 rounded-xl p-4 font-bold shadow-[2px_2px_0px_#0f172a]">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
 
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 md:p-8 shadow-[4px_4px_0px_#0f172a]">
        <h3 className="text-lg font-black text-slate-900 mb-4">Expected CSV Format</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">
          Columns must match the order and titles below. Headers are required.
        </p>
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900">
          <table className="min-w-full divide-y-2 divide-slate-900 text-sm font-bold">
            <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left border-r-2 border-slate-900">date</th>
                <th className="px-4 py-3 text-left border-r-2 border-slate-900">description</th>
                <th className="px-4 py-3 text-left border-r-2 border-slate-900">amount</th>
                <th className="px-4 py-3 text-left border-r-2 border-slate-900">currency</th>
                <th className="px-4 py-3 text-left">paid_by</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900 text-slate-700 bg-white font-mono text-xs">
              <tr>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">2024-01-15</td>
                <td className="px-4 py-3.5 font-sans text-sm font-extrabold text-slate-900 border-r-2 border-slate-900">Hotel booking</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">1000</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">INR</td>
                <td className="px-4 py-3.5 font-sans text-sm">Alice</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">2024-01-16</td>
                <td className="px-4 py-3.5 font-sans text-sm font-extrabold text-slate-900 border-r-2 border-slate-900">Dinner</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">50</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">USD</td>
                <td className="px-4 py-3.5 font-sans text-sm">Bob</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">2024-01-17</td>
                <td className="px-4 py-3.5 font-sans text-sm font-extrabold text-slate-900 border-r-2 border-slate-900">Cab ride</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">200</td>
                <td className="px-4 py-3.5 border-r-2 border-slate-900">INR</td>
                <td className="px-4 py-3.5 font-sans text-sm">Alice</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
