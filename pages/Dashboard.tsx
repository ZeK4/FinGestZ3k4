
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, DEFAULT_CATEGORIES, ChartType, TransactionType, Language, RecurringSchedule, RecurrenceFrequency, Investment } from '../types';
import { t } from '../i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { Plus, Upload, Download, Trash2, FileSpreadsheet, FileText, ChevronDown, X, Loader2, Lock, PieChart as PieIcon, Sparkles, BrainCircuit } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel, parseFile } from '../utils/csvHelper';
import { analyzeFinancialData } from '../services/aiService';

interface DashboardProps {
  transactions: Transaction[];
  investments: Investment[];
  onAddTransaction: (tr: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (tr: Transaction[]) => void;
  onAddRecurringSchedule: (schedule: RecurringSchedule) => void;
  currency: string;
  showCharts: boolean;
  chartType: ChartType;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-[12px] md:text-sm font-black uppercase tracking-tight">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#94a3b8" className="text-[10px] md:text-xs font-bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} />
    </g>
  );
};

// Fix: Complete the Dashboard component implementation and add default export
const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  investments,
  onAddTransaction, 
  onDeleteTransaction,
  onImportTransactions,
  onAddRecurringSchedule,
  currency,
  showCharts,
  chartType,
  notify,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category: DEFAULT_CATEGORIES[0]
  });

  useEffect(() => {
    if (newTrans.category === 'Salário') {
      setNewTrans(prev => ({ ...prev, type: 'income', description: t('ordered', lang) }));
    } else if (newTrans.category === 'Transferência Entre Contas' || newTrans.category === 'Poupança Automática') {
      setNewTrans(prev => ({ ...prev, type: 'transfer' }));
    }
  }, [newTrans.category, lang]);

  const handleAiAnalysis = async () => {
    if (transactions.length === 0) {
      notify(lang === 'pt' ? "Adiciona algumas transações primeiro!" : "Add some transactions first!", "info");
      return;
    }
    setIsAnalyzing(true);
    const result = await analyzeFinancialData(transactions, investments, currency, lang);
    setAiAnalysis(result || null);
    setIsAnalyzing(false);
  };

  const income = transactions.filter(t => t.type === 'income').reduce((acc, tr) => acc + tr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, tr) => acc + tr.amount, 0);
  const balance = income - expense;

  const expensesByCategory = useMemo(() => {
    return transactions
      .filter(tr => tr.type === 'expense' || (tr.type === 'transfer' && tr.category === 'Poupança Automática'))
      .reduce((acc, tr) => {
        acc[tr.category] = (acc[tr.category] || 0) + tr.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const chartData = useMemo(() => {
    return Object.keys(expensesByCategory).map(key => ({
      name: t(key as any, lang),
      value: parseFloat(expensesByCategory[key].toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [expensesByCategory, lang]);

  const totalChartValue = useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await parseFile(file);
      onImportTransactions(imported);
      notify(lang === 'pt' ? "Transações importadas!" : "Transactions imported!", "success");
    } catch (err: any) {
      notify(t(err.message as any, lang), "error");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrans.description && newTrans.amount) {
      onAddTransaction({
        id: Date.now().toString(),
        date: newTrans.date || new Date().toISOString().split('T')[0],
        description: newTrans.description,
        amount: Number(newTrans.amount),
        type: newTrans.type as TransactionType,
        category: newTrans.category || 'Outros'
      });
      setIsModalOpen(false);
      setNewTrans({ type: 'expense', date: new Date().toISOString().split('T')[0], category: DEFAULT_CATEGORIES[0] });
    }
  };

  const renderDashboardChart = () => {
    if (chartData.length === 0) return (
      <div className="flex flex-col items-center justify-center text-slate-400 py-20">
        <PieIcon size={48} className="opacity-10 mb-4" />
        <p className="text-sm font-bold opacity-30 italic uppercase tracking-widest">{t('noData', lang)}</p>
      </div>
    );

    return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 w-full min-h-[450px]">
        <div className="w-full lg:w-auto flex-shrink-0">
          <div className="flex flex-col flex-wrap max-h-[400px] overflow-y-auto lg:overflow-visible gap-y-2 gap-x-6">
            {chartData.map((entry, index) => (
              <button
                key={entry.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left whitespace-nowrap min-w-[160px] ${
                  activeIndex === index 
                  ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[120px]">{entry.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{((entry.value / totalChartValue) * 100).toFixed(1)}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie 
                  {...({ activeIndex: activeIndex ?? undefined, activeShape: renderActiveShape } as any)}
                  data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" style={{ filter: activeIndex !== null && activeIndex !== index ? 'grayscale(70%) opacity(0.3)' : 'none', transition: 'all 0.5s' }} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all";
  const labelClasses = "block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 ml-1 uppercase tracking-tight";

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('balance', lang)}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('income', lang)}</p>
          <p className="text-3xl font-black text-emerald-600">+{income.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('expense', lang)}</p>
          <p className="text-3xl font-black text-rose-600">-{expense.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</p>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8 rounded-[2.5rem] border border-blue-100 dark:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <BrainCircuit size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-accent text-white p-2 rounded-xl">
              <Sparkles size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">AI Insights</h3>
          </div>
          {aiAnalysis ? (
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium">
              <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
              <button onClick={() => setAiAnalysis(null)} className="mt-4 text-xs font-black text-accent uppercase hover:underline">Limpar análise</button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Obtém uma análise personalizada baseada nos teus gastos e investimentos.</p>
              <button 
                onClick={handleAiAnalysis} 
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                {isAnalyzing ? "A Analisar..." : "Gerar Insights"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{t('recentTransactions', lang)}</h3>
          <div className="flex gap-3 w-full lg:w-auto">
            <label className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl cursor-pointer transition-all uppercase tracking-tighter">
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{t('import', lang)}</span>
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
            </label>
            <div className="relative flex-1 lg:flex-none">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl transition-all uppercase tracking-tighter"
              >
                <Download size={16} /> {t('export', lang)} <ChevronDown size={14} />
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                  <button onClick={() => { exportTransactionsToCSV(transactions); setIsExportMenuOpen(false); }} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                    <FileText size={16} /> CSV
                  </button>
                  <button onClick={() => { exportTransactionsToExcel(transactions); setIsExportMenuOpen(false); }} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">{t('date', lang)}</th>
                <th className="px-8 py-5">{t('description', lang)}</th>
                <th className="px-8 py-5">{t('category', lang)}</th>
                <th className="px-8 py-5 text-right">{t('amount', lang)}</th>
                <th className="px-8 py-5 text-center">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice().reverse().map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5 whitespace-nowrap text-slate-400 font-mono text-[11px]">{tr.date}</td>
                  <td className="px-8 py-5 font-black text-slate-700 dark:text-slate-200">{tr.description}</td>
                  <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-lg uppercase">{t(tr.category as any, lang)}</span></td>
                  <td className={`px-8 py-5 text-right font-black ${tr.type === 'income' ? 'text-emerald-500' : tr.type === 'expense' ? 'text-rose-500' : 'text-slate-400'}`}>
                    {tr.type === 'expense' ? '-' : tr.type === 'income' ? '+' : ''}{tr.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button onClick={() => onDeleteTransaction(tr.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCharts && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8">{t('charts', lang)}</h2>
          {renderDashboardChart()}
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 bg-accent hover:bg-blue-600 text-white p-5 rounded-3xl shadow-2xl transition-all transform hover:scale-110 active:scale-90 z-[45]"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{t('newTransaction', lang)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:text-accent rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t('description', lang)}</label>
                  <input required type="text" className={inputClasses} value={newTrans.description || ''} onChange={e => setNewTrans({ ...newTrans, description: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>{t('amount', lang)} ({currency})</label>
                  <input required type="number" step="0.01" className={inputClasses} value={newTrans.amount || ''} onChange={e => setNewTrans({ ...newTrans, amount: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t('category', lang)}</label>
                  <select className={inputClasses} value={newTrans.category} onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}>
                    {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat as any, lang)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t('date', lang)}</label>
                  <input required type="date" className={inputClasses} value={newTrans.date} onChange={e => setNewTrans({ ...newTrans, date: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-[2rem] text-lg">{t('cancel', lang)}</button>
                <button type="submit" className="flex-[2] py-6 bg-accent hover:bg-blue-600 text-white font-black rounded-[2rem] text-lg shadow-xl shadow-accent/20">{t('save', lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
