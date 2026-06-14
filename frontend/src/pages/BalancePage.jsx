import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

/**
 * Greedy simplification: given net balances, produce the minimum list of
 * "person A pays person B ₹X" transactions.
 */
function computeSettlements(balances) {
  // work in paise to avoid float issues
  let debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ name: b.user.name, amount: -b.netBalance }))
    .sort((a, b) => b.amount - a.amount);

  let creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ name: b.user.name, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount);

  const txns = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.005) {
      txns.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }
  return txns;
}

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

  const fmt = (n) =>
    `₹${Number(Math.abs(n)).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const settlements = computeSettlements(balances);
  const allSettled = balances.every((b) => Math.abs(b.netBalance) < 0.01);

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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group Balances</h1>
        <p className="text-slate-500 mt-1 text-sm">Click any member to see exactly which expenses make up their balance.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* ── SETTLE UP BANNER ── */}
      <div className="mb-8">
        {allSettled ? (
          <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-6 py-4">
            <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-emerald-800">All settled up! 🎉</p>
              <p className="text-emerald-700 text-sm">Everyone in this group is even. No payments needed.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a] overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-900 bg-slate-50 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                How to Settle Up — {settlements.length} payment{settlements.length !== 1 ? 's' : ''} needed
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  {/* Avatar from */}
                  <div className="w-9 h-9 rounded-full bg-red-100 border-2 border-slate-900 flex items-center justify-center font-black text-slate-800 text-sm shrink-0">
                    {s.from[0]}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">
                      <span className="text-red-600">{s.from}</span>
                      {' '}pays{' '}
                      <span className="text-teal-700">{s.to}</span>
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>

                  {/* Avatar to */}
                  <div className="w-9 h-9 rounded-full bg-teal-100 border-2 border-slate-900 flex items-center justify-center font-black text-slate-800 text-sm shrink-0">
                    {s.to[0]}
                  </div>

                  {/* Amount pill */}
                  <span className="ml-2 px-4 py-1.5 bg-slate-900 text-white text-sm font-black rounded-full font-mono">
                    {fmt(s.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                💡 These are the <strong>minimum number of payments</strong> needed to settle the group. Click any member below to see the full breakdown of their expenses.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Member Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Member Balances</p>
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
                      <span className={`font-bold text-base ${isOwed ? 'text-teal-700' : owes ? 'text-red-600' : 'text-slate-500'}`}>
                        {fmt(b.netBalance)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isOwed ? 'text-teal-600' : owes ? 'text-red-500' : 'text-slate-400'}`}>
                        {isOwed
                          ? '← gets money back'
                          : owes
                          ? '→ needs to pay'
                          : '✓ all settled'}
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* ── BLOCK 1: Big verdict + action ── */}
              <div className={`px-6 py-6 ${detail.netBalance < 0 ? 'bg-red-50' : detail.netBalance > 0 ? 'bg-teal-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-xl text-slate-700 shadow-sm">
                    {detail.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{detail.user.name}</p>
                    {detail.netBalance < 0 ? (
                      <p className="text-2xl font-black text-red-600">Owes {fmt(detail.netBalance)}</p>
                    ) : detail.netBalance > 0 ? (
                      <p className="text-2xl font-black text-teal-700">Gets back {fmt(detail.netBalance)}</p>
                    ) : (
                      <p className="text-2xl font-black text-slate-500">All settled ✓</p>
                    )}
                  </div>
                </div>

                {/* Specific payment actions for this person */}
                {(() => {
                  const myPayments = settlements.filter((s) => s.from === detail.user.name);
                  const myReceipts = settlements.filter((s) => s.to === detail.user.name);
                  return (
                    <div className="space-y-2">
                      {myPayments.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100 shadow-sm">
                          <p className="font-bold text-slate-800 text-sm">
                            Send <span className="text-red-600 font-black">{fmt(s.amount)}</span> to <span className="font-black">{s.to}</span>
                          </p>
                          <span className="text-slate-400">→</span>
                        </div>
                      ))}
                      {myReceipts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-teal-100 shadow-sm">
                          <p className="font-bold text-slate-800 text-sm">
                            <span className="font-black">{s.from}</span> will send <span className="text-teal-600 font-black">{fmt(s.amount)}</span>
                          </p>
                          <span className="text-slate-400">←</span>
                        </div>
                      ))}
                      {myPayments.length === 0 && myReceipts.length === 0 && detail.netBalance === 0 && (
                        <p className="text-sm text-slate-500 font-medium">No action needed — already even! 🎉</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── BLOCK 2: Simple math — no jargon ── */}
              <div className="px-6 py-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">How we calculated this</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Money {detail.user.name} paid for the group</span>
                    <span className="font-bold text-teal-700">+{fmt(detail.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{detail.user.name}'s share of all expenses</span>
                    <span className="font-bold text-red-600">−{fmt(detail.totalOwed)}</span>
                  </div>
                  {detail.breakdown.sentPayments.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Already paid back</span>
                      <span className="font-bold text-teal-700">
                        +{fmt(detail.breakdown.sentPayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                  )}
                  {detail.breakdown.receivedPayments.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Already received back</span>
                      <span className="font-bold text-red-600">
                        −{fmt(detail.breakdown.receivedPayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                      <span className="text-sm font-black text-slate-900">= Net balance</span>
                      <span className={`font-black text-lg ${detail.netBalance < 0 ? 'text-red-600' : detail.netBalance > 0 ? 'text-teal-700' : 'text-slate-500'}`}>
                        {detail.netBalance < 0 ? '−' : detail.netBalance > 0 ? '+' : ''}{fmt(detail.netBalance)}
                      </span>
                    </div>
                    {detail.netBalance < 0 && (
                      <p className="text-[11px] text-red-500 font-medium mt-1.5 leading-tight text-right">
                        *A negative balance means {detail.user.name} consumed more of the group's money than they paid out of pocket, so they owe the difference.
                      </p>
                    )}
                    {detail.netBalance > 0 && (
                      <p className="text-[11px] text-teal-600 font-medium mt-1.5 leading-tight text-right">
                        *A positive balance means {detail.user.name} paid more for the group than their own share, so the group owes them back.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── BLOCK 3: Expense log (collapsed by default) ── */}
              <details className="border-t border-slate-100 group">
                <summary className="px-6 py-4 cursor-pointer flex justify-between items-center select-none hover:bg-slate-50 transition-colors list-none">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    See full expense list ↓
                  </span>
                  <svg className="w-4 h-4 text-slate-300 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 space-y-5">
                  {detail.breakdown.paidExpenses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expenses {detail.user.name} paid</p>
                      <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                        {detail.breakdown.paidExpenses.map((e) => (
                          <div key={e.id} className="flex justify-between items-center px-4 py-3 bg-white">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{e.description}</p>
                              <p className="text-[10px] text-slate-400">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span className="text-teal-600 font-bold text-sm">+{fmt(e.amountInInr)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.breakdown.splitRows.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{detail.user.name}'s share in each expense</p>
                      <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                        {detail.breakdown.splitRows.map((r) => (
                          <div key={r.id} className="flex justify-between items-center px-4 py-3 bg-white">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{r.expense?.description}</p>
                              <p className="text-[10px] text-slate-400">{new Date(r.expense?.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span className="text-red-500 font-bold text-sm">−{fmt(r.shareAmount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-dashed h-64 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Select a member</h3>
              <p className="text-slate-500 text-sm">Click any name on the left to see who they need to pay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
