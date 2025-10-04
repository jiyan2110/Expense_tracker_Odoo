import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpense from './pages/SubmitExpense';
import Approvals from './pages/Approvals';
import AdminPanel from './pages/AdminPanel';

const API = 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link to="/">Expense Manager</Link>
          {token && <span style={{ marginLeft: 12 }}>| <Link to="/submit">Submit</Link> | <Link to="/approvals">Approvals</Link> | {user?.role === 'Admin' && <Link to="/admin">Admin</Link>}</span>}
        </div>
        <div>
          {token ? (
            <>
              <span style={{ marginRight: 10 }}>{user?.name} ({user?.role})</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link> | <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/login" element={<Login onAuth={(t,u)=>{localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); setToken(t); setUser(u);}} />} />
        <Route path="/signup" element={<Signup onAuth={(t,u)=>{localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); setToken(t); setUser(u);}} />} />
        <Route path="/" element={token ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/submit" element={token ? <SubmitExpense token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/approvals" element={token ? <Approvals token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={token && user?.role === 'Admin' ? <AdminPanel token={token} /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
