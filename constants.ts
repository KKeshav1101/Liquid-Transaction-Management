import { Category, Transaction, TransactionType } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 15000,
    type: TransactionType.EXPENSE,
    category: Category.HOUSING,
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    note: 'Monthly Rent',
  },
  {
    id: '2',
    amount: 1200,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    note: 'Grocery Run',
  },
  {
    id: '3',
    amount: 90000,
    type: TransactionType.INCOME,
    category: Category.SALARY,
    date: new Date(new Date().setDate(1)).toISOString(),
    note: 'Salary Credit',
  },
  {
    id: '4',
    amount: 10000,
    type: TransactionType.INVESTMENT,
    category: Category.INVESTMENT,
    date: new Date(new Date().setDate(5)).toISOString(),
    note: 'SIP Auto-debit',
  },
];

export const THEME_GRADIENT = "bg-gradient-to-br from-cyan-500 to-blue-600";
export const GLASS_PANEL = "bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-xl";
export const GLASS_PANEL_HOVER = "hover:bg-slate-800/60 transition-all duration-300";

// Mapping categories to Needs, Wants, Savings
export const BUDGET_CATEGORY_MAP: Record<Category, 'needs' | 'wants' | 'savings'> = {
    [Category.HOUSING]: 'needs',
    [Category.TRANSPORT]: 'needs',
    [Category.UTILITIES]: 'needs',
    [Category.HEALTH]: 'needs',
    [Category.FOOD]: 'needs', // Basic food is a need
    [Category.SALARY]: 'savings', // Income ignored in mapping usually, but key needed
    [Category.FREELANCE]: 'savings',
    [Category.ENTERTAINMENT]: 'wants',
    [Category.SHOPPING]: 'wants',
    [Category.OTHER]: 'wants',
    [Category.INVESTMENT]: 'savings',
    [Category.SAVINGS]: 'savings',
};