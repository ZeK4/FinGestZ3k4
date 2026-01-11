export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface Investment {
  id: string;
  name: string; // Nome da acção/ETF
  type: 'Buy' | 'Sell';
  date: string;
  pricePerShare: number;
  investedValue: number;
  shares: number; // Calculado automaticamente
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export interface AppConfig {
  allocationPercentage: number;
  trading212Token: string;
  currency: string;
  userName: string;
}

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Habitação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Salário',
  'Investimento',
  'Poupança Automática',
  'Outros'
];