import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import { Transaction, Investment, Goal, AppConfig } from './types';

const App: React.FC = () => {
  // --- STATE ---
  // In a real app, this would utilize a more robust persistence layer
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('investments');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('config');
    return saved ? JSON.parse(saved) : {
      allocationPercentage: 10,
      trading212Token: '',
      currency: '€',
      userName: 'Investidor'
    };
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('investments', JSON.stringify(investments)); }, [investments]);
  useEffect(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);

  // --- HANDLERS ---
  
  // Transactions
  const addTransaction = (t: Transaction) => setTransactions([...transactions, t]);
  const deleteTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));
  const importTransactions = (newTrans: Transaction[]) => {
    // Basic deduplication or merge strategy could go here
    setTransactions(prev => [...prev, ...newTrans]);
  };

  // Investments
  const addInvestment = (inv: Investment) => setInvestments([...investments, inv]);
  const deleteInvestment = (id: string) => setInvestments(investments.filter(i => i.id !== id));

  // Goals
  const addGoal = (g: Goal) => setGoals([...goals, g]);
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  // Allocation Logic (The Core Connection between Dashboard and Goals)
  const allocateToGoal = (goalId: string) => {
    // 1. Calculate current balance
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const currentBalance = income - expense;

    // 2. Calculate allocation amount
    const amountToAllocate = currentBalance * (config.allocationPercentage / 100);

    if (amountToAllocate <= 0) {
      alert("Saldo insuficiente para alocação.");
      return;
    }

    // 3. Find Goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // 4. Create Expense Transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: `Alocação para: ${goal.title}`,
      amount: parseFloat(amountToAllocate.toFixed(2)),
      type: 'expense',
      category: 'Poupança Automática'
    };

    // 5. Update State
    addTransaction(newTransaction);
    
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: g.currentAmount + amountToAllocate };
      }
      return g;
    }));

    alert(`Sucesso! ${amountToAllocate.toFixed(2)}${config.currency} alocados para ${goal.title}.`);
  };

  // Helper for current balance calculation (passed to Goals page)
  const getCurrentBalance = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return income - expense;
  };

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navbar />
        
        <main className="flex-1 p-4 md:p-8 md:ml-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header / Top Bar */}
            <div className="mb-8 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800">Olá, {config.userName} 👋</h1>
                  <p className="text-sm text-slate-500">Vamos gerir as suas finanças.</p>
               </div>
               <div className="hidden md:block text-xs bg-slate-200 px-3 py-1 rounded-full text-slate-600">
                  v1.0.0 Alpha
               </div>
            </div>

            <Routes>
              <Route path="/" element={
                <Dashboard 
                  transactions={transactions} 
                  onAddTransaction={addTransaction}
                  onDeleteTransaction={deleteTransaction}
                  onImportTransactions={importTransactions}
                  currency={config.currency}
                />
              } />
              <Route path="/investments" element={
                <Investments 
                  investments={investments} 
                  onAddInvestment={addInvestment}
                  onDeleteInvestment={deleteInvestment}
                  currency={config.currency}
                />
              } />
              <Route path="/goals" element={
                <Goals 
                  goals={goals} 
                  onAddGoal={addGoal}
                  onDeleteGoal={deleteGoal}
                  onAllocate={allocateToGoal}
                  allocationPercentage={config.allocationPercentage}
                  currentBalance={getCurrentBalance()}
                  currency={config.currency}
                />
              } />
              <Route path="/settings" element={
                <Settings 
                  config={config} 
                  onUpdateConfig={setConfig}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;