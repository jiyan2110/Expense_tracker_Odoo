import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OCRUpload from '../components/OCRUpload';
import './SubmitExpense.css';
const API = 'http://localhost:4000/api';

const categories = [
  'Food & Dining',
  'Transportation',
  'Accommodation',
  'Office Supplies',
  'Entertainment',
  'Travel',
  'Meals',
  'Fuel',
  'Other'
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF'];

export default function SubmitExpense({ token, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    currency: 'USD',
    paidBy: 'Cash',
    remarks: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [expenseId, setExpenseId] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createExpense = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setExpenseId(data._id);
        alert('Expense created successfully! You can now upload receipts.');
      } else {
        alert(data.error || 'Failed to create expense');
      }
    } catch (error) {
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async () => {
    if (!expenseId) return;
    
    setLoading(true);
    try {
      console.log('Submitting expense:', expenseId);
      const res = await fetch(`${API}/expenses/${expenseId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        alert('Expense submitted for approval!');
        navigate('/');
      } else {
        console.error('Submit failed:', data);
        alert(data.error || 'Failed to submit expense');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOCRData = (data) => {
    if (data.expense && data.expense.ocrData) {
      const ocrData = data.expense.ocrData;
      setFormData(prev => ({
        ...prev,
        description: ocrData.merchant || prev.description,
        amount: ocrData.amount ? ocrData.amount.toString() : prev.amount,
        expenseDate: ocrData.date ? new Date(ocrData.date).toISOString().split('T')[0] : prev.expenseDate
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
  {/* Header */}
  <div className="bg-white/90 rounded-lg shadow p-6 backdrop-blur-md border border-white/50">
    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
      Submit New Expense
    </h1>
    <p className="text-gray-600 mt-1">
      Fill in the details below to submit your expense for approval
    </p>
  </div>

  {/* Progress Steps */}
  <div className="bg-white/90 rounded-lg shadow p-6 backdrop-blur-md border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            !expenseId ? 'bg-teal-500 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          1
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900">Draft</span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            expenseId ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}
        >
          2
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900">
          Waiting Approval
        </span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-300 text-gray-500">
          3
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900">Approved</span>
      </div>
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Expense Form */}
    <div className="bg-white/90 rounded-lg shadow p-6 backdrop-blur-md border border-white/50">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Details</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g., Restaurant bill, Taxi fare"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expense Date
          </label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Paid By</label>
          <select
            name="paidBy"
            value={formData.paidBy}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Company">Company</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={createExpense}
            disabled={loading || !formData.description || !formData.amount || !formData.category}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
          >
            {loading ? 'Creating...' : 'Create Expense'}
          </button>

          {expenseId && (
            <button
              type="button"
              onClick={submitExpense}
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </form>
    </div>

    {/* Receipt Upload */}
    <div className="bg-white/90 rounded-lg shadow p-6 backdrop-blur-md border border-white/50">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Attach Receipt</h2>
      <OCRUpload token={token} expenseId={expenseId} onParsed={handleOCRData} />
    </div>
  </div>
</div>

  );
}
