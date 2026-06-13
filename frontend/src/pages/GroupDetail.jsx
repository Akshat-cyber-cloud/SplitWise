import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SettleUpModal from '../components/SettleUpModal';

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user: currentUser } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & Inline Form States
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null); // stores userId being removed
  
  // Form Input States
  const [selectedUserId, setSelectedUserId] = useState('');
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().slice(0, 10));
  const [leftAt, setLeftAt] = useState(new Date().toISOString().slice(0, 10));
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroupData = async () => {
    try {
      const [grpRes, expRes, balRes, usersRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/expenses/groups/${groupId}`),
        api.get(`/balances/groups/${groupId}`),
        api.get('/auth/users'),
      ]);
      setGroup(grpRes.data);
      setExpenses(expRes.data.slice(0, 5)); // Just take 5 most recent
      setBalances(balRes.data);
      setSystemUsers(usersRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/memberships/groups/${groupId}/members`, {
        userId: Number(selectedUserId),
        joinedAt,
      });
      setIsAddingMember(false);
      setSelectedUserId('');
      setJoinedAt(new Date().toISOString().slice(0, 10));
      fetchGroupData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (e) => {
    e.preventDefault();
    if (!removingMemberId) return;

    setActionLoading(true);
    setError('');
    try {
      await api.delete(`/memberships/groups/${groupId}/members/${removingMemberId}`, {
        data: { leftAt }
      });
      setRemovingMemberId(null);
      setLeftAt(new Date().toISOString().slice(0, 10));
      fetchGroupData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReaddMember = async (userId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/memberships/groups/${groupId}/members`, {
        userId,
        joinedAt: new Date().toISOString().slice(0, 10),
      });
      fetchGroupData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to re-add member');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter out system users who are already active members
  const availableUsers = systemUsers.filter(
    (u) => !balances.some((b) => b.user.id === u.id && !b.leftAt)
  );

  const formatCurrency = (amount, currency, amountInInr) => {
    const inrVal = Number(amountInInr);
    const origVal = Number(amount);

    if (currency === 'INR') {
      return (
        <span className="font-bold text-slate-900">
          ₹{inrVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    const symbols = { USD: '$', EUR: '€', GBP: '£', SGD: 'S$', AED: 'AED ' };
    const sym = symbols[currency] || `${currency} `;
    
    return (
      <div className="flex flex-col items-end">
        <span className="font-bold text-slate-900">
          ₹{inrVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-slate-400 font-medium mt-0.5">
          (orig. {sym}{origVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  const activeMembersCount = balances.filter(b => !b.leftAt).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-600">{group?.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{group?.name}</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {activeMembersCount} active members
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsSettleUpOpen(true)}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Settle Up
          </button>
          <Link to={`/groups/${groupId}/expenses`} className="btn btn-primary flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Balances summary & Recent Expenses */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Group Balance Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Group Balance Summary</h3>
              <Link to={`/groups/${groupId}/balances`} className="text-sm font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
                Drill-down Ledger &rarr;
              </Link>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {balances.filter(b => !b.leftAt).map((b) => (
                <Link
                  key={b.user.id}
                  to={`/groups/${groupId}/balances?userId=${b.user.id}`}
                  className="p-4 rounded-xl border border-slate-100 flex items-center justify-between bg-slate-50/20 hover:border-teal-200 hover:bg-slate-50 transition-all duration-150 group"
                >
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors">{b.user.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Paid: ₹{b.totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    {b.netBalance > 0 ? (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          owed
                        </span>
                        <p className="text-sm font-bold text-green-600 mt-1">₹{b.netBalance.toFixed(2)}</p>
                      </div>
                    ) : b.netBalance < 0 ? (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          owes
                        </span>
                        <p className="text-sm font-bold text-red-600 mt-1">₹{Math.abs(b.netBalance).toFixed(2)}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          settled
                        </span>
                        <p className="text-sm font-bold text-slate-400 mt-1">₹0.00</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Expenses List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Recent Expenses</h3>
              <Link to={`/groups/${groupId}/expenses`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                View all &rarr;
              </Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <div key={e.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      {e.paidBy?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{e.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Paid by {e.paidBy?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {formatCurrency(e.amount, e.currency, e.amountInInr)}
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {e.splitType}
                    </span>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-semibold text-sm">No expenses yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Add an expense above or import from CSV.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Dashboard Tools (CSV Import) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to={`/groups/${groupId}/import`} className="bg-white hover:border-teal-200 hover:shadow-md transition-all duration-200 border border-slate-200 rounded-2xl p-5 flex items-center justify-center gap-3 text-teal-800 font-semibold shadow-sm">
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Expenses from CSV
            </Link>
            <button
              onClick={() => setIsSettleUpOpen(true)}
              className="bg-white hover:border-teal-200 hover:shadow-md transition-all duration-200 border border-slate-200 rounded-2xl p-5 flex items-center justify-center gap-3 text-teal-800 font-semibold shadow-sm"
            >
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Record a Settlement Payment
            </button>
          </div>
        </div>

        {/* Right Column: Members and management */}
        <div className="space-y-6">
          
          {/* Members Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Members</h3>
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                {isAddingMember ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {/* Add Member Form */}
            {isAddingMember && (
              <form onSubmit={handleAddMember} className="p-4 border-b border-slate-100 bg-teal-50/20 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Select User
                  </label>
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="form-input text-sm w-full py-1.5"
                  >
                    <option value="">-- Choose User --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    required
                    value={joinedAt}
                    onChange={(e) => setJoinedAt(e.target.value)}
                    className="form-input text-sm w-full py-1.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !selectedUserId}
                  className="btn btn-primary text-xs w-full py-2"
                >
                  {actionLoading ? 'Adding...' : 'Add to Group'}
                </button>
              </form>
            )}

            {/* Soft-Remove Member Form */}
            {removingMemberId && (
              <form onSubmit={handleRemoveMember} className="p-4 border-b border-slate-100 bg-red-50/20 space-y-3">
                <p className="text-xs font-semibold text-red-700">
                  Select Leave Date for {balances.find(b => b.user.id === removingMemberId)?.user.name}:
                </p>
                <div>
                  <input
                    type="date"
                    required
                    value={leftAt}
                    onChange={(e) => setLeftAt(e.target.value)}
                    className="form-input text-sm w-full py-1.5"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRemovingMemberId(null)}
                    className="btn btn-secondary text-xs w-full py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-danger text-xs w-full py-1.5"
                  >
                    {actionLoading ? 'Removing...' : 'Confirm'}
                  </button>
                </div>
              </form>
            )}

            <div className="p-4 space-y-3">
              {/* Active Members */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Active</p>
              
              {balances.filter(b => !b.leftAt).map((b) => (
                <div key={b.user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm uppercase">
                    {b.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{b.user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Joined {new Date(b.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  
                  {/* Remove Button (Do not allow removing self easily or if balance is not 0) */}
                  {b.user.id !== currentUser?.id && (
                    <button
                      onClick={() => {
                        setRemovingMemberId(b.user.id);
                        setLeftAt(new Date().toISOString().slice(0, 10));
                        setIsAddingMember(false);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              {/* Inactive (Left) Members */}
              {balances.some(b => b.leftAt) && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Past Members</p>
                  {balances.filter(b => b.leftAt).map((b) => (
                    <div key={b.user.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 opacity-75">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm uppercase">
                        {b.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-500 text-sm truncate">{b.user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {new Date(b.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(b.leftAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleReaddMember(b.user.id)}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md transition-colors"
                      >
                        Re-add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        groupId={groupId}
        onSuccess={fetchGroupData}
      />
    </div>
  );
}
