
import { Transaction, Investment, Goal, AppConfig } from '../types';

/**
 * Este serviço simula uma API de Backend. 
 * Todas as funções são assíncronas para facilitar a futura transição 
 * para um banco de dados real (PostgreSQL, MongoDB, etc.) via fetch/axios.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  INVESTMENTS: 'investments',
  GOALS: 'goals',
  CONFIG: 'config'
};

export const storageService = {
  // Transações
  getTransactions: async (): Promise<Transaction[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: async (data: Transaction[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data));
  },

  // Investimentos
  getInvestments: async (): Promise<Investment[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveInvestments: async (data: Investment[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(data));
  },

  // Objetivos
  getGoals: async (): Promise<Goal[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  },
  saveGoals: async (data: Goal[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data));
  },

  // Configurações
  getConfig: async (): Promise<AppConfig> => {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      return {
        allocationPercentage: 10,
        trading212Token: '',
        currency: '€',
        userName: 'Investidor',
        theme: 'auto',
        language: 'pt',
        showDashboardCharts: true,
        dashboardChartType: 'pie',
        showInvestmentCharts: true,
        investmentChartType: 'pie',
        alerts: [],
        recurringSchedules: []
      };
    }
    return JSON.parse(data);
  },
  saveConfig: async (data: AppConfig): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data));
  }
};
