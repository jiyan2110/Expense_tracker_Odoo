import React, { useState } from 'react';
import OCRUpload from '../components/OCRUpload';
const API = 'http://localhost:4000/api';

export default function SubmitExpense({ token, user }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'USD');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('amount', amount);
    form.append('currency', currency);
    form.append('category', category);
    form.append('description', description);
    if (receiptFile) form.append('receipts', receiptFile);

    const res = await fetch(`${API}/expenses`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const data = await res.json();
    if (res.ok) {
      alert('Submitted');
      window.location.href = '/';
    } else alert(data.error || 'Error');
  };

  return (
    <div>
      <h2>Submit Expense</h2>
      <form onSubmit={submit} style={{ maxWidth: 600 }}>
        <div>
          <label>Amount</label><br />
          <input value={amount} onChange={e=>setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Currency</label><br />
          <input value={currency} onChange={e=>setCurrency(e.target.value)} />
        </div>
        <div>
          <label>Category</label><br />
          <input value={category} onChange={e=>setCategory(e.target.value)} />
        </div>
        <div>
          <label>Description</label><br />
          <input value={description} onChange={e=>setDescription(e.target.value)} />
        </div>

        <div>
          <label>Receipt (image)</label><br />
          <input type="file" accept="image/*" onChange={e=>setReceiptFile(e.target.files[0])} />
        </div>

        <OCRUpload token={token} onParsed={data=>{ if (data.parsed) { if (data.parsed.amount) setAmount(String(data.parsed.amount)); if (data.parsed.merchant) setDescription(data.parsed.merchant); } }} />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
