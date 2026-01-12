
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import { Transaction, Investment, Goal, AppConfig, RecurringSchedule } from './types';
import { t } from './i18n';
import { X, CheckCircle, Info } from 'lucide-react';
import { storageService } from './services/storageService';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais do "backend"
  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, i, g, c] = await Promise.all([
          storageService.getTransactions(),
          storageService.getInvestments(),
          storageService.getGoals(),
          storageService.getConfig()
        ]);
        setTransactions(t);
        setInvestments(i);
        setGoals(g);
        setConfig(c);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Sincronizar com o "backend" sempre que os dados mudarem
  useEffect(() => { if (!isLoading) storageService.saveTransactions(transactions); }, [transactions, isLoading]);
  useEffect(() => { if (!isLoading) storageService.saveInvestments(investments); }, [investments, isLoading]);
  useEffect(() => { if (!isLoading) storageService.saveGoals(goals); }, [goals, isLoading]);
  useEffect(() => { if (!isLoading && config) storageService.saveConfig(config); }, [config, isLoading]);

  // Aplicar Tema
  useEffect(() => {
    if (!config) return;
    const applyTheme = (mode: string) => {
      if (mode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    if (config.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(isDark ? 'dark' : 'light');
    } else {
      applyTheme(config.theme);
    }
  }, [config?.theme]);

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">FinGestor Pro Loading...</p>
      </div>
    );
  }

  const addTransaction = (tr: Transaction) => setTransactions(prev => [...prev, tr]);
  const addRecurringSchedule = (s: RecurringSchedule) => setConfig(prev => prev ? ({ ...prev, recurringSchedules: [...prev.recurringSchedules, s] }) : prev);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const importTransactions = (tr: Transaction[]) => setTransactions(prev => [...prev, ...tr]);

  const addInvestment = (inv: Investment) => setInvestments(prev => [...prev, inv]);
  const deleteInvestment = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));
  const importInvestments = (invs: Investment[]) => setInvestments(prev => [...prev, ...invs]);

  const addGoal = (g: Goal) => setGoals(prev => [...prev, g]);
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const getCurrentBalance = () => {
    const inc = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return inc - exp;
  };

  const allocateToGoal = (goalId: string) => {
    const balance = getCurrentBalance();
    const amount = balance > 0 ? (balance * (config.allocationPercentage / 100)) : 0;
    if (amount <= 0) return;
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g));
    addTransaction({
      id: `alloc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `${t('allocate', config.language)}: ${goals.find(g => g.id === goalId)?.title}`,
      amount,
      type: 'transfer',
      category: 'Poupança Automática'
    });
    addNotification(config.language === 'pt' ? 'Poupança alocada!' : 'Savings allocated!', 'success');
  };

  const getSavingsBalance = () => goals.reduce((acc, g) => acc + g.currentAmount, 0);

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar lang={config.language} />
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-3">
                <span className={n.type === 'success' ? 'text-success' : n.type === 'error' ? 'text-danger' : 'text-accent'}>
                   {n.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>}
                </span>
                <span className="text-sm font-bold">{n.message}</span>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
            </div>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8 md:ml-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard transactions={transactions} investments={investments} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} onImportTransactions={importTransactions} onAddRecurringSchedule={addRecurringSchedule} currency={config.currency} showCharts={config.showDashboardCharts} chartType={config.dashboardChartType} notify={addNotification} lang={config.language} />} />
              <Route path="/investments" element={<Investments investments={investments} onAddInvestment={addInvestment} onDeleteInvestment={deleteInvestment} onImportInvestments={importInvestments} currency={config.currency} showCharts={config.showInvestmentCharts} chartType={config.investmentChartType} lang={config.language} notify={addNotification} />} />
              <Route path="/goals" element={<Goals goals={goals} onAddGoal={addGoal} onDeleteGoal={deleteGoal} onAllocate={allocateToGoal} allocationPercentage={config.allocationPercentage} currentBalance={getCurrentBalance()} savingsBalance={getSavingsBalance()} currency={config.currency} lang={config.language} />} />
              <Route path="/settings" element={<Settings config={config} onUpdateConfig={setConfig} notify={addNotification} lang={config.language} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
