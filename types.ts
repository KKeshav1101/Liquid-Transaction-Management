export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT'
}

export enum Category {
  SALARY = 'Salary/Credit',
  FREELANCE = 'Freelance',
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transport',
  HOUSING = 'Housing',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  INVESTMENT = 'Investment',
  SAVINGS = 'Savings',
  OTHER = 'Other'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO String
  note?: string;
}

export interface BudgetConfig {
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  monthlyLimit: number; // The dynamic spending limit (e.g. 30k)
  recurringExpenses: number; // e.g. Rent 10k
  lastFeedbackDate?: string;
}

export interface FutureIncomeConfig {
  hasFutureIncome: boolean;
  futureMonthlyIncome: number; // The new salary amount
  startsInMonths: number; // How many months from now (e.g. 5)
  description: string; // e.g. "SDE Full Time Role"
}

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  currency: string;
  savingsGoal: number;
  isSetup: boolean;
  currentBalance: number;
  budgetConfig: BudgetConfig;
  futureIncomeConfig: FutureIncomeConfig;
}

export interface BudgetPlan {
  needs: number;
  wants: number;
  savings: number;
}

export interface InvestmentScenario {
  name: string;
  principal: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
}