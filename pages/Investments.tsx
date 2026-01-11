import React, { useState, useEffect } from 'react';
import { Investment } from '../types';
import { Plus, Trash2, LineChart, RefreshCw } from 'lucide-react';

interface InvestmentsProps {
  investments: Investment[];
  onAddInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  currency: string;
}

const Investments: React.FC<InvestmentsProps> = ({ investments, onAddInvestment, onDeleteInvestment, currency }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInv, setNewInv] = useState<Partial<Investment>>({
    type: 'Buy',
    date: new Date().toISOString().split('T')[0],
    pricePerShare: 0,
    investedValue: 0,
    shares: 0
  });

  // Calculate shares automatically when price or invested value changes
  useEffect(() => {
    if (newInv.pricePerShare && newInv.investedValue && newInv.pricePerShare > 0) {
      const calculatedShares = newInv.investedValue / newInv.pricePerShare;
      setNewInv(prev => ({ ...prev, shares: parseFloat(calculatedShares.toFixed(4)) }));
    } else {
      setNewInv(prev => ({ ...prev, shares: 0 }));
    }
  }, [newInv.pricePerShare, newInv.investedValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInv.name && newInv.pricePerShare && newInv.investedValue) {
      onAddInvestment({
        id: Date.now().toString(),
        name: newInv.name,
        type: newInv.type as 'Buy' | 'Sell',
        date: newInv.date || new Date().toISOString().split('T')[0],
        pricePerShare: Number(newInv.pricePerShare),
        investedValue: Number(newInv.investedValue),
        shares: Number(newInv.shares)
      });
      setIsModalOpen(false);
      setNewInv({ type: 'Buy', date: new Date().toISOString().split('T')[0], pricePerShare: 0, investedValue: 0, shares: 0 });
    }
  };

  const totalInvested = investments.filter(i => i.type === 'Buy').reduce((acc, i) => acc + i.investedValue, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">Total Investido</p>
          <h2 className="text-3xl font-bold text-slate-800">{totalInvested.toFixed(2)} {currency}</h2>
        </div>
        <div className="flex items-center gap-2">
           {/* Mock Button for API Sync */}
           <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors opacity-70 cursor-not-allowed" title="Requer API Trading212 configurada">
              <RefreshCw size={16} /> Sync API
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <LineChart className="text-accent" size={20}/> Portfólio
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} /> Novo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium text-xs">
              <tr>
                <th className="px-6 py-4">Ativo</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Preço Un.</th>
                <th className="px-6 py-4 text-right">Shares</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investments.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{inv.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${inv.type === 'Buy' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {inv.type === 'Buy' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{inv.date}</td>
                  <td className="px-6 py-4 text-right">{inv.pricePerShare.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono">{inv.shares.toFixed(4)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">{inv.investedValue.toFixed(2)} {currency}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-400 hover:text-danger transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {investments.length === 0 && (
                <tr>
                   <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                      Nenhum investimento registado.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Novo Investimento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Ação/ETF</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  value={newInv.name || ''}
                  onChange={e => setNewInv({ ...newInv, name: e.target.value })}
                  placeholder="Ex: AAPL, VWCE"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                      value={newInv.type}
                      onChange={e => setNewInv({ ...newInv, type: e.target.value as any })}
                    >
                      <option value="Buy">Compra</option>
                      <option value="Sell">Venda</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input
                      required
                      type="date"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                      value={newInv.date}
                      onChange={e => setNewInv({ ...newInv, date: e.target.value })}
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor Investido</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                      value={newInv.investedValue || ''}
                      onChange={e => setNewInv({ ...newInv, investedValue: parseFloat(e.target.value) })}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço/Share</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                      value={newInv.pricePerShare || ''}
                      onChange={e => setNewInv({ ...newInv, pricePerShare: parseFloat(e.target.value) })}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Shares (Automático)</label>
                <input
                  type="number"
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg cursor-not-allowed font-mono"
                  value={newInv.shares || 0}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 bg-accent hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Registar Ordem
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;