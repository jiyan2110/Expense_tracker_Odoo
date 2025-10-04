import React, { useEffect, useState } from 'react';
const API = 'http://localhost:4000/api';

export default function AdminPanel({ token }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await res.json();
    setUsers(j);
  }

  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const j = await res.json();
    setLoading(false);
    if (res.ok) {
      alert('User created ✅');
      setName(''); setEmail(''); setPassword(''); setRole('Employee');
      load();
    } else alert(j.error || 'Error creating user');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Admin Panel</h2>

      {/* Create User */}
      <section className="bg-white p-8 rounded-2xl shadow-lg max-w-xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-700">Create New User</h3>
        <form onSubmit={createUser} className="space-y-4">
          {['Name', 'Email', 'Password'].map((field, i) => (
            <input
              key={i}
              type={field === 'Password' ? 'password' : 'text'}
              placeholder={field}
              value={field === 'Name' ? name : field === 'Email' ? email : password}
              onChange={e => {
                if (field === 'Name') setName(e.target.value);
                else if (field === 'Email') setEmail(e.target.value);
                else setPassword(e.target.value);
              }}
              required
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Employee','Manager','Admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>

      {/* Users List */}
      <section className="bg-white p-8 rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-gray-700">All Users</h3>
        {users.length === 0 ? (
          <p className="text-gray-500 text-center">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wider">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 text-gray-700">{u.name}</td>
                    <td className="p-3 text-gray-700">{u.email}</td>
                    <td className="p-3 font-medium text-gray-800">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
