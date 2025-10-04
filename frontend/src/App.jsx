import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpense from './pages/SubmitExpense';
import Approvals from './pages/Approvals';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const API = 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const location = useLocation();

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

  // Hide navbar on login and signup pages
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app-container">
      {!hideNavbar && (
        <header className="app-header">
          <div className="nav-links">
            <Link to="/" className="nav-link brand">Expense Manager</Link>
            {token && (
              <>
                <span className="nav-divider">|</span>
                <Link to="/submit" className="nav-link">Submit</Link>
                <span className="nav-divider">|</span>
                <Link to="/approvals" className="nav-link">Approvals</Link>
                {user?.role === 'Admin' && (
                  <>
                    <span className="nav-divider">|</span>
                    <Link to="/admin" className="nav-link">Admin</Link>
                  </>
                )}
              </>
            )}
          </div>
          <div className="user-info">
            {token ? (
              <>
                <span className="user-name">{user?.name} ({user?.role})</span>
                <button onClick={logout} className="logout-btn">Logout</button>
              </>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="auth-link">Login</Link>
                <span className="nav-divider">|</span>
                <Link to="/signup" className="auth-link">Signup</Link>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<Login onAuth={(t,u)=>{localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); setToken(t); setUser(u);}} />} />
                <Route path="/signup" element={<Signup onAuth={(t,u)=>{localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); setToken(t); setUser(u);}} />} />
                <Route path="/" element={token ? <Dashboard user={user} token={token} /> : <Navigate to="/login" />} />
                <Route path="/submit" element={token ? <SubmitExpense token={token} user={user} /> : <Navigate to="/login" />} />
                <Route path="/approvals" element={token ? <Approvals token={token} user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin" element={token && user?.role === 'Admin' ? <AdminPanel token={token} user={user} /> : <Navigate to="/" />} />
              </Routes>
            </main>
    </div>
  );
}

export default App;