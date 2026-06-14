import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import SettleUpModal from '../components/SettleUpModal';

export default function GroupsPage() {
  const [summary, setSummary] = useState({ totalBalance: 0, youAreOwed: 0, youOwe: 0, groups: [] });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/balances/dashboard');
      setSummary(data);
    } catch {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/groups', { name });
      setName('');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => setIsSettleUpOpen(true)}
          className="btn btn-secondary flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Settle Up
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div id="tour-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
          <p className={`text-3xl font-bold ${summary.totalBalance > 0 ? 'text-green-600' : summary.totalBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {summary.totalBalance > 0 ? '+' : ''}₹{summary.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50/50 rounded-2xl p-6 shadow-sm border border-green-100/50 flex flex-col justify-center">
          <p className="text-sm font-medium text-green-800 uppercase tracking-wider mb-1">You are owed</p>
          <p className="text-3xl font-bold text-green-700">₹{summary.youAreOwed.toFixed(2)}</p>
        </div>
        <div className="bg-red-50/50 rounded-2xl p-6 shadow-sm border border-red-100/50 flex flex-col justify-center">
          <p className="text-sm font-medium text-red-800 uppercase tracking-wider mb-1">You owe</p>
          <p className="text-3xl font-bold text-red-700">₹{summary.youOwe.toFixed(2)}</p>
        </div>
      </div>

      <div id="tour-create-group" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Create New Group</h3>
          <p className="text-sm text-slate-500 mt-1">Start tracking expenses for a new trip or apartment.</p>
        </div>
        <form onSubmit={createGroup} className="flex w-full md:w-auto gap-3">
          <input
            id="new-group-name"
            placeholder="e.g. Goa Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input md:w-64"
          />
          <button id="create-group-btn" type="submit" className="btn btn-primary shrink-0">
            Create
          </button>
        </form>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Your Groups</h2>

      <div id="tour-groups-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.groups.map((g, idx) => (
          <Link key={g.groupId} to={`/groups/${g.groupId}`} id={idx === 0 ? "tour-first-group" : undefined} className="block group">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full transition-all duration-200 group-hover:shadow-md group-hover:border-teal-200 group-hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl">
                    {g.groupName.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-right">
                    {g.userBalance > 0 ? (
                      <div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          you are owed
                        </span>
                        <p className="text-sm font-bold text-green-600 mt-1">₹{g.userBalance.toFixed(2)}</p>
                      </div>
                    ) : g.userBalance < 0 ? (
                      <div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          you owe
                        </span>
                        <p className="text-sm font-bold text-red-600 mt-1">₹{Math.abs(g.userBalance).toFixed(2)}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                          settled up
                        </span>
                        <p className="text-sm font-bold text-slate-400 mt-1">₹0.00</p>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                  {g.groupName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Created {new Date(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Members Avatars Stack */}
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Members</span>
                <div className="flex -space-x-2 overflow-hidden">
                  {g.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      title={m.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 uppercase"
                    >
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {g.members.length > 3 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                      +{g.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {summary.groups.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
            <p className="text-slate-500">No groups yet. Create one above to get started!</p>
          </div>
        )}
      </div>

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSuccess={fetchDashboard}
      />
    </div>
  );
}
