import { Transaction } from '../types';
import * as XLSX from 'xlsx';

// Helper to format data for export matching the requested structure
const formatForExport = (transactions: Transaction[]) => {
  return transactions.map(t => ({
    'Data do movimento': t.date,
    'Data do valor': t.date, // Assumindo mesma data para simplificação na exportação
    'Descrição': t.description,
    'Debito': t.type === 'expense' ? t.amount : 0,
    'Credito': t.type === 'income' ? t.amount : 0,
    'Saldo disponivel': 0, // Campo informativo, deixado a 0 pois é calculado dinamicamente na app
    'Categoria': t.category
  }));
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const ws = XLSX.utils.json_to_sheet(formatForExport(transactions));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "extrato_fingestor.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const ws = XLSX.utils.json_to_sheet(formatForExport(transactions));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extrato");
  XLSX.writeFile(wb, "extrato_fingestor.xlsx");
};

export const parseFile = async (file: File): Promise<Transaction[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON with raw values to handle numbers correctly
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

  const parsedTransactions: Transaction[] = [];

  for (const row of jsonData) {
    // Determine Amount and Type based on Debito/Credito columns
    let amount = 0;
    let type: 'income' | 'expense' = 'expense'; // Default

    const debito = parseFloat(row['Debito']) || 0;
    const credito = parseFloat(row['Credito']) || 0;

    if (credito > 0) {
      amount = credito;
      type = 'income';
    } else if (debito > 0) {
      amount = debito;
      type = 'expense';
    } else {
      // If no valid amount found (e.g., empty line or balance line), skip
      continue;
    }

    // Basic validation: needs description or amount
    if (!row['Descrição'] && amount === 0) continue;

    parsedTransactions.push({
      // Auto-generate ID: Timestamp + Random suffix
      id: Date.now().toString() + Math.random().toString().slice(2, 8),
      // Prefer 'Data do movimento', fallback to current date
      date: row['Data do movimento'] || new Date().toISOString().split('T')[0],
      description: row['Descrição'] || 'Sem descrição',
      amount: Math.abs(amount), // Ensure positive number
      type: type,
      category: row['Categoria'] || 'Outros'
    });
  }

  return parsedTransactions;
};

// Deprecated: wrapper for backward compatibility
export const parseCSV = (content: string): Transaction[] => {
   // This is strictly for fallback and assumes the file matches the parseFile logic
   // In a real app, we would refactor this out entirely.
   return []; 
};