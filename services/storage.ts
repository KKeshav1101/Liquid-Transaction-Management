import { Transaction, UserProfile } from '../types';

const KEYS = {
  TRANSACTIONS: 'liquid_app_transactions',
  PROFILE: 'liquid_app_profile',
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  monthlyIncome: 0,
  currency: 'INR',
  savingsGoal: 0,
  isSetup: false,
  currentBalance: 0,
  budgetConfig: {
    needsPercent: 50,
    wantsPercent: 30,
    savingsPercent: 20,
    monthlyLimit: 30000,
    recurringExpenses: 0
  },
  futureIncomeConfig: {
    hasFutureIncome: false,
    futureMonthlyIncome: 0,
    startsInMonths: 0,
    description: ''
  }
};

export const StorageService = {
  getTransactions: (): Transaction[] => {
    try {
      const stored = localStorage.getItem(KEYS.TRANSACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load transactions", e);
      return [];
    }
  },

  saveTransactions: (transactions: Transaction[]) => {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions", e);
    }
  },

  getProfile: (): UserProfile => {
    try {
      const stored = localStorage.getItem(KEYS.PROFILE);
      if (!stored) return DEFAULT_PROFILE;
      
      const parsed = JSON.parse(stored);
      // Deep merge to ensure new config fields exist
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        budgetConfig: {
            ...DEFAULT_PROFILE.budgetConfig,
            ...(parsed.budgetConfig || {})
        },
        futureIncomeConfig: {
            ...DEFAULT_PROFILE.futureIncomeConfig,
            ...(parsed.futureIncomeConfig || {})
        }
      };
    } catch (e) {
      console.error("Failed to load profile", e);
      return DEFAULT_PROFILE;
    }
  },

  saveProfile: (profile: UserProfile) => {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  },
  
  clear: () => {
      localStorage.removeItem(KEYS.TRANSACTIONS);
      localStorage.removeItem(KEYS.PROFILE);
  }
};