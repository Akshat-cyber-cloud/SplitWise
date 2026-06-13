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
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <span className="text-slate-600">Import CSV</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import Expenses</h1>
        <p className="text-slate-500 mt-1">
          Upload a CSV with columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-teal-800">date, description, amount, currency, paid_by</code>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:border-teal-500 hover:bg-slate-50/50 transition-all duration-150">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-600 font-semibold">
                    {file ? file.name : 'Click to upload your CSV'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">CSV file up to 10MB</p>
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
              className="btn btn-primary px-8"
              disabled={loading || !file}
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8 animate-in fade-in duration-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Import Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Rows</p>
              <p className="text-2xl font-bold text-slate-800">{result.totalRows}</p>
            </div>
            
            <div className="bg-green-50/30 rounded-xl p-5 border border-green-100/50 text-center">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Committed</p>
              <p className="text-2xl font-bold text-green-600">{result.committed}</p>
            </div>

            <div className={`rounded-xl p-5 border text-center ${result.anomalyCount > 0 ? 'bg-red-50/30 border-red-100/50' : 'bg-slate-50/50 border-slate-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${result.anomalyCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>Anomalies</p>
              <p className={`text-2xl font-bold ${result.anomalyCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>{result.anomalyCount}</p>
            </div>
          </div>

          {result.anomalyCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                id="review-anomalies-btn"
                className="btn btn-primary flex items-center gap-1.5"
                onClick={() => navigate(`/groups/${groupId}/import/${result.batchId}/anomalies`)}
              >
                Review {result.anomalyCount} Anomal{result.anomalyCount === 1 ? 'y' : 'ies'} &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Expected CSV Format</h3>
        <p className="text-sm text-slate-500 mb-4">
          Columns must match the order and titles below. Headers are required.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm font-medium">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">date</th>
                <th className="px-4 py-3 text-left">description</th>
                <th className="px-4 py-3 text-left">amount</th>
                <th className="px-4 py-3 text-left">currency</th>
                <th className="px-4 py-3 text-left">paid_by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white font-mono text-xs">
              <tr>
                <td className="px-4 py-3.5">2024-01-15</td>
                <td className="px-4 py-3.5 font-sans text-sm font-semibold text-slate-900">Hotel booking</td>
                <td className="px-4 py-3.5">1000</td>
                <td className="px-4 py-3.5">INR</td>
                <td className="px-4 py-3.5 font-sans text-sm">Alice</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5">2024-01-16</td>
                <td className="px-4 py-3.5 font-sans text-sm font-semibold text-slate-900">Dinner</td>
                <td className="px-4 py-3.5">50</td>
                <td className="px-4 py-3.5">USD</td>
                <td className="px-4 py-3.5 font-sans text-sm">Bob</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5">2024-01-17</td>
                <td className="px-4 py-3.5 font-sans text-sm font-semibold text-slate-900">Cab ride</td>
                <td className="px-4 py-3.5">200</td>
                <td className="px-4 py-3.5">INR</td>
                <td className="px-4 py-3.5 font-sans text-sm">Alice</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
