import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { GLASS_PANEL } from '../../constants';
import { BrainCircuit, HelpCircle, X, MessageSquare, Sparkles, TrendingUp, CloudOff } from '../ui/Icons';
import { analyzeInvestmentAction } from '../../services/geminiService';
import { UserProfile, Transaction } from '../../types';

interface InvestmentVisualizerProps {
    profile?: UserProfile;
    transactions?: Transaction[];
    isOnline?: boolean;
}

// --- Text Formatter Component ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    // Split by newlines
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const parseInline = (str: string) => {
        // Handle __underline__
        const parts = str.split(/(__.*?__)/g);
        return parts.map((part, i) => {
            if (part.startsWith('__') && part.endsWith('__')) {
                return (
                    <span key={i} className="underline decoration-cyan-400 decoration-2 underline-offset-2 font-semibold text-white">
                        {part.slice(2, -2)}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="space-y-2">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                
                // Header (###)
                if (trimmed.startsWith('###')) {
                    return (
                        <h4 key={idx} className="text-cyan-400 font-bold text-xs uppercase tracking-wider mt-3 mb-1 border-b border-white/10 pb-1">
                            {trimmed.replace(/^###\s*/, '')}
                        </h4>
                    );
                }
                
                // Bullet Point (*)
                if (trimmed.startsWith('*')) {
                    return (
                        <div key={idx} className="flex gap-2 items-start pl-1">
                            <span className="text-cyan-400 mt-1.5 text-[8px]">●</span>
                            <p className="text-sm leading-relaxed text-slate-200 flex-1">
                                {parseInline(trimmed.replace(/^\*\s*/, ''))}
                            </p>
                        </div>
                    );
                }

                // Normal Paragraph
                return (
                    <p key={idx} className="text-sm leading-relaxed text-slate-200">
                        {parseInline(trimmed)}
                    </p>
                );
            })}
        </div>
    );
};

export const InvestmentVisualizer: React.FC<InvestmentVisualizerProps> = ({ profile, transactions, isOnline = true }) => {
  // Chart State
  const [principal, setPrincipal] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(15000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);
  const [showHelp, setShowHelp] = useState(false);

  // Chat State
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'agent', text: string}[]>([
      {role: 'agent', text: '### Ready to Plan\nTell me about an investment plan you are considering (e.g., "HDFC Nifty 50 SIP for 5k a month") and I will simulate the growth for you.'}
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSendMessage = async () => {
      if (!input.trim() || !profile || !transactions) return;
      if (!isOnline) return;

      const userMsg = input;
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsTyping(true);

      try {
          const result = await analyzeInvestmentAction(userMsg, profile, transactions);
          
          if (result.params) {
              setPrincipal(result.params.principal || 0);
              setMonthlyContribution(result.params.monthlyContribution || 0);
              setRate(result.params.rate || 12);
              setYears(result.params.years || 5);
          }

          setMessages(prev => [...prev, { role: 'agent', text: result.explanation }]);
      } catch (e) {
          setMessages(prev => [...prev, { role: 'agent', text: "### Error\nSorry, I had trouble analyzing that plan. Can you try again?" }]);
      } finally {
          setIsTyping(false);
      }
  };

  const data = useMemo(() => {
    const result = [];
    let currentBalance = principal;
    let totalInvested = principal;

    for (let year = 0; year <= years; year++) {
      result.push({
        year: `Y${year}`,
        balance: Math.round(currentBalance),
        invested: Math.round(totalInvested),
        interest: Math.round(currentBalance - totalInvested),
      });

      // Calculate next year
      for (let month = 0; month < 12; month++) {
        currentBalance = (currentBalance + monthlyContribution) * (1 + (rate / 100) / 12);
        totalInvested += monthlyContribution;
      }
    }
    return result;
  }, [principal, monthlyContribution, rate, years]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-4 pb-24 relative h-full flex flex-col">
      
      {/* Help Modal Overlay */}
      {showHelp && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm rounded-3xl p-6 flex items-center justify-center animate-in fade-in duration-200">
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl relative max-w-sm">
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                      <X size={20} />
                  </button>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={18} className="text-cyan-400" />
                      About Simulator
                  </h3>
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      This tool uses the <strong>Compound Interest</strong> formula to project wealth growth.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                      <li><strong>Principal:</strong> Your current lump-sum investment.</li>
                      <li><strong>Monthly Add:</strong> Amount you plan to invest every month (SIP).</li>
                      <li><strong>CAGR:</strong> Expected annual return rate (e.g., Nifty 50 avg is ~12%).</li>
                  </ul>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Investments</h2>
            <button 
                onClick={() => setShowHelp(true)}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
            >
                <HelpCircle size={20} />
            </button>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1 rounded-full border ${isOnline ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/50' : 'text-slate-400 bg-slate-800 border-slate-700'}`}>
            <Sparkles size={12} className={isOnline ? "" : "opacity-50"} />
            {isOnline ? 'AI Agent Active' : 'AI Offline'}
        </div>
      </div>

      {/* Chart Visualization */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6 h-64 shrink-0`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
                dataKey="year" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
            />
            <YAxis 
                hide={false}
                tickFormatter={(val) => formatCurrency(val)}
                tick={{fontSize: 10, fill: '#94a3b8'}}
                axisLine={false} 
                tickLine={false}
                width={40}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => formatCurrency(value)}
            />
            <Area type="monotone" dataKey="balance" stroke="#06b6d4" fillOpacity={1} fill="url(#colorBalance)" name="Total Value" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Parameters Summary */}
      <div className="flex justify-between items-center gap-2 text-xs text-slate-400 px-2 shrink-0">
          <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5 text-center flex-1">
              <span className="block text-[10px] uppercase tracking-wider mb-1">Monthly</span>
              <span className="text-white font-mono">₹{monthlyContribution.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5 text-center flex-1">
              <span className="block text-[10px] uppercase tracking-wider mb-1">Rate</span>
              <span className="text-cyan-400 font-bold">{rate}%</span>
          </div>
          <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5 text-center flex-1">
              <span className="block text-[10px] uppercase tracking-wider mb-1">Duration</span>
              <span className="text-white font-mono">{years} Yrs</span>
          </div>
      </div>

      {/* Chat Interface */}
      <div className={`flex-1 flex flex-col ${GLASS_PANEL} rounded-3xl overflow-hidden mt-2 relative`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-2xl p-3 text-sm leading-relaxed shadow-lg ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-none' 
                            : 'bg-slate-700/80 text-slate-200 rounded-bl-none border border-slate-600/50'
                      }`}>
                          {msg.role === 'agent' && <BrainCircuit size={14} className="mb-2 text-cyan-400" />}
                          {/* Use the new FormattedText component */}
                          <FormattedText text={msg.text} />
                      </div>
                  </div>
              ))}
              {isTyping && (
                  <div className="flex justify-start">
                      <div className="bg-slate-700/50 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-1"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-2"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-3"></div>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900/50 border-t border-white/5">
              <div className="relative">
                {isOnline ? (
                    <>
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Describe a plan (e.g. 5k SIP in Small Cap)..."
                            className="w-full bg-slate-800/80 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-cyan-500 focus:outline-none placeholder:text-slate-500 shadow-inner"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isTyping}
                            className="absolute right-2 top-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-md"
                        >
                            <TrendingUp size={18} />
                        </button>
                    </>
                ) : (
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed">
                        <CloudOff size={16} />
                        <span>Offline: AI Assistant Unavailable</span>
                    </div>
                )}
              </div>
          </div>
      </div>

    </div>
  );
};