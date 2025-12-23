import React from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Label,
    PieChart, Pie, Legend
} from 'recharts';
import { Transaction, TransactionType } from '../../types';
import { GLASS_PANEL } from '../../constants';
import { PieChart as PieChartIcon, Activity, BarChart3 } from 'lucide-react';

interface DashboardChartsProps {
    transactions: Transaction[];
    currentBalance: number;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ transactions }) => {
    
    // 1. Prepare Data for Daily Expenditure (Past 14 Days)
    const dailyExpenseData = React.useMemo(() => {
        const days = 14;
        const data = [];
        const today = new Date();
        
        // Create map of date -> total expense
        const expenseMap: Record<string, number> = {};
        
        transactions.forEach(tx => {
            if (tx.type === TransactionType.EXPENSE) {
                const dateStr = new Date(tx.date).toLocaleDateString();
                expenseMap[dateStr] = (expenseMap[dateStr] || 0) + tx.amount;
            }
        });

        // Generate last 14 days array
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateKey = d.toLocaleDateString();
            const displayDate = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
            
            data.push({
                date: displayDate,
                amount: expenseMap[dateKey] || 0
            });
        }
        return data;
    }, [transactions]);

    // 2. Prepare Data for Pie Chart (Distribution)
    const pieData = React.useMemo(() => {
        const categoryMap: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.type === TransactionType.EXPENSE) {
                categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
            }
        });
        
        const sorted = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // If more than 5 categories, group the rest into "Other"
        if (sorted.length <= 5) return sorted;

        const top = sorted.slice(0, 4);
        const otherValue = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
        
        return [...top, { name: 'Other', value: otherValue }];
    }, [transactions]);

    // 3. Prepare Data for Expense Breakdown (Top 5 for Bar Chart)
    const expenseData = React.useMemo(() => {
        const categoryMap: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.type === TransactionType.EXPENSE) {
                categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
            }
        });
        
        return Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories
    }, [transactions]);

    const hasTransactions = transactions.length > 0;
    const hasExpenses = expenseData.length > 0;

    return (
        <div className="space-y-6">
            
            {/* Daily Expenditure Line Graph */}
            <div className={`${GLASS_PANEL} rounded-3xl p-6 relative overflow-hidden`}>
                <h3 className="text-lg font-semibold text-white mb-1">Daily Expenditure</h3>
                <p className="text-xs text-slate-400 mb-4">Spending trend over the last 14 days</p>
                
                <div className="h-48 w-full -ml-4 relative">
                    {!hasExpenses && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pl-4">
                             <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-2">
                                <Activity size={14} className="text-slate-500" />
                                <span className="text-xs text-slate-400">No spending activity recorded yet</span>
                             </div>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyExpenseData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tick={{fontSize: 10, fill: '#94a3b8'}} 
                                axisLine={false}
                                tickLine={false}
                                interval={2}
                            >
                                <Label value="Date" offset={-10} position="insideBottom" style={{ fill: '#64748b', fontSize: '10px' }} />
                            </XAxis>
                            <YAxis 
                                hide={false} 
                                tick={{fontSize: 10, fill: '#94a3b8'}}
                                axisLine={false}
                                tickLine={false}
                                width={35}
                                tickFormatter={(val) => `${val/1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#ec4899' }}
                                formatter={(val: number) => [`₹${val}`, 'Spent']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="amount" 
                                stroke={hasExpenses ? "#ec4899" : "#334155"} 
                                strokeWidth={3} 
                                dot={{r: 3, fill: hasExpenses ? '#ec4899' : '#334155', strokeWidth: 0}}
                                activeDot={{r: 6}} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense Distribution Pie Chart */}
            <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
                <h3 className="text-lg font-semibold text-white mb-4">Expense Distribution</h3>
                <div className="h-64 w-full relative">
                    {hasExpenses ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val: number) => [`₹${val}`, '']}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-slate-400 ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                             <div className="relative mb-3">
                                 <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-dashed animate-spin-slow opacity-50"></div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <PieChartIcon size={24} className="opacity-50" />
                                 </div>
                             </div>
                             <p className="text-xs">Add expenses to visualize breakdown</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Expenses Bar Chart */}
            <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
                <h3 className="text-lg font-semibold text-white mb-4">Top Expenses</h3>
                <div className="h-48 w-full relative">
                    {hasExpenses ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseData} layout="vertical" margin={{ left: 0, right: 30, bottom: 20 }}>
                                <XAxis type="number" hide>
                                    <Label value="Amount Spent (₹)" offset={-10} position="insideBottom" style={{ fill: '#64748b', fontSize: '10px' }} />
                                </XAxis>
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{fontSize: 11, fill: '#cbd5e1'}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#334155', opacity: 0.2}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    formatter={(val: number) => [`₹${val}`, 'Spent']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                             <div className="flex items-end gap-1.5 opacity-30 mb-2">
                                 <div className="w-3 h-6 bg-slate-500 rounded-sm"></div>
                                 <div className="w-3 h-10 bg-slate-500 rounded-sm"></div>
                                 <div className="w-3 h-4 bg-slate-500 rounded-sm"></div>
                             </div>
                             <p className="text-xs">Top categories will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};