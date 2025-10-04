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
    // This effect syncs state if localStorage changes in another tab, for example.
    const syncState = () => {
      setToken(localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
    };
    window.addEventListener('storage', syncState);
    return () => window.removeEventListener('storage', syncState);
  }, []);

  const handleAuth = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>Expense Manager</Link>
          {token && (
            <span style={{ marginLeft: 16 }}>
              {/* --- MODIFIED NAVIGATION LOGIC --- */}
              
              {/* Show "Submit" link only to Employees and Managers */}
              {user?.role !== 'Admin' && (
                <Link to="/submit" style={{ marginLeft: 12 }}>Submit</Link>
              )}

              {/* Show "Approvals" link only to Managers and Admins */}
              {(user?.role === 'Manager' || user?.role === 'Admin') && (
                <Link to="/approvals" style={{ marginLeft: 12 }}>Approvals</Link>
              )}

              {/* Show "Admin" link only to Admins */}
              {user?.role === 'Admin' && (
                <Link to="/admin" style={{ marginLeft: 12 }}>Admin</Link>
              )}

              {/* --- END OF MODIFIED LOGIC --- */}
            </span>
          )}
        </div>
        <div>
          {token ? (
            <>
              <span style={{ marginRight: 10 }}>{user?.name} ({user?.role})</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/signup" element={<Signup onAuth={handleAuth} />} />
        <Route path="/" element={token ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/submit" element={token && user?.role !== 'Admin' ? <SubmitExpense token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/approvals" element={token && (user?.role === 'Manager' || user?.role === 'Admin') ? <Approvals token={token} /> : <Navigate to="/" />} />
        <Route path="/admin" element={token && user?.role === 'Admin' ? <AdminPanel token={token} /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;