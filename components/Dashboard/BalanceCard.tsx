import React from 'react';
import { GLASS_PANEL, THEME_GRADIENT } from '../../constants';
import { ArrowUpRight, ArrowDownRight } from '../ui/Icons';
import { LiquidLogo } from '../ui/LiquidLogo';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, monthlyIncome, monthlyExpense }) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 ${THEME_GRADIENT} shadow-lg shadow-cyan-500/20 mb-6 group`}>
      {/* Decorative Blur Circle */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
      
      {/* Brand Watermark */}
      <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110">
          <LiquidLogo size={140} />
      </div>
      
      <div className="relative z-10">
        <p className="text-cyan-100 text-sm font-medium mb-1 flex items-center gap-2">
            Total Balance
        </p>
        <h2 className="text-4xl font-bold text-white mb-6">
          ₹{balance.toLocaleString('en-IN')}
        </h2>

        <div className="flex justify-between items-center gap-4">
          <div className="bg-white/10 rounded-2xl p-3 flex-1 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-green-500/20 rounded-full">
                <ArrowUpRight size={14} className="text-green-300" />
              </div>
              <span className="text-xs text-cyan-100">Income</span>
            </div>
            <p className="font-semibold text-white">₹{monthlyIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 flex-1 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-red-500/20 rounded-full">
                <ArrowDownRight size={14} className="text-red-300" />
              </div>
              <span className="text-xs text-cyan-100">Expenses</span>
            </div>
            <p className="font-semibold text-white">₹{monthlyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};