import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const SPLIT_TYPES = ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'];
const CURRENCIES  = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

export default function ExpensesPage() {
  const { groupId } = useParams();
  const [expenses, setExpenses]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');

  const blankForm = {
    description: '', amount: '', currency: 'INR', paidById: '',
    date: new Date().toISOString().slice(0, 10), splitType: 'EQUAL',
    splitData: {},
  };
  const [form, setForm] = useState(blankForm);

  const fetchAll = async () => {
    const [expRes, memRes] = await Promise.all([
      api.get(`/expenses/groups/${groupId}`),
      api.get(`/memberships/groups/${groupId}/members`),
    ]);
    setExpenses(expRes.data);
    setMembers(memRes.data.filter((m) => !m.leftAt));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    // Build splitData based on type
    let splitData;
    if (form.splitType === 'EQUAL') {
      splitData = { userIds: members.map((m) => m.userId) };
    } else {
      splitData = form.splitData;
    }
    try {
      await api.post(`/expenses/groups/${groupId}`, { ...form, splitData });
      setForm(blankForm); setShowForm(false); fetchAll();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create expense'); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h1>Expenses</h1>
        <button id="add-expense-btn" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>New Expense</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Description</label>
                <input id="exp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input id="exp-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input id="exp-amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select id="exp-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Paid by</label>
                <select id="exp-paidby" value={form.paidById} onChange={(e) => setForm({ ...form, paidById: e.target.value })} required>
                  <option value="">Select member</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Split type</label>
                <select id="exp-splittype" value={form.splitType} onChange={(e) => setForm({ ...form, splitType: e.target.value })}>
                  {SPLIT_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button id="save-expense-btn" type="submit" className="btn btn-primary">Save Expense</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Paid by</th><th>Split</th></tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="text-muted">{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.description}</td>
                  <td>
                    {e.currency !== 'INR'
                      ? `${e.currency} ${Number(e.amount).toFixed(2)} (₹${Number(e.amountInInr).toFixed(2)})`
                      : `₹${Number(e.amountInInr).toFixed(2)}`}
                  </td>
                  <td>{e.paidBy?.name}</td>
                  <td><span className="badge badge-primary">{e.splitType}</span></td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No expenses yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
