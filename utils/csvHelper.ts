
import { Transaction, Investment, InvestmentAction } from '../types';
import * as XLSX from 'xlsx';

// Definição dos cabeçalhos padrão para consistência na exportação/importação (CamelCase)
const TRANSACTION_HEADERS = ['id', 'date', 'description', 'amount', 'type', 'category'];
const INVESTMENT_HEADERS = ['id', 'name', 'ticker', 'isin', 'type', 'date', 'pricePerShare', 'investedValue', 'shares', 'notes'];

// Palavras-chave que indicam estrutura de investimentos
const INV_KEYWORDS = ['ticker', 'isin', 'shares', 'price / share', 'no. of shares', 'action'];

// --- TRANSAÇÕES ---

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const ws = transactions.length > 0 
    ? XLSX.utils.json_to_sheet(transactions, { header: TRANSACTION_HEADERS })
    : XLSX.utils.aoa_to_sheet([TRANSACTION_HEADERS]);

  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "extrato_fingestor.csv";
  link.click();
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const ws = transactions.length > 0 
    ? XLSX.utils.json_to_sheet(transactions, { header: TRANSACTION_HEADERS })
    : XLSX.utils.aoa_to_sheet([TRANSACTION_HEADERS]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extrato");
  XLSX.writeFile(wb, "extrato_fingestor.xlsx");
};

export const parseFile = async (file: File): Promise<Transaction[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
  
  if (jsonData.length > 0) {
    const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
    const isInvestment = headers.some(h => INV_KEYWORDS.includes(h));
    
    if (isInvestment) {
      throw new Error("errorInvestmentFileInDash");
    }
  }

  return jsonData.map(row => ({
    id: String(row['id'] || Date.now().toString() + Math.random().toString().slice(2, 8)),
    date: row['date'] || row['Data do movimento'] || new Date().toISOString().split('T')[0],
    description: row['description'] || row['Descrição'] || 'Sem descrição',
    amount: Math.abs(parseFloat(String(row['amount'] || row['Debito'] || row['Credito'] || 0).replace(',', '.'))),
    type: (row['type'] || (row['Credito'] ? 'income' : 'expense')) as any,
    category: row['category'] || row['Categoria'] || 'Outros'
  }));
};

// --- INVESTIMENTOS ---

export const parseInvestmentsFile = async (file: File): Promise<Investment[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

  if (jsonData.length === 0) throw new Error("Ficheiro vazio.");

  // Validação: Se não tiver ticker ou ISIN ou Price mas tiver categoria/descrição, provavelmente é transação
  const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
  const hasInvHeaders = headers.some(h => INV_KEYWORDS.includes(h));
  const hasTransHeaders = headers.includes('categoria') || headers.includes('descrição') || headers.includes('category');

  if (!hasInvHeaders && hasTransHeaders) {
    throw new Error("errorTransactionFileInInv");
  }

  return jsonData.map(row => {
    const action = (row['type'] || row['Action'] || row['action'] || 'Market buy') as InvestmentAction;
    
    let dateStr = row['date'] || row['Time'] || row['time'] || new Date().toISOString();
    if (typeof dateStr === 'number') {
      const d = new Date((dateStr - 25569) * 86400 * 1000);
      dateStr = d.toISOString().split('T')[0];
    } else {
      dateStr = String(dateStr).split(' ')[0];
    }

    const price = parseFloat(String(row['pricePerShare'] || row['Price / share'] || row['price'] || 0).replace(',', '.'));
    const total = parseFloat(String(row['investedValue'] || row['Total'] || row['total'] || 0).replace(',', '.'));
    const sharesCount = parseFloat(String(row['shares'] || row['No. of shares'] || 0).replace(',', '.'));

    return {
      id: String(row['id'] || row['ID'] || Date.now().toString() + Math.random().toString().slice(2, 8)),
      name: row['name'] || row['Name'] || 'Ativo Desconhecido',
      ticker: String(row['ticker'] || row['Ticker'] || ''),
      isin: String(row['isin'] || row['ISIN'] || ''),
      type: action,
      date: dateStr,
      pricePerShare: price,
      investedValue: Math.abs(total),
      shares: sharesCount,
      notes: row['notes'] || row['Notes'] || ''
    };
  });
};

export const exportInvestmentsToExcel = (investments: Investment[]) => {
  const ws = investments.length > 0 
    ? XLSX.utils.json_to_sheet(investments, { header: INVESTMENT_HEADERS })
    : XLSX.utils.aoa_to_sheet([INVESTMENT_HEADERS]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Investimentos");
  XLSX.writeFile(wb, "investimentos_fingestor.xlsx");
};
