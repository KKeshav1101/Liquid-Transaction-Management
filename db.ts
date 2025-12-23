import Dexie, { Table } from 'dexie';
import { Transaction, UserProfile } from './types';

// Initialize the database using instance pattern to avoid TS inheritance issues
const db = new Dexie('LiquidFinancialDB') as Dexie & {
  transactions: Table<Transaction>;
  profile: Table<UserProfile>;
};

// Define schema
db.version(1).stores({
  transactions: 'id, type, category, date', 
  profile: 'id' // Singleton, we will use a fixed ID 'main'
});

export { db };

// Helper to initialize or get profile
export const getDBProfile = async (): Promise<UserProfile | undefined> => {
    return await db.profile.get('main');
};

export const saveDBProfile = async (profile: UserProfile) => {
    // Ensure we always save with id 'main'
    await db.profile.put({ ...profile, id: 'main' } as any);
};

export const getDBTransactions = async (): Promise<Transaction[]> => {
    return await db.transactions.toArray();
};

export const addDBTransaction = async (tx: Transaction) => {
    await db.transactions.add(tx);
};

export const resetDB = async () => {
    await db.transactions.clear();
    await db.profile.clear();
};