import React, { useEffect, useState } from 'react';
const API = 'http://localhost:4000/api';

export default function AdminPanel({ token, user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    managerId: ''
  });
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    userId: '',
    name: '',
    description: '',
    category: '',
    isManagerApprover: true,
    approvers: [],
    approvalSequence: true,
    minApprovalPercentage: 100,
    amountThreshold: 0
  });

  useEffect(() => {
    loadUsers();
    loadRules();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`${API}/admin/users/${user.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Loaded users:', data);
      setUsers(data);
      // Include both Managers and Admins as potential managers
      const potentialManagers = data.filter(u => u.role === 'Manager' || u.role === 'Admin');
      console.log('Potential managers:', potentialManagers);
      setManagers(potentialManagers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function loadRules() {
    try {
      const res = await fetch(`${API}/admin/rules/${user.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
      method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...userForm,
          companyId: user.companyId
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('User created successfully!');
        setUserForm({ name: '', email: '', password: '', role: 'Employee', managerId: '' });
        loadUsers();
      } else {
        alert(data.error || 'Error creating user');
      }
    } catch (error) {
      alert('Failed to create user. Please try again.');
    } finally {
    setLoading(false);
    }
  }

  async function createRule(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/rules`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...ruleForm,
          companyId: user.companyId
        })
      });
      const data = await res.json();
    if (res.ok) {
        alert('Approval rule created successfully!');
        setRuleForm({
          userId: '',
          name: '',
          description: '',
          category: '',
          isManagerApprover: true,
          approvers: [],
          approvalSequence: true,
          minApprovalPercentage: 100,
          amountThreshold: 0
        });
        loadRules();
      } else {
        alert(data.error || 'Error creating rule');
      }
    } catch (error) {
      alert('Failed to create rule. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleUserFormChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRuleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRuleForm({
      ...ruleForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage users and approval rules for your company</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approval Rules
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Create User Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
                <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={userForm.name}
                      onChange={handleUserFormChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
                      type="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleUserFormChange}
              required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={userForm.role}
                      onChange={handleUserFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager (Optional)</label>
          <select
                      name="managerId"
                      value={userForm.managerId}
                      onChange={handleUserFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a manager</option>
                      {managers.length > 0 ? (
                        managers.map(manager => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name} ({manager.role})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No managers available</option>
                      )}
          </select>
                    {managers.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No managers available. Create a user with Manager role first.
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
                  </div>
        </form>
              </div>

      {/* Users List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
          <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                        <tr key={u._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {u.managerId?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Create Rule Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Approval Rule</h3>
                <form onSubmit={createRule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <select
                        name="userId"
                        value={ruleForm.userId}
                        onChange={handleRuleFormChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a user</option>
                        {users.filter(u => u.role !== 'Admin').map(u => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                      <input
                        type="text"
                        name="name"
                        value={ruleForm.name}
                        onChange={handleRuleFormChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Miscellaneous Expenses"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={ruleForm.description}
                      onChange={handleRuleFormChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the approval rule..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category (Optional)</label>
                      <input
                        type="text"
                        name="category"
                        value={ruleForm.category}
                        onChange={handleRuleFormChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Food & Dining"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount Threshold</label>
                      <input
                        type="number"
                        name="amountThreshold"
                        value={ruleForm.amountThreshold}
                        onChange={handleRuleFormChange}
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isManagerApprover"
                        checked={ruleForm.isManagerApprover}
                        onChange={handleRuleFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Is manager an approver?
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="approvalSequence"
                        checked={ruleForm.approvalSequence}
                        onChange={handleRuleFormChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Approvers sequence matters (sequential approval)
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum Approval Percentage</label>
                      <input
                        type="number"
                        name="minApprovalPercentage"
                        value={ruleForm.minApprovalPercentage}
                        onChange={handleRuleFormChange}
                        min="0"
                        max="100"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">Percentage of approvers required for approval (only applies to parallel approval)</p>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Rule'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Rules List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Rules</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Approver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sequence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map(rule => (
                        <tr key={rule._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rule.userId?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.category || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rule.amountThreshold ? `$${rule.amountThreshold}` : 'Any amount'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rule.isManagerApprover ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {rule.isManagerApprover ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rule.approvalSequence ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {rule.approvalSequence ? 'Sequential' : 'Parallel'}
                            </span>
                          </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
