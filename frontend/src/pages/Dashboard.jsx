import React, { useEffect, useState } from 'react';
const API = 'http://localhost:4000/api';

export default function Dashboard({ user }) {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Dashboard.jsx (AFTER)

    async function load() {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API}/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Check if the response was successful (status code 200-299)
        if (res.ok) {
          const data = await res.json();
          setExpenses(data); // This will be an array
        } else {
          // If there's an error (like 401), log it and keep expenses as an empty array
          console.error("Failed to fetch expenses:", res.statusText);
          setExpenses([]); // Prevent the .map() crash
        }
      } catch (error) {
        console.error("A network error occurred:", error);
        setExpenses([]); // Also prevent crash on network error
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome, <span className="font-medium">{user?.name}</span>. Role: <span className="font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Recent Expenses */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-500">No recent expenses.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map(e => (
              <div
                key={e._id}
                className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
              >
                <h4 className="font-semibold text-gray-800 text-lg">{e.description || '—'}</h4>
                <p className="text-gray-600 mt-2">
                  Amount: <span className="font-medium">{e.amount} {e.currency}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  Status:{' '}
                  <span className={`font-semibold ${
                    e.status === 'Approved' ? 'text-green-600' :
                    e.status === 'Rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>{e.status}</span>
                </p>
                <p className="text-gray-500 mt-1 text-sm">Submitted by: {e.userId?.name || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
