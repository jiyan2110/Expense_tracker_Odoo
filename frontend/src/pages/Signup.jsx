import React, { useState, useEffect } from 'react';
const API = 'http://localhost:4000/api';

export default function Signup({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    try {
      console.log('Fetching countries from:', `${API}/auth/countries`);
      const res = await fetch(`${API}/auth/countries`);
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Countries data:', data);
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      // Fallback countries if API fails
      setCountries([
        { name: 'United States', currency: 'USD', currencySymbol: '$' },
        { name: 'India', currency: 'INR', currencySymbol: '₹' },
        { name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
        { name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
        { name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
        { name: 'Germany', currency: 'EUR', currencySymbol: '€' },
        { name: 'France', currency: 'EUR', currencySymbol: '€' },
        { name: 'Japan', currency: 'JPY', currencySymbol: '¥' }
      ]);
    } finally {
      setCountriesLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setLoading(true);
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, companyName, country })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      onAuth(data.token, data.user);
      window.location.href = '/';
    } else {
      alert(data.error || 'Signup failed');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account ✨</h2>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Company Name</label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              required
              disabled={countriesLoading}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">
                {countriesLoading ? 'Loading countries...' : 'Select a country'}
              </option>
              {countries.map((c, index) => (
                <option key={index} value={c.name}>
                  {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 font-medium hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}
