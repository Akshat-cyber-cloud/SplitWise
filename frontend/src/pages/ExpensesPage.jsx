import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const SPLIT_TYPES = ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

export default function ExpensesPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const blankForm = {
    description: '',
    amount: '',
    currency: 'INR',
    paidById: '',
    date: new Date().toISOString().slice(0, 10),
    splitType: 'EQUAL',
    splitData: {},
  };
  const [form, setForm] = useState(blankForm);
  const [splits, setSplits] = useState({});

  const fetchAll = async () => {
    try {
      const [grpRes, expRes, memRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/expenses/groups/${groupId}`),
        api.get(`/memberships/groups/${groupId}/members`),
      ]);
      setGroup(grpRes.data);
      setExpenses(expRes.data);
      const activeMembers = memRes.data.filter((m) => !m.leftAt);
      setMembers(activeMembers);
      
      // Pre-select current user as payer if they are in the group
      const localUser = JSON.parse(localStorage.getItem('user'));
      if (localUser && activeMembers.some(m => m.userId === localUser.id)) {
        setForm(f => ({ ...f, paidById: localUser.id.toString() }));
      } else if (activeMembers.length > 0) {
        setForm(f => ({ ...f, paidById: activeMembers[0].userId.toString() }));
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [groupId]);

  // Handle setting default split values when type or members change
  useEffect(() => {
    const defaultSplits = {};
    members.forEach((m) => {
      if (form.splitType === 'EQUAL') {
        defaultSplits[m.userId] = true;
      } else if (form.splitType === 'SHARES') {
        defaultSplits[m.userId] = '1';
      } else {
        defaultSplits[m.userId] = '';
      }
    });
    setSplits(defaultSplits);
  }, [form.splitType, members]);

  const getExchangeRate = async (from, date) => {
    if (from === 'INR') return 1;
    const { data } = await api.get(`/expenses/exchange-rate?from=${from}&to=INR&date=${date}`);
    return data.rate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    const numAmount = Number(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    let splitData = {};
    let rate = 1;

    try {
      if (form.currency !== 'INR') {
        rate = await getExchangeRate(form.currency, form.date);
      }
    } catch {
      setError('Failed to fetch current currency exchange rate. Saving with fallback rate 1.0.');
    }

    const amountInInr = numAmount * rate;

    if (form.splitType === 'EQUAL') {
      const selectedUserIds = Object.keys(splits)
        .filter((id) => splits[id] === true)
        .map(Number);

      if (selectedUserIds.length === 0) {
        setError('At least one member must be selected for the equal split');
        return;
      }
      splitData = { userIds: selectedUserIds };
    } else if (form.splitType === 'EXACT') {
      const sum = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);
      if (Math.abs(sum - numAmount) > 0.01) {
        setError(`Exact splits sum (${sum.toFixed(2)}) must equal the total amount (${numAmount.toFixed(2)})`);
        return;
      }
      
      // Convert exact splits into INR values for the backend
      splitData = {
        splits: members.map((m) => ({
          userId: m.userId,
          amount: Number(splits[m.userId] || 0) * rate,
        })),
      };
    } else if (form.splitType === 'PERCENTAGE') {
      const sum = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Percentage splits sum (${sum}%) must equal 100%`);
        return;
      }
      splitData = {
        splits: members.map((m) => ({
          userId: m.userId,
          percentage: Number(splits[m.userId] || 0),
        })),
      };
    } else if (form.splitType === 'SHARES') {
      const sum = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);
      if (sum <= 0) {
        setError('Total shares split must be greater than 0');
        return;
      }
      splitData = {
        splits: members.map((m) => ({
          userId: m.userId,
          shares: Number(splits[m.userId] || 0),
        })),
      };
    }

    try {
      await api.post(`/expenses/groups/${groupId}`, {
        ...form,
        amount: numAmount,
        splitData,
      });
      setForm(blankForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create expense');
    }
  };

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

  // Calculate live breakdown totals for UX validation
  const calculatedSum = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Link to="/groups" className="hover:text-teal-800 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/groups/${groupId}`} className="hover:text-teal-800 transition-colors">{group?.name}</Link>
        <span>/</span>
        <span className="text-slate-600">Expenses</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-slate-500 mt-1">Record and track group spending</p>
        </div>
        <button
          id="add-expense-btn"
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            'Cancel'
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>{' '}
              Add Expense
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
          <h3 className="text-lg font-bold text-slate-900 mb-6">New Expense Details</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <input
                  id="exp-desc"
                  placeholder="e.g. Dinner at the beach"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="form-input text-lg py-3"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">Amount & Currency</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-colors">
                  <select
                    id="exp-currency"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="bg-slate-50 border-r border-slate-200 px-3 py-2.5 text-slate-700 font-medium focus:outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    className="flex-1 px-4 py-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">Date</label>
                <input
                  id="exp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">Paid by</label>
                <select
                  id="exp-paidby"
                  value={form.paidById}
                  onChange={(e) => setForm({ ...form, paidById: e.target.value })}
                  required
                  className="form-input bg-slate-50"
                >
                  <option value="" disabled>
                    Select member
                  </option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">Split type</label>
                <select
                  id="exp-splittype"
                  value={form.splitType}
                  onChange={(e) => setForm({ ...form, splitType: e.target.value })}
                  className="form-input bg-slate-50"
                >
                  {SPLIT_TYPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Per-Person Split Breakdown Section */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Split Breakdown ({form.splitType})
                </p>
                {form.splitType !== 'EQUAL' && (
                  <span className={`text-xs font-bold ${
                    form.splitType === 'EXACT' && Math.abs(calculatedSum - Number(form.amount || 0)) <= 0.01 ? 'text-green-600' :
                    form.splitType === 'PERCENTAGE' && Math.abs(calculatedSum - 100) <= 0.01 ? 'text-green-600' :
                    form.splitType === 'SHARES' && calculatedSum > 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {form.splitType === 'EXACT' && `Total Assigned: ${form.currency} ${calculatedSum.toFixed(2)} / ${Number(form.amount || 0).toFixed(2)}`}
                    {form.splitType === 'PERCENTAGE' && `Total: ${calculatedSum.toFixed(2)}% / 100%`}
                    {form.splitType === 'SHARES' && `Total Shares: ${calculatedSum}`}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {members.map((m) => {
                  const val = splits[m.userId] ?? '';
                  return (
                    <div key={m.userId} className="flex items-center justify-between gap-4 py-1">
                      <span className="text-sm font-semibold text-slate-700">{m.user.name}</span>
                      
                      {form.splitType === 'EQUAL' && (
                        <input
                          type="checkbox"
                          checked={val === true}
                          onChange={(e) => setSplits({ ...splits, [m.userId]: e.target.checked })}
                          className="rounded border-slate-300 text-teal-800 focus:ring-teal-500 h-5 w-5 cursor-pointer"
                        />
                      )}

                      {form.splitType === 'EXACT' && (
                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                            {form.currency === 'INR' ? '₹' : form.currency}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={val}
                            onChange={(e) => setSplits({ ...splits, [m.userId]: e.target.value })}
                            className="form-input text-right w-full pl-10 pr-3 py-1.5 text-sm"
                          />
                        </div>
                      )}

                      {form.splitType === 'PERCENTAGE' && (
                        <div className="relative w-28">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={val}
                            onChange={(e) => setSplits({ ...splits, [m.userId]: e.target.value })}
                            className="form-input text-right w-full pr-8 py-1.5 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                        </div>
                      )}

                      {form.splitType === 'SHARES' && (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="1"
                          value={val}
                          onChange={(e) => setSplits({ ...splits, [m.userId]: e.target.value })}
                          className="form-input text-right w-28 py-1.5 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button id="save-expense-btn" type="submit" className="btn btn-primary px-8">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900">Transaction History</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <div key={e.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl shrink-0">
                {e.paidBy?.name?.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-slate-900 truncate pr-4 text-lg">{e.description}</p>
                  <div className="shrink-0 text-right">
                    {formatCurrency(e.amount, e.currency, e.amountInInr)}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <p className="text-slate-500 truncate">
                    {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="mx-1.5">•</span>
                    Paid by <span className="font-medium text-slate-700">{e.paidBy?.name}</span>
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium tracking-wide">
                    {e.splitType}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No expenses yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your first group expense above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
