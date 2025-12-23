import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { GLASS_PANEL } from '../../constants';
import { LiquidLogo } from '../ui/LiquidLogo';

interface SetupModalProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !income || !balance) return;

    onComplete({
      name,
      monthlyIncome: parseFloat(income),
      currentBalance: parseFloat(balance),
      isSetup: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f172a] p-6">
      <div className={`w-full max-w-md ${GLASS_PANEL} bg-slate-900 rounded-3xl p-8 animate-in fade-in zoom-in duration-500`}>
        <div className="text-center mb-8 flex flex-col items-center">
            <div className="mb-4 p-4 bg-slate-800/50 rounded-full shadow-lg shadow-cyan-900/20 border border-white/5">
                <LiquidLogo size={64} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
                Liquid
            </h1>
            <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-2">Financial Assistant</p>
            <p className="text-slate-400 text-sm mt-2">Let's set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs text-slate-400 ml-1 block mb-1">What should we call you?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 ml-1 block mb-1">Estimated Monthly Income</label>
            <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">₹</span>
                <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="90000"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 ml-1 block mb-1">Current Wallet/Bank Balance</label>
            <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">₹</span>
                <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all mt-4"
          >
            Start Journey
          </button>
        </form>
      </div>
    </div>
  );
};