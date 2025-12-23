import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GLASS_PANEL, BUDGET_CATEGORY_MAP } from '../../constants';
import { Transaction, TransactionType, UserProfile } from '../../types';
import { Activity, ThumbsUp, ThumbsDown, Target, CheckCircle } from '../ui/Icons';

interface BudgetOptimizerProps {
  profile: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (profile: UserProfile) => void;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981']; // Cyan, Violet, Emerald

export const BudgetOptimizer: React.FC<BudgetOptimizerProps> = ({ profile, transactions, onUpdateProfile }) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [lastAction, setLastAction] = useState('');
  
  const { budgetConfig } = profile;
  const { needsPercent, wantsPercent, savingsPercent, monthlyLimit } = budgetConfig;

  // --- Calculations ---
  
  // 1. Optimal Allocation based on CURRENT BALANCE (Base)
  // We use profile.currentBalance (Base Balance from Settings) for planning
  // This ensures the budget pie chart matches the "Percentage of Wallet" concept
  const baseForCalculation = profile.currentBalance;

  const optimalNeeds = baseForCalculation * (needsPercent / 100);
  const optimalWants = baseForCalculation * (wantsPercent / 100);
  const optimalSavings = baseForCalculation * (savingsPercent / 100);

  // 2. Actual Spending Analysis
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  let actualNeeds = 0;
  let actualWants = 0;
  let actualSavings = 0;

  monthlyTransactions.forEach(t => {
      const type = BUDGET_CATEGORY_MAP[t.category];
      if (t.type === TransactionType.EXPENSE) {
          if (type === 'needs') actualNeeds += t.amount;
          if (type === 'wants') actualWants += t.amount;
      }
      if (t.type === TransactionType.INVESTMENT || t.category === 'Savings') {
          actualSavings += t.amount;
      }
  });

  const totalSpent = actualNeeds + actualWants;
  
  // --- Algorithm: Feedback Loop ---
  const handleFeedback = (sentiment: 'strict' | 'good' | 'easy') => {
      let newLimit = monthlyLimit;
      let newWants = wantsPercent;
      let newSavings = savingsPercent;
      let actionMsg = "No changes needed.";

      // Algorithm:
      // Strict: User feels pinched. Increase Wants (+3%), Decrease Savings (-3%). Increase Limit (+5%).
      // Easy: User has excess money. Decrease Wants (-2%), Increase Savings (+2%). Decrease Limit (-5%).
      
      if (sentiment === 'strict') {
          // Increase Wants (Lifestyle) to relieve pressure
          const change = 3;
          if (newSavings - change >= 0) {
              newWants += change;
              newSavings -= change;
          }
          newLimit = Math.floor(monthlyLimit * 1.05);
          actionMsg = `Relaxed Budget: Wants +${change}%, Limit +5%`;
      } else if (sentiment === 'easy') {
          // Decrease Wants (Lifestyle) to save more
          const change = 2;
          if (newWants - change >= 0) {
              newWants -= change;
              newSavings += change;
          }
          newLimit = Math.floor(monthlyLimit * 0.95);
          actionMsg = `Tightened Budget: Savings +${change}%, Limit -5%`;
      }

      onUpdateProfile({
          ...profile,
          budgetConfig: {
              ...profile.budgetConfig,
              monthlyLimit: newLimit,
              wantsPercent: newWants,
              savingsPercent: newSavings,
              lastFeedbackDate: new Date().toISOString()
          }
      });
      setLastAction(actionMsg);
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 4000);
  };

  const chartData = [
    { name: `Needs (${needsPercent}%)`, value: optimalNeeds },
    { name: `Wants (${wantsPercent}%)`, value: optimalWants },
    { name: `Savings (${savingsPercent}%)`, value: optimalSavings },
  ];

  const healthPercentage = Math.min((totalSpent / monthlyLimit) * 100, 100);
  let healthColor = 'bg-emerald-500';
  if (healthPercentage > 75) healthColor = 'bg-yellow-500';
  if (healthPercentage > 95) healthColor = 'bg-red-500';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">Smart Budget</h2>
        <span className="text-xs text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded-full border border-cyan-800">
            Limit: ₹{monthlyLimit.toLocaleString()}
        </span>
      </div>

      {/* Expenditure Health Bar */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  Expenditure Health
              </h3>
              <span className="text-xs text-slate-400">
                  {healthPercentage.toFixed(1)}% Used
              </span>
          </div>

          <div className="relative pt-6 pb-2">
              <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full ${healthColor} transition-all duration-700 ease-out relative`}
                    style={{ width: `${healthPercentage}%` }}
                  >
                      {/* Fluid effect overlay */}
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-mono">
                  <span className="text-emerald-400">₹0</span>
                  <span className="text-slate-500">Target: ₹{monthlyLimit.toLocaleString()}</span>
              </div>
          </div>
          
          <div className="mt-4 flex justify-between text-sm">
             <div className="text-slate-400">Total Spent</div>
             <div className="text-white font-bold">₹{totalSpent.toLocaleString()}</div>
          </div>
      </div>

      {/* Feedback Loop */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
          <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">How's the budget?</h3>
              <p className="text-xs text-slate-400 mt-1">
                  Help the algorithm tune your ratios for next month.
              </p>
          </div>

          {feedbackSent ? (
               <div className="bg-emerald-500/20 text-emerald-300 p-4 rounded-2xl text-center text-sm border border-emerald-500/50 animate-in fade-in zoom-in flex flex-col gap-1">
                   <div className="font-semibold flex items-center justify-center gap-2">
                       <CheckCircle size={16} /> Optimized
                   </div>
                   <div className="text-xs opacity-80">{lastAction}</div>
               </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => handleFeedback('strict')}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl transition-all"
                >
                    <ThumbsDown size={20} className="text-red-400" />
                    <span className="text-[10px] text-red-200">Too Strict</span>
                </button>
                <button 
                    onClick={() => handleFeedback('good')}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl transition-all"
                >
                    <CheckCircle size={20} className="text-cyan-400" />
                    <span className="text-[10px] text-cyan-200">Good</span>
                </button>
                <button 
                    onClick={() => handleFeedback('easy')}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all"
                >
                    <ThumbsUp size={20} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-200">Too Easy</span>
                </button>
            </div>
          )}
      </div>

      {/* Breakdown Visualization */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-white">Allocation Breakdown</h3>
             <span className="text-xs text-slate-400">Based on Current Balance</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(val: number) => `₹${Math.round(val).toLocaleString()}`}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div className="p-2 bg-slate-900/50 rounded-xl">
                <div className="text-[10px] text-slate-400">Spent Needs</div>
                <div className="text-xs font-semibold text-cyan-400">₹{actualNeeds.toLocaleString()}</div>
            </div>
            <div className="p-2 bg-slate-900/50 rounded-xl">
                <div className="text-[10px] text-slate-400">Spent Wants</div>
                <div className="text-xs font-semibold text-violet-400">₹{actualWants.toLocaleString()}</div>
            </div>
            <div className="p-2 bg-slate-900/50 rounded-xl">
                <div className="text-[10px] text-slate-400">Saved</div>
                <div className="text-xs font-semibold text-emerald-400">₹{actualSavings.toLocaleString()}</div>
            </div>
        </div>
      </div>
    </div>
  );
};