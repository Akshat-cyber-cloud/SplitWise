import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function BalancePage() {
  const { groupId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const viewDetail = async (userId) => {
    setSelected(userId);
    if (Number(searchParams.get('userId')) !== userId) {
      setSearchParams({ userId });
    }
    try {
      const { data } = await api.get(`/balances/groups/${groupId}/members/${userId}`);
      setDetail(data);
    } catch {
      setDetail(null);
    }
  };

  const fetchBalances = async () => {
    try {
      const [grpRes, balRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/balances/groups/${groupId}`),
      ]);
      setGroup(grpRes.data);
      setBalances(balRes.data);

      const urlUserId = searchParams.get('userId');
      if (urlUserId) {
        viewDetail(Number(urlUserId));
      } else {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser && balRes.data.some((b) => b.user.id === localUser.id)) {
          viewDetail(localUser.id);
        }
      }
    } catch {
      setError('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  const fmt = (n) => `₹${Number(Math.abs(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <span className="text-slate-600">Balances</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group Balances</h1>
        <p className="text-slate-500 mt-1">See who owes whom and detailed breakdowns.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Summary Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {balances.map((b) => {
            const isOwed = b.netBalance > 0;
            const owes = b.netBalance < 0;
            const isSelected = selected === b.user.id;

            return (
              <div
                key={b.user.id}
                className={`bg-white rounded-2xl p-5 cursor-pointer transition-all duration-150 border-2 ${
                  isSelected
                    ? 'border-teal-600 shadow-md ring-4 ring-teal-50'
                    : 'border-transparent shadow-sm border-slate-100 hover:border-teal-200'
                }`}
                onClick={() => viewDetail(b.user.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                      isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-base text-slate-900 truncate pr-2">{b.user.name}</strong>
                      <span className={`font-bold text-base ${isOwed ? 'text-green-600' : owes ? 'text-red-600' : 'text-slate-500'}`}>
                        {b.netBalance > 0 ? '+' : b.netBalance < 0 ? '-' : ''}
                        {fmt(b.netBalance)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {isOwed ? 'Gets back' : owes ? 'Owes' : 'Settled'}
                      </span>
                      {b.leftAt && (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-full font-bold uppercase tracking-wider">
                          Left Group
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Drill-down */}
        <div className="lg:col-span-7 sticky top-8">
          {detail ? (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-2xl uppercase">
                  {detail.user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{detail.user.name}'s Ledger</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500 font-semibold">Net Balance:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        detail.netBalance > 0
                          ? 'bg-green-50 text-green-800'
                          : detail.netBalance < 0
                          ? 'bg-red-50 text-red-800'
                          : 'bg-slate-50 text-slate-800'
                      }`}
                    >
                      {detail.netBalance > 0 ? '+' : detail.netBalance < 0 ? '-' : ''}
                      {fmt(detail.netBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50/30 rounded-xl p-4 border border-green-100/50">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-green-700">₹{detail.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-red-50/30 rounded-xl p-4 border border-red-100/50">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Total Share</p>
                  <p className="text-xl font-bold text-red-700">₹{detail.totalOwed.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Paid Expenses */}
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Expenses Paid</h4>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-100 px-4">
                      {detail.breakdown.paidExpenses.map((e) => (
                        <div key={e.id} className="flex justify-between items-center py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-sm">{e.description}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(e.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-green-600 font-bold text-sm">+{fmt(e.amountInInr)}</span>
                        </div>
                      ))}
                      {detail.breakdown.paidExpenses.length === 0 && (
                        <p className="text-slate-400 text-xs py-4 text-center">No expenses paid.</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Split Share Owed */}
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Share Owed</h4>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-100 px-4">
                      {detail.breakdown.splitRows.map((r) => (
                        <div key={r.id} className="flex justify-between items-center py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-sm">{r.expense?.description}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(r.expense?.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-red-500 font-bold text-sm">-{fmt(r.shareAmount)}</span>
                        </div>
                      ))}
                      {detail.breakdown.splitRows.length === 0 && (
                        <p className="text-slate-400 text-xs py-4 text-center">No shares owed.</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Payments Sent */}
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payments Sent (Settlements)</h4>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-100 px-4">
                      {detail.breakdown.sentPayments.map((p) => (
                        <div key={p.id} className="flex justify-between items-center py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-sm">Paid {p.toUser?.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-green-600 font-bold text-sm">+{fmt(p.amount)}</span>
                        </div>
                      ))}
                      {detail.breakdown.sentPayments.length === 0 && (
                        <p className="text-slate-400 text-xs py-4 text-center">No payments sent.</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Payments Received */}
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payments Received (Settlements)</h4>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-100 px-4">
                      {detail.breakdown.receivedPayments.map((p) => (
                        <div key={p.id} className="flex justify-between items-center py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-sm">Received from {p.fromUser?.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-red-500 font-bold text-sm">-{fmt(p.amount)}</span>
                        </div>
                      ))}
                      {detail.breakdown.receivedPayments.length === 0 && (
                        <p className="text-slate-400 text-xs py-4 text-center">No payments received.</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-dashed h-96 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Select a member</h3>
              <p className="text-slate-500">Click on any member card to view their detailed ledger.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
