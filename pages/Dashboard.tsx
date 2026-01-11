import React, { useState } from 'react';
import { Transaction, DEFAULT_CATEGORIES } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Plus, Upload, Download, Trash2, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel, parseFile } from '../utils/csvHelper';

interface DashboardProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (t: Transaction[]) => void;
  currency: string;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction,
  onImportTransactions,
  currency 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category: DEFAULT_CATEGORIES[0]
  });

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  // Prepare Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await parseFile(file);
        if (imported.length > 0) {
          onImportTransactions(imported);
          alert(`${imported.length} transações importadas com sucesso!`);
        } else {
          alert("Não foram encontradas transações válidas. Verifique se o ficheiro tem as colunas: 'Data do movimento', 'Descrição', 'Debito', 'Credito', 'Categoria'.");
        }
      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro ao ler o ficheiro. Verifique o formato.");
      }
      // Reset input to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrans.description && newTrans.amount) {
      onAddTransaction({
        id: Date.now().toString(),
        description: newTrans.description,
        amount: Number(newTrans.amount),
        type: newTrans.type as 'income' | 'expense',
        date: newTrans.date || new Date().toISOString().split('T')[0],
        category: newTrans.category || 'Outros'
      });
      setIsModalOpen(false);
      setNewTrans({ type: 'expense', date: new Date().toISOString().split('T')[0], category: DEFAULT_CATEGORIES[0], description: '', amount: 0 });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Saldo Atual</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-danger'}`}>
            {balance.toFixed(2)} {currency}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Entradas</p>
          <p className="text-2xl font-bold text-success">+{income.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Saídas</p>
          <p className="text-2xl font-bold text-danger">-{expense.toFixed(2)} {currency}</p>
        </div>
      </div>

      {/* Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Transações Recentes</h2>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                <Upload size={16} /> Importar
                <input 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
              
              <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download size={16} /> Exportar <ChevronDown size={14} />
                </button>
                
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                    <button 
                      onClick={() => { exportTransactionsToCSV(transactions); setIsExportMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <FileText size={16} className="text-slate-400" /> CSV
                    </button>
                    <button 
                      onClick={() => { exportTransactionsToExcel(transactions); setIsExportMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" /> Excel (XLSX)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-medium text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3 rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${t.type === 'income' ? 'text-success' : 'text-slate-700'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} {currency}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-400 hover:text-danger transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                      Nenhuma transação registada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 w-full">Despesas por Categoria</h2>
          {chartData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} ${currency}`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic h-64">
              Sem dados de despesas
            </div>
          )}
        </div>
      </div>

      {/* FAB for Mobile / Sticky Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-accent hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105 z-40 flex items-center justify-center"
        aria-label="Adicionar Transação"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  value={newTrans.description || ''}
                  onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
                  placeholder="Ex: Compras Supermercado"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                    value={newTrans.amount || ''}
                    onChange={e => setNewTrans({ ...newTrans, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input
                    required
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                    value={newTrans.date}
                    onChange={e => setNewTrans({ ...newTrans, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                    value={newTrans.type}
                    onChange={e => setNewTrans({ ...newTrans, type: e.target.value as any })}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                    value={newTrans.category}
                    onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-4 bg-accent hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;