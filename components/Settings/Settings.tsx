import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Transaction, TransactionType } from '../../types';
import { GLASS_PANEL } from '../../constants';
import { Sliders, CheckCircle, TrendingUp, Calendar, Wallet, RefreshCw, Calculator, X, Sparkles, LogOut, AlertTriangle } from '../ui/Icons';

interface SettingsProps {
  profile: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, transactions, onUpdateProfile, onLogout }) => {
  // Calculate total transaction impact
  const txSum = useMemo(() => transactions.reduce((acc, curr) => {
    if (curr.type === TransactionType.INCOME) return acc + curr.amount;
    return acc - curr.amount;
  }, 0), [transactions]);

  // Calculated current actual balance
  const currentActualBalance = profile.currentBalance + txSum;

  const [income, setIncome] = useState(profile.monthlyIncome);
  const [displayBalance, setDisplayBalance] = useState(currentActualBalance);
  
  // Ratios
  const [needs, setNeeds] = useState(profile.budgetConfig.needsPercent);
  const [wants, setWants] = useState(profile.budgetConfig.wantsPercent);
  const [savings, setSavings] = useState(profile.budgetConfig.savingsPercent);

  // Limit is now derived, but we allow manual override if needed, though primarily it follows the formula
  const [limit, setLimit] = useState(profile.budgetConfig.monthlyLimit);
  const [recurring, setRecurring] = useState(profile.budgetConfig.recurringExpenses);

  // Future Income
  const [hasFutureIncome, setHasFutureIncome] = useState(profile.futureIncomeConfig.hasFutureIncome);
  const [futureAmount, setFutureAmount] = useState(profile.futureIncomeConfig.futureMonthlyIncome);
  const [futureMonths, setFutureMonths] = useState(profile.futureIncomeConfig.startsInMonths);
  const [futureDesc, setFutureDesc] = useState(profile.futureIncomeConfig.description);

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcCTC, setCalcCTC] = useState<string>('');
  const [calcFixed, setCalcFixed] = useState<string>('');
  const [calculatedInHand, setCalculatedInHand] = useState<number | null>(null);

  const [saved, setSaved] = useState(false);

  // Helper to calculate limit based on balance and spending ratios (Needs + Wants)
  const calculateDerivedLimit = (balance: number, n: number, w: number) => {
      const spendingRatio = (n + w) / 100;
      return Math.floor(balance * spendingRatio);
  };

  // Auto-balance savings when Needs/Wants change to keep sum 100%
  const handleRatioChange = (type: 'needs' | 'wants', val: number) => {
    const value = Math.max(0, Math.min(100, val));
    let newNeeds = needs;
    let newWants = wants;
    let newSavings = savings;

    if (type === 'needs') {
        newNeeds = value;
        newSavings = Math.max(0, 100 - value - wants);
        // If savings hit 0, reduce wants
        if (value + wants > 100) {
            newWants = 100 - value;
            newSavings = 0;
        }
    } else {
        newWants = value;
        newSavings = Math.max(0, 100 - needs - value);
        // If savings hit 0, reduce needs
        if (needs + value > 100) {
            newNeeds = 100 - value;
            newSavings = 0;
        }
    }

    setNeeds(newNeeds);
    setWants(newWants);
    setSavings(newSavings);
    
    // Auto-update limit based on new ratios and current wallet balance
    setLimit(calculateDerivedLimit(displayBalance, newNeeds, newWants));
  };

  // Handle Balance Change manually
  const handleBalanceChange = (val: number) => {
      setDisplayBalance(val);
      // Auto-update limit based on new balance
      setLimit(calculateDerivedLimit(val, needs, wants));
  };

  const handleSave = () => {
    // Calculate new base balance so that (base + txSum) = displayBalance
    // This allows the user to "Calibrate" the app to their real bank account
    const newBaseBalance = displayBalance - txSum;

    const updatedProfile: UserProfile = {
      ...profile,
      monthlyIncome: income,
      currentBalance: newBaseBalance,
      budgetConfig: {
        ...profile.budgetConfig,
        monthlyLimit: limit,
        recurringExpenses: recurring,
        needsPercent: needs,
        wantsPercent: wants,
        savingsPercent: savings
      },
      futureIncomeConfig: {
          hasFutureIncome,
          futureMonthlyIncome: futureAmount,
          startsInMonths: futureMonths,
          description: futureDesc
      }
    };
    onUpdateProfile(updatedProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // --- Calculator Logic (Indian Tax Regime Estimate) ---
  const calculateSalary = () => {
      const ctcLakhs = parseFloat(calcCTC);
      const fixedLakhs = parseFloat(calcFixed);

      if (!ctcLakhs || !fixedLakhs) return;

      const annualFixed = fixedLakhs * 100000;
      
      // 1. Standard Deduction
      const taxableIncome = Math.max(0, annualFixed - 75000);

      // 2. Tax Calculation (New Regime FY 24-25 Slabs)
      let tax = 0;
      // 0-3L: Nil
      // 3-7L: 5%
      if (taxableIncome > 300000) {
          tax += Math.min(taxableIncome - 300000, 400000) * 0.05;
      }
      // 7-10L: 10%
      if (taxableIncome > 700000) {
          tax += Math.min(taxableIncome - 700000, 300000) * 0.10;
      }
      // 10-12L: 15%
      if (taxableIncome > 1000000) {
          tax += Math.min(taxableIncome - 1000000, 200000) * 0.15;
      }
      // 12-15L: 20%
      if (taxableIncome > 1200000) {
           tax += Math.min(taxableIncome - 1200000, 300000) * 0.20;
      }
      // >15L: 30%
      if (taxableIncome > 1500000) {
          tax += (taxableIncome - 1500000) * 0.30;
      }

      // Cess 4%
      tax = tax * 1.04;

      // 3. PF Estimation (Assuming Basic is 40% of Fixed, PF is 12% of Basic)
      const annualPF = (annualFixed * 0.40) * 0.12;

      // 4. Professional Tax (Approx 200/mo)
      const profTax = 2400;

      const annualInHand = annualFixed - tax - annualPF - profTax;
      setCalculatedInHand(Math.floor(annualInHand / 12));
  };

  const applyCalculatedSalary = () => {
      if (calculatedInHand) {
          setFutureAmount(calculatedInHand);
          setShowCalculator(false);
          setCalculatedInHand(null);
          setCalcCTC('');
          setCalcFixed('');
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-4 duration-300 relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">App Settings</h2>
        <span className="p-2 bg-slate-800 rounded-full text-cyan-400">
            <Sliders size={20} />
        </span>
      </div>

      {/* Income & Recurring */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6 space-y-4`}>
        <h3 className="text-lg font-semibold text-white">Current Financials</h3>
        
        <div>
            <label className="text-xs text-slate-400 block mb-1">Current Wallet/Bank Balance (Calibrate)</label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-lg">₹</span>
                <input 
                    type="number" 
                    value={displayBalance}
                    onChange={(e) => handleBalanceChange(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-lg font-bold text-white focus:border-cyan-500 outline-none"
                />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Wallet size={10} />
                Changing this auto-updates your Budget Limit.
            </p>
        </div>

        <div>
            <label className="text-xs text-slate-400 block mb-1">Current Monthly Income (In-Hand)</label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                <input 
                    type="number" 
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white focus:border-cyan-500 outline-none"
                />
            </div>
        </div>

        <div>
            <label className="text-xs text-slate-400 block mb-1">Fixed Recurring Expenses (Rent, etc)</label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                <input 
                    type="number" 
                    value={recurring}
                    onChange={(e) => setRecurring(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white focus:border-cyan-500 outline-none"
                />
            </div>
        </div>
      </div>

      {/* Ratios */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6 space-y-6`}>
        <div className="flex justify-between items-center">
             <h3 className="text-lg font-semibold text-white">Budget Allocation</h3>
             <span className={`text-xs px-2 py-1 rounded-full ${needs+wants+savings === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                Total: {needs + wants + savings}%
             </span>
        </div>
        
        <p className="text-xs text-slate-400 -mt-2">
            Adjusting these sliders will recalculate your dynamic monthly limit based on your current balance.
        </p>

        <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Needs (Essentials)</span>
                <span>{needs}%</span>
            </div>
            <input 
                type="range" min="0" max="100" value={needs}
                onChange={(e) => handleRatioChange('needs', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
        </div>

        <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Wants (Lifestyle)</span>
                <span>{wants}%</span>
            </div>
            <input 
                type="range" min="0" max="100" value={wants}
                onChange={(e) => handleRatioChange('wants', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
        </div>

        <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Savings & Investments</span>
                <span>{savings}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-lg overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${savings}%` }}></div>
            </div>
        </div>
      </div>

      {/* Dynamic Budget Configuration */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6 space-y-4`}>
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Dynamic Budget Limit</h3>
            <div className="text-xs text-cyan-400 flex items-center gap-1">
                <RefreshCw size={12} />
                Auto-calculated
            </div>
        </div>
        
        <div>
            <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-500 text-lg">₹</span>
                <input 
                    type="number" 
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-8 pr-3 text-xl font-bold text-white focus:border-cyan-500 outline-none"
                />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
                This is {needs + wants}% of your current balance. This amount is safe to spend this month.
            </p>
        </div>
      </div>

      {/* Income Evolution (Intern -> FTE) */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6 space-y-4 relative overflow-hidden`}>
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={60} />
         </div>
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Income Evolution</h3>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={hasFutureIncome}
                    onChange={(e) => setHasFutureIncome(e.target.checked)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300"
                    style={{ right: hasFutureIncome ? '0' : '50%' }}
                />
                <label 
                    htmlFor="toggle" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${hasFutureIncome ? 'bg-cyan-500' : 'bg-slate-700'}`}
                ></label>
            </div>
         </div>
         
         <p className="text-xs text-slate-400">
            Enable this if you have a job offer or a planned salary hike coming up (e.g., Internship to Full-time).
         </p>

         {hasFutureIncome && (
             <div className="animate-in slide-in-from-top-4 duration-300 space-y-4 pt-2">
                 <div>
                    <label className="text-xs text-slate-400 block mb-1">Role / Description</label>
                    <input 
                        type="text" 
                        value={futureDesc}
                        onChange={(e) => setFutureDesc(e.target.value)}
                        placeholder="e.g. SDE-1 @ HDFC"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-cyan-500 outline-none"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Starts In (Months)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500"><Calendar size={14}/></span>
                            <input 
                                type="number" 
                                value={futureMonths}
                                onChange={(e) => setFutureMonths(Number(e.target.value))}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs text-slate-400 flex items-center justify-between mb-1">
                            New Monthly In-Hand
                            <button 
                                onClick={() => setShowCalculator(true)}
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-bold tracking-wide"
                            >
                                <Calculator size={10} /> Estimate
                            </button>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                            <input 
                                type="number" 
                                value={futureAmount}
                                onChange={(e) => setFutureAmount(Number(e.target.value))}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
        >
            {saved ? <CheckCircle size={20} /> : null}
            {saved ? 'Settings Saved' : 'Save Changes'}
        </button>

        <div className="pt-8 border-t border-white/5">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Danger Zone
            </h3>
            <button
                onClick={onLogout}
                className="w-full bg-slate-900 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
                <LogOut size={18} />
                Reset App & Logout
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
                This will clear all local data and take you back to the welcome screen.
            </p>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg">
                            <Calculator size={18} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Salary Estimator</h3>
                      </div>
                      <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">Total CTC (LPA)</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={calcCTC}
                                  onChange={(e) => setCalcCTC(e.target.value)}
                                  placeholder="e.g. 24"
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white focus:border-violet-500 outline-none font-mono"
                              />
                              <span className="absolute right-4 top-3.5 text-slate-500 text-xs font-bold">LPA</span>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">Fixed Pay (Base for Tax)</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={calcFixed}
                                  onChange={(e) => setCalcFixed(e.target.value)}
                                  placeholder="e.g. 16"
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white focus:border-violet-500 outline-none font-mono"
                              />
                              <span className="absolute right-4 top-3.5 text-slate-500 text-xs font-bold">LPA</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                              Usually 60-70% of CTC. Exclude annual bonuses/stocks.
                          </p>
                      </div>

                      <button 
                        onClick={calculateSalary}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors border border-slate-600"
                      >
                          Calculate Net
                      </button>

                      {calculatedInHand !== null && (
                          <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-violet-300">Est. Monthly In-Hand</span>
                                  <Sparkles size={14} className="text-violet-400" />
                              </div>
                              <div className="text-2xl font-bold text-white mb-3">
                                  ₹{calculatedInHand.toLocaleString()}
                              </div>
                              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                                  Based on New Regime FY24-25. Includes Standard Deduction (75k) and PF Estimate. 
                                  Excludes Variable Pay.
                              </p>
                              <button 
                                onClick={applyCalculatedSalary}
                                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-violet-500/20"
                              >
                                  Use This Amount
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};