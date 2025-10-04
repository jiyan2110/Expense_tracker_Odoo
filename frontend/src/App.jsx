import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpense from './pages/SubmitExpense';
import Approvals from './pages/Approvals';
import AdminPanel from './pages/AdminPanel';
import OCRUpload from './components/OCRUpload';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Expense Manager
              </Link>
              {token && (
                <nav className="ml-10 flex space-x-8">
                  <Link to="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/submit" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Submit Expense
                  </Link>
                  <Link to="/approvals" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Approvals
                  </Link>
                  {user?.role === 'Admin' && (
                    <Link to="/admin" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                      Admin Panel
                    </Link>
                  )}
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {token ? (
                <>
                  <span className="text-sm text-gray-700">
                    {user?.name} ({user?.role})
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
