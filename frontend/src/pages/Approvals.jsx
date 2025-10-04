import React, { useEffect, useState } from 'react';
const API = 'http://localhost:4000/api';

export default function Approvals({ token }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/expenses?pendingForMe=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) setError(data.error || 'Failed to load pending approvals');
        else setPending(Array.isArray(data) ? data : []);
      } catch {
        setError('Network error'); setPending([]);
      } finally { setLoading(false); }
    }
    load();
  }, [token]);

  async function act(id, approve) {
    try {
      const res = await fetch(`${API}/expenses/${id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: approve ? 'Approved' : 'Rejected' })
      });
      const j = await res.json();
      if (res.ok) setPending(prev => prev.filter(p => p._id !== id));
      else alert(j.error || 'Error');
    } catch { alert('Network error'); }
  }

  if (loading) return <p>Loading pending approvals...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
      {pending.length === 0 && <p className="text-gray-500">No pending approvals</p>}
      <div className="grid gap-4">
        {pending.map(e => (
          <div key={e._id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
            <h4 className="font-semibold text-gray-800">{e.description || '—'}</h4>
            <p className="text-gray-600 mt-1">
              Amount: <span className="font-medium">{e.amount} {e.currency}</span> (Company: {e.amountInCompanyCurrency})
            </p>
            <p className="text-gray-500 text-sm mt-1">Submitted by: {e.userId?.name || '—'}</p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => act(e._id, true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => act(e._id, false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
