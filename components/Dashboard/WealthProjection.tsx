import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Label, YAxis } from 'recharts';
import { UserProfile } from '../../types';
import { GLASS_PANEL } from '../../constants';
import { TrendingUp, Target } from '../ui/Icons';

interface WealthProjectionProps {
  profile: UserProfile;
}

export const WealthProjection: React.FC<WealthProjectionProps> = ({ profile }) => {
  const [annualHike, setAnnualHike] = useState(10); // Default 10% annual hike

  const projectionData = useMemo(() => {
    const data = [];
    const monthsToProject = 10 * 12; // 10 Years
    
    let currentSavingsBalance = profile.currentBalance;
    let monthlyIncome = profile.monthlyIncome;
    let totalSavingsAccumulated = 0;

    const { hasFutureIncome, futureMonthlyIncome, startsInMonths } = profile.futureIncomeConfig;
    const savingsRate = profile.budgetConfig.savingsPercent / 100;

    for (let i = 0; i <= monthsToProject; i++) {
        // 1. Check for Income Transition (Intern -> FTE)
        if (hasFutureIncome && i === startsInMonths) {
            monthlyIncome = futureMonthlyIncome;
        }

        // 2. Apply Annual Hike (every 12 months)
        if (i > 0 && i % 12 === 0) {
            monthlyIncome = monthlyIncome * (1 + annualHike / 100);
        }

        // 3. Calculate Monthly Savings
        const monthlySavings = monthlyIncome * savingsRate;
        
        // 4. Accumulate (Ground Truth - simply adding up savings)
        currentSavingsBalance += monthlySavings;
        totalSavingsAccumulated += monthlySavings;

        // Store yearly data points for cleaner graph
        if (i % 12 === 0) {
            data.push({
                year: `Yr ${i / 12}`,
                balance: Math.round(currentSavingsBalance),
                income: Math.round(monthlyIncome),
                saved: Math.round(totalSavingsAccumulated)
            });
        }
    }
    return data;
  }, [profile, annualHike]);

  const finalAmount = projectionData[projectionData.length - 1]?.balance || 0;
  
  const formatCompact = (num: number) => {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
      return `₹${(num / 1000).toFixed(1)}k`;
  };

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6 mb-6`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target size={18} className="text-emerald-400"/>
                    Ground Truth Projection
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Net worth in 10y based on {profile.budgetConfig.savingsPercent}% savings rate.
                </p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400">Projected Wealth</p>
                <p className="text-xl font-bold text-emerald-400">{formatCompact(finalAmount)}</p>
            </div>
        </div>

        {/* Graph */}
        <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="year" 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false}
                    >
                         <Label value="Timeline (Years)" offset={-10} position="insideBottom" style={{ fill: '#64748b', fontSize: '10px' }} />
                    </XAxis>
                    <YAxis 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(val) => formatCompact(val)}
                        width={45}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: number) => [formatCompact(val), 'Net Worth']}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorWealth)" 
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Controls */}
        <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Expected Annual Salary Hike
                </label>
                <span className="text-xs font-bold text-emerald-400">{annualHike}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="30" 
                step="1"
                value={annualHike}
                onChange={(e) => setAnnualHike(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            {profile.futureIncomeConfig.hasFutureIncome && (
                <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <p className="text-[10px] text-emerald-200">
                        Includes jump to ₹{profile.futureIncomeConfig.futureMonthlyIncome.toLocaleString()} in {profile.futureIncomeConfig.startsInMonths} months.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};