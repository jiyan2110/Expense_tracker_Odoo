import React, { useEffect, useState } from 'react';
const API_URL = 'http://localhost:4000'; // Base URL for constructing image paths

export default function Approvals({ token }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/expenses?pendingForMe=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load pending approvals');
        setPending([]);
      } else {
        setPending(Array.isArray(data) ? data : []);
      }
    } catch {
      setError('A network error occurred.');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function act(id, approve) {
    setPending(prev => prev.map(p => p._id === id ? { ...p, processing: true } : p));
    
    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: approve ? 'Approved' : 'Rejected' })
      });
      const j = await res.json();
      if (res.ok) {
        setPending(prev => prev.filter(p => p._id !== id));
      } else {
        alert(j.error || 'An error occurred');
        setPending(prev => prev.map(p => p._id === id ? { ...p, processing: false } : p));
      }
    } catch {
      alert('A network error occurred.');
      setPending(prev => prev.map(p => p._id === id ? { ...p, processing: false } : p));
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800">Pending Approvals</h2>
        <p className="mt-2 text-gray-600">Expenses waiting for your review.</p>
      </div>

      <section className="space-y-4">
        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && pending.length === 0 && (
          <p className="text-center text-gray-500">You have no pending approvals.</p>
        )}
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map(e => (
            <div
              key={e._id}
              className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <h4 className="font-semibold text-gray-800 text-lg mb-2">{e.description || '—'}</h4>

                {/* --- NEW IMAGE DISPLAY SECTION --- */}
                {e.receipts && e.receipts.length > 0 && (
                  <div className="my-4">
                    <a href={`${API_URL}/${e.receipts[0].replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">
                      <img
                        src={`${API_URL}/${e.receipts[0].replace(/\\/g, '/')}`}
                        alt="Receipt"
                        className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                      />
                    </a>
                  </div>
                )}
                {/* --- END NEW SECTION --- */}

                <p className="text-gray-600 mt-2">
                  Amount: <span className="font-medium">{e.amount} {e.currency}</span>
                </p>
                <p className="text-gray-500 mt-1 text-sm">
                  Company Currency: ~{e.amountInCompanyCurrency}
                </p>
                <p className="text-gray-500 mt-1 text-sm">Submitted by: {e.userId?.name || '—'}</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => act(e._id, true)}
                  disabled={e.processing}
                  className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {e.processing ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => act(e._id, false)}
                  disabled={e.processing}
                  className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {e.processing ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}