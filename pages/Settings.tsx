import React from 'react';
import { AppConfig } from '../types';
import { Save, Shield, Percent, User } from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (c: AppConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
  const handleChange = (key: keyof AppConfig, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurações</h2>
        <p className="text-slate-500">Gerencie suas preferências e integrações.</p>
      </div>

      {/* User Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <User size={18} /> Perfil e Moeda
          </h3>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Utilizador</label>
              <input
                type="text"
                value={config.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moeda (Simbolo)</label>
              <input
                type="text"
                value={config.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none w-20 text-center"
              />
           </div>
        </div>
      </div>

      {/* Allocation Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Percent size={18} /> Regras de Alocação
          </h3>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Percentagem de alocação rápida para objectivos ({config.allocationPercentage}%)
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={config.allocationPercentage}
              onChange={(e) => handleChange('allocationPercentage', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <p className="text-xs text-slate-400 mt-2">
              Esta percentagem é aplicada sobre o saldo atual do Dashboard quando clica em "Alocar" no ecrã de Objectivos.
            </p>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield size={18} /> Integrações & Segurança
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trading212 API Token</label>
            <input
              type="password"
              placeholder="Ex: 53123..."
              value={config.trading212Token}
              onChange={(e) => handleChange('trading212Token', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              O token é armazenado apenas localmente no seu browser.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors shadow-lg">
             <Save size={18} /> Configurações Salvas Automaticamente
          </button>
      </div>
    </div>
  );
};

export default Settings;