
import { GoogleGenAI } from "@google/genai";
import { Transaction, Investment, Language } from '../types';

export const analyzeFinancialData = async (
  transactions: Transaction[],
  investments: Investment[],
  currency: string,
  lang: Language
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Preparar os dados para a IA de forma resumida para poupar tokens
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const topCategories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const prompt = `
    Atua como um consultor financeiro sénior. Analisa estes dados:
    - Rendimento Total: ${incomeTotal} ${currency}
    - Despesa Total: ${expenseTotal} ${currency}
    - Maiores Gastos por Categoria: ${JSON.stringify(topCategories)}
    - Número de Investimentos: ${investments.length}
    
    Por favor, fornece:
    1. Um breve resumo da saúde financeira (máximo 2 frases).
    2. Duas dicas práticas para reduzir gastos ou otimizar investimentos.
    3. Uma mensagem motivadora curta.
    
    Responde em ${lang === 'pt' ? 'Português de Portugal' : 'English'}. 
    Mantém um tom profissional, mas encorajador. Usa Markdown para a formatação.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return lang === 'pt' ? "Não foi possível gerar a análise no momento." : "Could not generate analysis at this time.";
  }
};
