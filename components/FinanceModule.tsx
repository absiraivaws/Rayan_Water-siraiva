import React, { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabaseMutations } from '../hooks/useSupabaseMutations';
import { Expense } from '../types';

const FinanceModule: React.FC = () => {
  const { transactions, expenses, customers, loading, error } = useSupabaseData();
  const { addExpense } = useSupabaseMutations();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: 'Operating Cost',
    description: ''
  });

  // Filter Data
  const filteredTransactions = transactions?.filter(t => {
    if (!startDate && !endDate) return true;
    const tDate = new Date(t.timestamp).toISOString().split('T')[0];
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses?.filter(e => {
    if (!startDate && !endDate) return true;
    const eDate = new Date(e.date).toISOString().split('T')[0];
    if (startDate && eDate < startDate) return false;
    if (endDate && eDate > endDate) return false;
    return true;
  });

  // Calculate Totals using Real Data
  const totalRevenue = filteredTransactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  const totalExpenses = filteredExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;

  // Calculate Cash vs Credit split
  const cashTransactions = filteredTransactions?.filter(t => t.paymentMethod === 'Cash').reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  const creditTransactions = filteredTransactions?.filter(t => t.paymentMethod === 'Credit').reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  const totalForSplit = cashTransactions + creditTransactions || 1; // Avoid div by 0
  const cashPct = Math.round((cashTransactions / totalForSplit) * 100);
  const creditPct = 100 - cashPct;

  // Merge transactions and expenses for the history list
  const history = [
    ...(filteredTransactions || []).map(t => {
      const customer = customers?.find(c => c.id === t.customerId);
      return {
        ...t,
        type: 'Collection',
        title: customer ? `${customer.name}` : `Sale #${t.id.slice(0, 4)}`,
        customerId: t.customerId, // ensure available if needed
        cat: t.paymentMethod,
        amount: t.total,
        date: new Date(t.timestamp).toLocaleDateString()
      };
    }),
    ...(filteredExpenses || []).map(e => ({
      ...e,
      type: 'Expense',
      title: e.title,
      cat: e.category,
      amount: e.amount,
      date: new Date(e.date).toLocaleDateString()
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setIsSaving(true);
    try {
      await addExpense({
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category as any || 'Other',
        description: formData.description
      });
      alert('Expense recorded successfully');
      setShowExpenseForm(false);
      setFormData({ title: '', amount: 0, category: 'Operating Cost', description: '' });
      window.location.reload();
    } catch (err: any) {
      alert('Failed to record expense: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading financial data...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Management</h2>
          <p className="text-slate-500 text-sm">Track expenses, collections and profitability</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <input type="date" className="text-xs font-bold bg-transparent outline-none text-slate-600" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-400">-</span>
            <input type="date" className="text-xs font-bold bg-transparent outline-none text-slate-600" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-all"
          >
            <i className="fa-solid fa-plus mr-2"></i> Record Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Value Cards */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Gross Revenue</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Rs. {totalRevenue.toLocaleString()}</h3>
          <div className="mt-4 flex gap-3 text-[10px] font-black">
            <span className="text-accent bg-accent/10 px-3 py-1.5 rounded-full uppercase">Cash: {cashPct}%</span>
            <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase">Credit: {creditPct}%</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Costs</p>
          <h3 className="text-3xl font-black text-red-600 tracking-tighter">Rs. {totalExpenses.toLocaleString()}</h3>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
            <span className="bg-slate-100 px-2 py-1 rounded">Fuel</span>
            <span className="bg-slate-100 px-2 py-1 rounded">Maint.</span>
            <span className="bg-slate-100 px-2 py-1 rounded">Payroll</span>
          </div>
        </div>
        <div className="bg-primary p-5 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">Projected Net Profit</p>
          <h3 className={`text-3xl font-black tracking-tighter ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
            Rs. {netProfit.toLocaleString()}
          </h3>
          <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calculated after deductions</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-black text-xl text-slate-800">Transaction History</h4>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <span className="text-[10px] font-black px-3 py-2 rounded-lg cursor-pointer transition-all bg-white shadow-sm">All Time</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {history.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold">No transactions found.</div>
          ) : (
            history.map((t: any, idx) => (
              <div key={idx} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                <div className="flex gap-5 items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${t.type === 'Expense' ? 'bg-red-50 text-red-500' : 'bg-accent/10 text-accent'}`}>
                    <i className={`fa-solid ${t.type === 'Expense' ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`}></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{t.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      {t.date} • {t.cat}
                      {t.customerId && <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">ID: {t.customerId}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className={`font-black text-lg ${t.type === 'Expense' ? 'text-red-600' : 'text-accent'}`}>
                    {t.type === 'Expense' ? '-' : '+'}Rs. {Number(t.amount).toLocaleString()}
                  </p>
                  <button className="text-slate-200 group-hover:text-slate-400 transition-colors"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExpenseForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-10 animate-slide-in overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-800">Record Transaction</h3>
              <button onClick={() => setShowExpenseForm(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Voucher Description</label>
                <input
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                  placeholder="e.g. Monthly Electricity"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Amount (LKR)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Category</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option>Operating Cost</option>
                    <option>Maintenance</option>
                    <option>Salary/Comm</option>
                    <option>Fuel</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              {/* Optional Note/Description field if we want more detail */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Notes (Optional)</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl hover:bg-secondary transition-all disabled:opacity-50"
              >
                {isSaving ? 'Recording...' : 'Post Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
