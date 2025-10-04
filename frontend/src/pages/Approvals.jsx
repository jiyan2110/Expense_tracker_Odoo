import React, { useEffect, useState } from 'react';
import './Approvals.css';
const API = 'http://localhost:4000/api';

export default function Approvals({ token, user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadExpenses();
  }, [token, filter]);

  async function loadExpenses() {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/expenses`;
      if (filter === 'pending') {
        url += '?status=WaitingApproval';
      } else if (filter === 'approved') {
        url += '?status=Approved';
      } else if (filter === 'rejected') {
        url += '?status=Rejected';
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to load expenses');
      else setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  async function act(id, approve) {
    try {
      const res = await fetch(`${API}/expenses/${id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment || (approve ? 'Approved' : 'Rejected') })
      });
      const data = await res.json();
      if (res.ok) {
        setComment('');
        loadExpenses();
        alert(approve ? 'Expense approved successfully!' : 'Expense rejected.');
      } else {
        alert(data.error || 'Error processing request');
      }
    } catch {
      alert('Network error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true;
    if (filter === 'pending') return expense.status === 'WaitingApproval';
    if (filter === 'approved') return expense.status === 'Approved';
    if (filter === 'rejected') return expense.status === 'Rejected';
    return true;
  });

  return (
    <div className="space-y-6">
  {/* Header */}
  <div className="bg-white/90 rounded-lg shadow p-6 backdrop-blur-md border border-white/50">
    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
      Expense Approvals
    </h1>
    <p className="text-gray-600 mt-1">Review and approve expense requests</p>
  </div>

  {/* Filter Tabs */}
  <div className="bg-white/90 rounded-lg shadow backdrop-blur-md border border-white/50">
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 px-6">
        {[
          { key: 'all', label: 'All Expenses' },
          { key: 'pending', label: 'Pending Approval' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === tab.key
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>

    <div className="p-6">
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No expenses found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map(expense => (
            <div
              key={expense._id}
              className="bg-white/80 rounded-lg p-6 border border-white/30 shadow-sm backdrop-blur-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expense.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : expense.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : expense.status === 'WaitingApproval'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {expense.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Amount:</span> {expense.amount} {expense.currency}
                      {expense.amountInCompanyCurrency && (
                        <span className="text-gray-500 ml-1">
                          ({expense.amountInCompanyCurrency} {expense.companyCurrency})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {expense.category}
                    </div>
                    <div>
                      <span className="font-medium">Submitted by:</span> {expense.submittedBy?.name}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(expense.expenseDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Paid by:</span> {expense.paidBy}
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span> {new Date(expense.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {expense.remarks && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Remarks:</span>
                      <p className="text-gray-600 mt-1">{expense.remarks}</p>
                    </div>
                  )}

                  {/* Approval History */}
                  {expense.approvals?.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">Approval History:</span>
                      <div className="mt-2 space-y-2">
                        {expense.approvals.map((approval, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                approval.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {approval.approved ? 'Approved' : 'Rejected'}
                            </span>
                            <span className="text-gray-600">
                              by {approval.userId?.name} on {new Date(approval.time).toLocaleString()}
                            </span>
                            {approval.comment && <span className="text-gray-500 ml-2">- {approval.comment}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {expense.status === 'WaitingApproval' && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <div className="mb-3">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add a comment (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => act(expense._id, true)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(expense._id, false)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

  );
}
