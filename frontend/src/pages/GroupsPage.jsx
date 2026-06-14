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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => setIsSettleUpOpen(true)}
          className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Settle Up
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
          {error}
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div id="tour-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-center">
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
          <p className={`text-3xl font-black font-mono ${summary.totalBalance > 0 ? 'text-emerald-700' : summary.totalBalance < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {summary.totalBalance > 0 ? '+' : ''}₹{summary.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#e6f4ea] rounded-2xl p-6 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-center">
          <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1">You are owed</p>
          <p className="text-3xl font-black font-mono text-emerald-800">₹{summary.youAreOwed.toFixed(2)}</p>
        </div>
        <div className="bg-[#fce8e6] rounded-2xl p-6 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-center">
          <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider mb-1">You owe</p>
          <p className="text-3xl font-black font-mono text-rose-800">₹{summary.youOwe.toFixed(2)}</p>
        </div>
      </div>

      <div id="tour-create-group" className="bg-white rounded-2xl p-6 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Create New Group</h3>
          <p className="text-xs text-slate-500 mt-1">Start tracking expenses for a new trip or apartment.</p>
        </div>
        <form onSubmit={createGroup} className="flex w-full md:w-auto gap-3 flex-shrink-0">
          <input
            id="new-group-name"
            placeholder="e.g. Goa Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full md:w-64 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-0"
          />
          <button 
            id="create-group-btn" 
            type="submit" 
            className="px-6 py-2.5 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-sm shadow-[2px_2px_0px_#0f172a] hover:shadow-[0.5px_0.5px_0px_#0f172a] hover:translate-x-[1.5px] hover:translate-y-[1.5px] transition-all"
          >
            Create
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-5">Your Groups</h2>

      <div id="tour-groups-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.groups.map((g, idx) => (
          <Link key={g.groupId} to={`/groups/${g.groupId}`} id={idx === 0 ? "tour-first-group" : undefined} className="block group">
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-900 h-full shadow-[4px_4px_0px_#0f172a] hover:shadow-[6px_6px_0px_#0f172a] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-slate-900 flex items-center justify-center font-black text-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a]">
                    {g.groupName.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-right">
                    {g.userBalance > 0 ? (
                      <div>
                        <span className="text-[10px] font-black text-emerald-800 bg-[#e6f4ea] px-2 py-0.5 rounded-full border border-emerald-800/20 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                          you are owed
                        </span>
                        <p className="text-sm font-black font-mono text-emerald-700 mt-1.5">₹{g.userBalance.toFixed(2)}</p>
                      </div>
                    ) : g.userBalance < 0 ? (
                      <div>
                        <span className="text-[10px] font-black text-rose-800 bg-[#fce8e6] px-2 py-0.5 rounded-full border border-rose-800/20 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                          you owe
                        </span>
                        <p className="text-sm font-black font-mono text-rose-700 mt-1.5">₹{Math.abs(g.userBalance).toFixed(2)}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                          settled up
                        </span>
                        <p className="text-sm font-black font-mono text-slate-400 mt-1.5">₹0.00</p>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                  {g.groupName}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider font-mono">
                  Created {new Date(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Members Avatars Stack */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-150 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Members</span>
                <div className="flex -space-x-2 overflow-hidden">
                  {g.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      title={m.name}
                      className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 bg-teal-50 flex items-center justify-center text-xs font-bold text-slate-700 uppercase"
                    >
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {g.members.length > 3 && (
                    <div className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      +{g.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {summary.groups.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-[4px_4px_0px_rgba(15,23,42,0.05)]">
            <p className="text-slate-500 font-medium">No groups yet. Create one above to get started!</p>
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
