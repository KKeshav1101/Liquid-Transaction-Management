import React from 'react';
import { Transaction, TransactionType } from '../../types';
import { GLASS_PANEL, GLASS_PANEL_HOVER } from '../../constants';
import { TrendingUp, PieChart, Calendar, Wallet } from '../ui/Icons';

interface ActivityViewProps {
  transactions: Transaction[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ transactions }) => {
  // Sort by date descending
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {transactions.length} Transactions
        </span>
      </div>

      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
            <div className={`text-center py-12 text-slate-500 ${GLASS_PANEL} rounded-3xl border-dashed`}>
                <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions yet.</p>
                <p className="text-xs">Tap the + button to add one.</p>
            </div>
        ) : (
          sortedTransactions.map(tx => (
              <div key={tx.id} className={`flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-white/5 ${GLASS_PANEL_HOVER}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                    tx.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 
                    tx.type === TransactionType.INVESTMENT ? 'bg-cyan-500/10 text-cyan-400' :
                    'bg-red-500/10 text-red-400'
                    }`}>
                        {tx.type === TransactionType.INCOME ? <TrendingUp size={18} /> : 
                        tx.type === TransactionType.INVESTMENT ? <PieChart size={18} /> : 
                        <Calendar size={18} />}
                    </div>
                    <div>
                    <p className="font-medium text-sm text-white">{tx.category}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()} • {tx.note || tx.type}</p>
                    </div>
                </div>
                <span className={`font-semibold text-sm ${
                    tx.type === TransactionType.INCOME ? 'text-green-400' : 
                    tx.type === TransactionType.INVESTMENT ? 'text-cyan-400' : 
                    'text-white'
                }`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                </span>
              </div>
          ))
        )}
      </div>
    </div>
  );
};