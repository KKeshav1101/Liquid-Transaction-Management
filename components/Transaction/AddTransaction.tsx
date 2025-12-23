import React, { useState } from 'react';
import { Category, Transaction, TransactionType } from '../../types';
import { GLASS_PANEL } from '../../constants';
import { X, Clipboard, Sparkles, MessageSquare } from '../ui/Icons';

interface AddTransactionProps {
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd, onClose }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [note, setNote] = useState('');
  
  // Smart Paste State
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const parseMessage = (text: string) => {
    setMessageText(text);
    if (!text) return;

    // 1. Extract Amount
    const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i;
    const amountMatch = text.match(amountRegex);
    
    if (amountMatch && amountMatch[1]) {
      const cleanAmount = amountMatch[1].replace(/,/g, '');
      setAmount(cleanAmount);
    }

    // 2. Detect Type
    const lowerText = text.toLowerCase();
    if (lowerText.includes('credited') || lowerText.includes('received')) {
      setType(TransactionType.INCOME);
      setCategory(Category.SALARY);
    } else if (lowerText.includes('debited') || lowerText.includes('spent')) {
      setType(TransactionType.EXPENSE);
    }

    // 3. Extract Note
    const noteRegex = /(?:to|at|from|vp|info)\s+([a-zA-Z0-9\s\.\-&]+?)(?:\s+(?:on|for|via|ref|\.)|$)/i;
    const noteMatch = text.match(noteRegex);
    if (noteMatch && noteMatch[1]) {
        const cleanNote = noteMatch[1].replace(/UPI|Ref|IMPS|NEFT/gi, '').trim();
        setNote(cleanNote);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseMessage(text);
      setIsSmartPasteOpen(true);
    } catch (err) {
      console.error('Failed to read clipboard', err);
      setIsSmartPasteOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Default categories if hidden
    let finalCategory = category;
    if (type === TransactionType.INCOME) finalCategory = Category.SALARY; 
    if (type === TransactionType.INVESTMENT) finalCategory = Category.INVESTMENT;

    onAdd({
      amount: parseFloat(amount),
      type,
      category: finalCategory,
      note,
      date: new Date().toISOString(),
    });
    onClose();
  };

  // Helper to get labels based on type
  const getNotePlaceholder = () => {
      if (type === TransactionType.INCOME) return "Who credited this? (e.g. Employer, Mom)";
      if (type === TransactionType.INVESTMENT) return "Investment Name (e.g. HDFC Nifty 50)";
      return "What was this for? (e.g. Dinner, Uber)";
  };

  const getNoteLabel = () => {
      if (type === TransactionType.INCOME) return "Received From / Source";
      if (type === TransactionType.INVESTMENT) return "Asset / Plan Name";
      return "Note (Optional)";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md ${GLASS_PANEL} bg-slate-900 rounded-3xl p-6 animate-in slide-in-from-bottom duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {type === TransactionType.EXPENSE && 'Add Expense'}
            {type === TransactionType.INCOME && 'Add Credit'}
            {type === TransactionType.INVESTMENT && 'Track Investment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Smart Paste Toggle */}
        <div className="mb-6">
            {!isSmartPasteOpen ? (
                <button 
                    onClick={handlePasteFromClipboard}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center gap-2 text-violet-300 hover:bg-violet-600/30 transition-all group"
                >
                    <Sparkles size={18} className="group-hover:animate-pulse" />
                    <span className="text-sm font-medium">Auto-fill from Message / Clipboard</span>
                </button>
            ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea 
                        value={messageText}
                        onChange={(e) => parseMessage(e.target.value)}
                        placeholder="Paste text like: 'Rs 500 debited for Swiggy...'"
                        className="w-full bg-slate-950/50 border border-violet-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors h-20 resize-none"
                        autoFocus
                    />
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Custom Toggle Switch */}
          <div className="flex p-1 bg-slate-950/50 rounded-xl">
            <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === TransactionType.EXPENSE 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Expense
            </button>
            <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === TransactionType.INCOME
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Credit
            </button>
            <button
                type="button"
                onClick={() => setType(TransactionType.INVESTMENT)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === TransactionType.INVESTMENT
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Invest
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="text-xs text-slate-400 ml-1">
                {type === TransactionType.INCOME ? 'Amount Credited' : 
                 type === TransactionType.INVESTMENT ? 'Amount Invested' : 'Amount Spent'}
            </label>
            <div className="relative mt-1">
                <span className="absolute left-4 top-3.5 text-slate-500 text-lg">₹</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    autoFocus={!isSmartPasteOpen}
                />
            </div>
          </div>

          {/* Source/Note Field */}
          <div>
            <label className="text-xs text-slate-400 ml-1">{getNoteLabel()}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={getNotePlaceholder()}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 text-white mt-1 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Dropdown (Only for Expense) */}
          {type === TransactionType.EXPENSE && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="text-xs text-slate-400 ml-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 text-white mt-1 focus:outline-none focus:border-cyan-500 appearance-none"
                >
                  {Object.values(Category)
                    .filter(c => c !== Category.SALARY && c !== Category.INVESTMENT)
                    .map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
          )}

          <button
            type="submit"
            className={`w-full font-bold py-4 rounded-xl mt-4 shadow-lg transition-all ${
                type === TransactionType.INCOME 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20' 
                : type === TransactionType.INVESTMENT
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-red-500/20'
            } text-white`}
          >
            {type === TransactionType.INCOME && 'Add to Balance'}
            {type === TransactionType.EXPENSE && 'Record Expense'}
            {type === TransactionType.INVESTMENT && 'Track Investment'}
          </button>
        </form>
      </div>
    </div>
  );
};