import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function SettleUpModal({ isOpen, onClose, groupId = null, onSuccess }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [members, setMembers] = useState([]);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes or groupId changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      setFromUserId('');
      setToUserId('');

      if (groupId) {
        setSelectedGroupId(groupId);
      } else {
        setSelectedGroupId('');
        // Fetch groups if not inside a group view
        api.get('/balances/dashboard')
          .then(({ data }) => setGroups(data.groups || []))
          .catch(() => setError('Failed to load groups'));
      }
    }
  }, [isOpen, groupId]);

  // Fetch members when group changes
  useEffect(() => {
    if (selectedGroupId) {
      api.get(`/memberships/groups/${selectedGroupId}/members`)
        .then(({ data }) => {
          // Only show active members
          const active = data.filter(m => !m.leftAt);
          setMembers(active);
          if (active.length > 0) {
            setFromUserId(active[0].userId.toString());
            if (active.length > 1) {
              setToUserId(active[1].userId.toString());
            }
          }
        })
        .catch(() => setError('Failed to load group members'));
    } else {
      setMembers([]);
    }
  }, [selectedGroupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !fromUserId || !toUserId || !amount) {
      setError('Please fill in all required fields');
      return;
    }
    if (fromUserId === toUserId) {
      setError('Sender and recipient must be different members');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/payments/groups/${selectedGroupId}`, {
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        amount: Number(amount),
        date,
        note: note.trim() || null,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Record a Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Selector */}
          {!groupId && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Group
              </label>
              <select
                required
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="form-input w-full"
              >
                <option value="">-- Choose a Group --</option>
                {groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedGroupId && members.length > 0 ? (
            <>
              {/* From / To Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Who Paid?
                  </label>
                  <select
                    required
                    value={fromUserId}
                    onChange={(e) => setFromUserId(e.target.value)}
                    className="form-input w-full"
                  >
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Who was Paid?
                  </label>
                  <select
                    required
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="form-input w-full"
                  >
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input w-full pl-8"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input w-full"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Cash settlement, GPay"
                  className="form-input w-full"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Record'
                  )}
                </button>
              </div>
            </>
          ) : selectedGroupId ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Loading members...
            </p>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              Select a group to see members and record a payment.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
