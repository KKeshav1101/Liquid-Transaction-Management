import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, UserProfile } from './types';
import { GLASS_PANEL_HOVER } from './constants';
import { getDBTransactions, getDBProfile, saveDBProfile, addDBTransaction, resetDB } from './db';
import { BalanceCard } from './components/Dashboard/BalanceCard';
import { DashboardCharts } from './components/Dashboard/DashboardCharts';
import { WealthProjection } from './components/Dashboard/WealthProjection';
import { BudgetOptimizer } from './components/Budget/BudgetOptimizer';
import { InvestmentVisualizer } from './components/Investments/InvestmentVisualizer';
import { AddTransaction } from './components/Transaction/AddTransaction';
import { SetupModal } from './components/Onboarding/SetupModal';
import { Settings as SettingsComponent } from './components/Settings/Settings';
import { ActivityView } from './components/Activity/ActivityView';
import { Home, PieChart, TrendingUp, Plus, Settings, Calendar, Wallet, List } from './components/ui/Icons';
import { LiquidLogo } from './components/ui/LiquidLogo';

// Default profile state for initial load
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

function App() {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'invest' | 'settings' | 'activity'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const initData = async () => {
        try {
            // Artificial delay for better UX (prevents flicker)
            await new Promise(resolve => setTimeout(resolve, 800));

            const [loadedTx, loadedProfile] = await Promise.all([
                getDBTransactions(),
                getDBProfile()
            ]);
            
            setTransactions(loadedTx);
            if (loadedProfile) {
                setUserProfile(loadedProfile);
            }
            setIsInitialized(true);
        } catch (error) {
            console.error("Database initialization failed", error);
            setIsInitialized(true);
        }
    };
    initData();
  }, []);

  // --- Handlers ---
  const handleSetupComplete = async (data: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...data };
    setUserProfile(newProfile as UserProfile);
    await saveDBProfile(newProfile as UserProfile);
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
      setUserProfile(newProfile);
      await saveDBProfile(newProfile);
  };

  const handleLogout = async () => {
      if (window.confirm("Are you sure you want to reset the app? All data will be lost.")) {
          await resetDB();
          setTransactions([]);
          setUserProfile(DEFAULT_PROFILE);
          setActiveTab('dashboard');
      }
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    // Optimistic UI Update
    const updatedTx = [tx, ...transactions];
    setTransactions(updatedTx);
    
    // DB Update
    await addDBTransaction(tx);
  };

  // --- Derived State ---
  const calculatedBalance = React.useMemo(() => {
    if (!userProfile.isSetup) return 0;
    
    const txSum = transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.INCOME) return acc + curr.amount;
      return acc - curr.amount;
    }, 0);

    return userProfile.currentBalance + txSum;
  }, [userProfile.currentBalance, userProfile.isSetup, transactions]);

  const currentMonthExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- Render Loading ---
  if (!isInitialized) {
      return (
          <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse"></div>
                <LiquidLogo size={80} className="relative z-10 animate-bounce-1" />
              </div>
              <p className="text-cyan-400/50 text-xs font-medium tracking-widest uppercase mt-6 animate-pulse">
                  Initializing Liquid...
              </p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex justify-center font-sans">
      
      {/* Onboarding Overlay */}
      {!userProfile.isSetup && (
          <SetupModal onComplete={handleSetupComplete} />
      )}

      {/* Mobile Constraint Wrapper */}
      <div className={`w-full max-w-md h-full min-h-screen relative flex flex-col bg-[#0f172a] ${!userProfile.isSetup ? 'blur-sm' : ''}`}>
        
        {/* Header - Settings always available on top right */}
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
          <div>
            {activeTab === 'dashboard' ? (
                <div className="flex items-center gap-3">
                  <LiquidLogo size={38} />
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight leading-none">
                      Liquid <span className="font-light text-slate-400">Assistant</span>
                    </h1>
                    <p className="text-[10px] text-cyan-400 font-medium tracking-wide mt-1">
                      HELLO, {userProfile.name?.toUpperCase() || 'USER'}
                    </p>
                  </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <LiquidLogo size={38} />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">
                        {activeTab === 'activity' && 'Transactions'}
                        {activeTab === 'budget' && 'Smart Budget'}
                        {activeTab === 'invest' && 'Investments'}
                        {activeTab === 'settings' && 'Settings'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Manage your wealth</p>
                    </div>
                </div>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-6 no-scrollbar pb-32 pt-4">
          
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <BalanceCard 
                balance={calculatedBalance} 
                monthlyIncome={userProfile.monthlyIncome}
                monthlyExpense={currentMonthExpenses}
              />
              
              <WealthProjection profile={userProfile} />
              
              <DashboardCharts 
                  transactions={transactions} 
                  currentBalance={calculatedBalance} 
              />
            </div>
          )}

          {activeTab === 'activity' && (
              <ActivityView transactions={transactions} />
          )}

          {activeTab === 'budget' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <BudgetOptimizer 
                  profile={userProfile}
                  transactions={transactions}
                  onUpdateProfile={handleUpdateProfile}
               />
             </div>
          )}

          {activeTab === 'invest' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <InvestmentVisualizer 
                 profile={userProfile}
                 transactions={transactions}
               />
            </div>
          )}
          
          {activeTab === 'settings' && (
              <SettingsComponent 
                  profile={userProfile}
                  transactions={transactions}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
              />
          )}

        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border-t border-white/5 pb-8 pt-4 px-6 z-50">
          <div className="flex justify-between items-center relative">
            <NavButton tab="dashboard" icon={Home} label="Home" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton tab="activity" icon={List} label="Activity" activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* FAB */}
            <div className="-mt-12">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-5 rounded-full shadow-lg shadow-cyan-500/40 text-white hover:scale-105 transition-transform active:scale-95 border-4 border-[#0f172a]"
              >
                <Plus size={28} />
              </button>
            </div>

            <NavButton tab="budget" icon={PieChart} label="Budget" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavButton tab="invest" icon={TrendingUp} label="Invest" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </nav>

        {/* Modals */}
        {isAddModalOpen && (
          <AddTransaction 
            onAdd={handleAddTransaction} 
            onClose={() => setIsAddModalOpen(false)} 
          />
        )}
        
      </div>
    </div>
  );
}

// Helper component for nav button
const NavButton = ({ tab, icon: Icon, label, activeTab, setActiveTab }: any) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center w-12 gap-1 transition-all duration-300 ${
        activeTab === tab ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === tab ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default App;