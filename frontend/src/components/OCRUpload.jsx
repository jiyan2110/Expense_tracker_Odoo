import React, { useState } from 'react';
const API = 'http://localhost:4000/api';

export default function OCRUpload({ token, onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return alert('Choose file');
    setLoading(true);
    const form = new FormData();
    form.append('receipt', file);
    const res = await fetch(`${API}/expenses/ocr`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      alert('OCR parsed — check console');
      console.log('OCR', data);
      if (onParsed) onParsed(data);
    } else alert(data.error || 'OCR failed');
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} />
        <button onClick={upload} disabled={loading}>{loading ? 'Parsing...' : 'Parse receipt (OCR)'}</button>
      </div>
    </div>
  );
}
