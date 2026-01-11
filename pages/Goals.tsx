import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Plus, PiggyBank, Trash2 } from 'lucide-react';

interface GoalsProps {
  goals: Goal[];
  onAddGoal: (g: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onAllocate: (goalId: string) => void;
  allocationPercentage: number;
  currentBalance: number;
  currency: string;
}

const Goals: React.FC<GoalsProps> = ({ 
  goals, 
  onAddGoal, 
  onDeleteGoal,
  onAllocate, 
  allocationPercentage, 
  currentBalance,
  currency
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    currentAmount: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.title && newGoal.targetAmount) {
      onAddGoal({
        id: Date.now().toString(),
        title: newGoal.title,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount || 0)
      });
      setIsModalOpen(false);
      setNewGoal({ currentAmount: 0, title: '', targetAmount: 0 });
    }
  };

  const calculateAllocationAmount = () => {
    // Simple logic: Allocate configured % of current positive balance
    // If balance is negative or zero, returns 0
    return currentBalance > 0 ? (currentBalance * (allocationPercentage / 100)) : 0;
  };

  const allocationAmount = calculateAllocationAmount();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Objectivos Financeiros</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Plus size={18} /> Novo Objectivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          
          return (
            <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{goal.title}</h3>
                  <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-300 hover:text-danger">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  <span className="font-semibold text-slate-800">{goal.currentAmount.toFixed(2)} {currency}</span> de {goal.targetAmount.toFixed(2)} {currency}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-success h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-slate-400 mt-1">{progress.toFixed(1)}%</div>
              </div>

              <button
                onClick={() => onAllocate(goal.id)}
                disabled={allocationAmount <= 0}
                className="w-full mt-auto flex items-center justify-center gap-2 py-2 px-4 border border-accent/20 bg-accent/5 text-accent font-medium rounded-lg hover:bg-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PiggyBank size={18} />
                Alocar {allocationAmount > 0 ? allocationAmount.toFixed(2) : '0.00'} {currency} ({allocationPercentage}%)
              </button>
            </div>
          );
        })}
        
        {goals.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
             <Target size={48} className="mb-4 opacity-20" />
             <p>Ainda não definiu objectivos.</p>
          </div>
        )}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Novo Objectivo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  value={newGoal.title || ''}
                  onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Ex: Viagem ao Japão"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Alvo</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  value={newGoal.targetAmount || ''}
                  onChange={e => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-4 bg-accent hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Criar Objectivo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;