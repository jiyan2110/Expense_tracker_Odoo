import React, { useState } from 'react';
const API = 'http://localhost:4000/api';

export default function OCRUpload({ token, onParsed, expenseId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  }

  async function upload() {
    if (!file) return alert('Please select a file');
    setLoading(true);
    
    try {
      const form = new FormData();
      form.append('receipt', file);
      
      const endpoint = expenseId 
        ? `${API}/expenses/${expenseId}/upload-receipt`
        : `${API}/expenses/ocr`;
        
      const res = await fetch(endpoint, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }, 
        body: form 
      });
      
      const data = await res.json();
      setLoading(false);
      
      if (res.ok) {
        if (onParsed) onParsed(data);
        alert('Receipt processed successfully!');
      } else {
        alert(data.error || 'OCR processing failed');
      }
    } catch (error) {
      setLoading(false);
      alert('Upload failed. Please try again.');
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Upload receipt image
            </span>
            <span className="mt-1 block text-sm text-gray-500">
              PNG, JPG, JPEG up to 10MB
            </span>
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
        
        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Receipt preview"
              className="mx-auto h-32 w-auto rounded-lg object-cover"
            />
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={upload}
            disabled={loading || !file}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Process Receipt with OCR'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
