import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App state
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Load user data on mount - ONLY ONCE
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const savedUser = localStorage.getItem('loggedInUser');
    
    if (loggedIn === 'true' && savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
      
      // Load transactions for this user
      const savedTransactions = localStorage.getItem(`transactions_${savedUser}`);
      if (savedTransactions) {
        try {
          const parsed = JSON.parse(savedTransactions);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          } else {
            setTransactions([]);
          }
        } catch (e) {
          console.error('Error loading transactions:', e);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    }
  }, []); // Empty dependency array = runs only ONCE on mount

  // Save transactions whenever they change - but only if user is logged in
  useEffect(() => {
    if (isLoggedIn && username) {
      try {
        localStorage.setItem(`transactions_${username}`, JSON.stringify(transactions));
      } catch (e) {
        console.error('Error saving transactions:', e);
      }
    }
  }, [transactions, isLoggedIn, username]); // Runs when transactions change

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username]) {
      // Existing user - check password
      if (users[username] === password) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', username);
        setLoginError('');
        
        // Load existing transactions for this user
        const savedTransactions = localStorage.getItem(`transactions_${username}`);
        if (savedTransactions) {
          try {
            const parsed = JSON.parse(savedTransactions);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
            } else {
              setTransactions([]);
            }
          } catch (e) {
            console.error('Error loading transactions:', e);
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      } else {
        setLoginError('Incorrect password');
      }
    } else {
      // New user - create account
      users[username] = password;
      localStorage.setItem('users', JSON.stringify(users));
      
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInUser', username);
      setLoginError('');
      
      // Initialize empty transactions for new user
      localStorage.setItem(`transactions_${username}`, JSON.stringify([]));
      setTransactions([]);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Save transactions before logout
      if (username) {
        try {
          localStorage.setItem(`transactions_${username}`, JSON.stringify(transactions));
        } catch (e) {
          console.error('Error saving transactions on logout:', e);
        }
      }
      
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('loggedInUser');
      setUsername('');
      setPassword('');
      setTransactions([]);
    }
  };

  // Add Transaction
  const addTransaction = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    const newTransaction = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN'),
      timestamp: Date.now(),
    };
    
    // Add to state - auto-save will handle localStorage
    setTransactions([newTransaction, ...transactions]);
    setAmount('');
    setCategory('Food');
    setType('expense');
  };

  // Delete Transaction
  const deleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      // Remove from state - auto-save will handle localStorage
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const categorySummary = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const filteredTransactions = transactions.filter(t => {
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (filterType !== 'All' && t.type !== filterType) return false;
    return true;
  });

  const categoryColors = {
    Food: '#FF6B6B',
    Transport: '#4ECDC4',
    Shopping: '#45B7D1',
    Entertainment: '#FFA07A',
    Bills: '#98D8C8',
    Other: '#DDA0DD',
  };

  const categories = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'];

  const formatCurrency = (amount) => {
    return '₹' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-icon">💰</div>
            <h1>Expense Tracker</h1>
            <p>Track your daily expenses with ease</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
              />
            </div>
            <div className="login-input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-btn">
              <span>🚀</span> Login / Sign Up
            </button>
            <div className="login-footer">
              <p>New user? Your account will be created automatically</p>
              <p style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: '8px' }}>
                🔒 Your transactions are securely stored in your account
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="app">
      {/* Header with Logout */}
      <div className="app-header">
        <div className="app-header-left">
          <span className="app-logo">💰</span>
          <div>
            <h1>Expense Tracker</h1>
            <span className="user-greeting">Welcome, {username}!</span>
          </div>
        </div>
        <div className="header-right">
          <span className="session-status">🔒 Session Active</span>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card balance-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Balance</div>
            <div className={`stat-value ${balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(balance)}
            </div>
          </div>
        </div>
        <div className="stat-card income-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">Total Income</div>
            <div className="stat-value income-text">{formatCurrency(totalIncome)}</div>
          </div>
        </div>
        <div className="stat-card expense-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value expense-text">{formatCurrency(totalExpense)}</div>
          </div>
        </div>
        <div className="stat-card count-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column */}
        <div className="left-panel">
          {/* Add Transaction */}
          <div className="panel add-panel">
            <h2 className="panel-title">
              <span className="title-icon">➕</span> Add Transaction
            </h2>
            <form onSubmit={addTransaction} className="add-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    className="input-field with-prefix"
                  />
                </div>
                <div className="input-wrapper">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Shopping</option>
                    <option>Entertainment</option>
                    <option>Bills</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${type === 'income' ? 'active income-active' : ''}`}
                  onClick={() => setType('income')}
                >
                  <span className="btn-icon">↑</span> Income
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${type === 'expense' ? 'active expense-active' : ''}`}
                  onClick={() => setType('expense')}
                >
                  <span className="btn-icon">↓</span> Expense
                </button>
              </div>
              <button type="submit" className="add-btn">
                <span className="btn-icon">+</span> Add Transaction
              </button>
            </form>
            <div className="storage-info">
              <span>💾 All transactions are saved to your account</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="panel category-panel">
            <h2 className="panel-title">
              <span className="title-icon">📊</span> Category Breakdown
            </h2>
            {Object.keys(categorySummary).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No expenses yet</p>
                <span className="empty-sub">Add your first expense to see breakdown</span>
              </div>
            ) : (
              <div className="category-list">
                {Object.entries(categorySummary).map(([cat, total]) => (
                  <div key={cat} className="category-item">
                    <div className="category-header">
                      <span className="category-name">
                        <span className="color-dot" style={{ background: categoryColors[cat] }}></span>
                        {cat}
                      </span>
                      <span className="category-amount">{formatCurrency(total)}</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(total / totalExpense) * 100}%`,
                          background: categoryColors[cat],
                        }}
                      ></div>
                    </div>
                    <div className="percentage-text">{((total / totalExpense) * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
            {totalExpense > 0 && (
              <div className="total-expense-row">
                <span>Total Expenses</span>
                <strong>{formatCurrency(totalExpense)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="right-panel">
          <div className="panel transactions-panel">
            <div className="transactions-header">
              <h2 className="panel-title">
                <span className="title-icon">📝</span> Recent Transactions
              </h2>
              <div className="filter-group">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div className="transaction-scroll">
              {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No transactions found</p>
                  <span className="empty-sub">Start tracking your expenses now</span>
                </div>
              ) : (
                <div className="transaction-list">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="transaction-row">
                      <div className="transaction-left">
                        <div className={`icon-circle ${t.type}`}>
                          {t.type === 'income' ? '↑' : '↓'}
                        </div>
                        <div className="transaction-info">
                          <span className="transaction-desc">{t.category}</span>
                          <div className="transaction-tags">
                            <span className={`tag-type ${t.type}`}>
                              {t.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                            <span className="tag-date">{t.date}</span>
                            <span className="tag-time">{t.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="transaction-right">
                        <span className={`amount-text ${t.type}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteTransaction(t.id)}
                          title="Delete transaction permanently"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {transactions.length > 0 && (
              <div className="transaction-footer">
                <span>📌 {transactions.length} transactions saved in your account</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;