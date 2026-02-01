
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useSupabaseData } from '../hooks/useSupabaseData';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { customers, routes, transactions, loading, error } = useSupabaseData();

  // Filter State
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    route: '',
    customer: '',
    status: '',
    deliveryStatus: ''
  });

  const clearFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Filter by Route
      if (filters.route) {
        const route = routes.find(r => r.name === filters.route);
        if (route && c.routeId !== route.id) return false;
      }
      // Filter by Customer Name
      if (filters.customer && c.name !== filters.customer) return false;
      // Filter by Status
      if (filters.status && c.status !== filters.status) return false;
      return true;
    });
  }, [customers, routes, filters]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      // Date Range
      if (tDate < start || tDate > end) return false;

      // Resolve Customer for other filters
      const customer = customers.find(c => c.id === t.customerId);
      if (!customer) return false; // Should not happen in consistent DB

      // Route Filter
      if (filters.route) {
        const route = routes.find(r => r.name === filters.route);
        if (route && customer.routeId !== route.id) return false;
      }
      // Customer Filter
      if (filters.customer && customer.name !== filters.customer) return false;
      // Status (Transaction Status or Customer Status?) - Assuming Delivery Status
      if (filters.deliveryStatus && t.status !== filters.deliveryStatus) return false;

      return true;
    });
  }, [transactions, customers, routes, filters]);


  // Compute Weekly Sales Data from FILTERED Transactions
  const chartData = useMemo(() => {
    const data = filteredTransactions;
    if (!data) return [];

    const dayMap = new Map();

    // Populate last 7 days (or selected range) first to ensure X-axis consistency
    // Let's stick to last 7 days relative to selected End Date for visualization?
    // Or just map the filtered items.
    // For dashboard consistency, let's map the filtered data.

    filteredTransactions.forEach(t => {
      const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, { name: dateStr, sales: 0, credit: 0 });
      const entry = dayMap.get(dateStr);
      if (t.paymentMethod === 'Cash') entry.sales += (t.total || 0);
      if (t.paymentMethod === 'Credit') entry.credit += (t.total || 0);
    });

    return Array.from(dayMap.values());
  }, [filteredTransactions]);

  const activeRoutesCount = routes.length;

  // Calculate total outstanding balance from FILTERED customers
  const totalOutstanding = useMemo(() => {
    return filteredCustomers.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  }, [filteredCustomers]);

  // Calculate Revenue from FILTERED Transactions
  const revenue = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  }, [filteredTransactions]);

  const pendingDeliveries = useMemo(() => {
    // Logic: active customers in filtered set vs deliveries in filtered set
    const deliveredIds = new Set(filteredTransactions.map(t => t.customerId));
    const totalActive = filteredCustomers.filter(c => c.status === 'Active').length;
    return `${deliveredIds.size} / ${totalActive}`;
  }, [filteredTransactions, filteredCustomers]);

  const kpis = [
    { label: "Revenue (Selected)", value: `Rs. ${revenue.toLocaleString()}`, icon: "fa-money-bill-trend-up", color: "text-accent", bg: "bg-accent/10", target: 'finance' },
    { label: "Delivery Progress", value: pendingDeliveries, icon: "fa-truck-loading", color: "text-primary", bg: "bg-primary/10", target: 'deliveries' },
    { label: "Active Routes", value: `${activeRoutesCount} Routes`, icon: "fa-map", color: "text-purple-600", bg: "bg-purple-100", target: 'routes' },
    { label: "Outstanding (Selected)", value: `Rs. ${totalOutstanding.toLocaleString()}`, icon: "fa-wallet", color: "text-amber-600", bg: "bg-amber-100", target: 'customers' },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
        Error loading dashboard: {error}
      </div>
    );
  }

  // Helper for Select with Clear Button
  const SelectWithClear = ({ label, value, onChange, onClear, options, placeholder }: any) => (
    <div className="space-y-1 relative group">
      <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none appearance-none pr-8 min-w-[140px]"
        >
          <option value="">{placeholder}</option>
          {options.map((opt: string) => <option key={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <i className="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i>
        </div>
        {value && (
          <button
            onClick={onClear}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 bg-slate-50 p-1 rounded-full"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Date Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>

          <SelectWithClear
            label="Route"
            value={filters.route}
            onChange={(val: string) => handleFilterChange('route', val)}
            onClear={() => clearFilter('route')}
            placeholder="All Routes"
            options={routes.map(r => r.name)}
          />

          <SelectWithClear
            label="Customer"
            value={filters.customer}
            onChange={(val: string) => handleFilterChange('customer', val)}
            onClear={() => clearFilter('customer')}
            placeholder="All Customers"
            options={customers.slice(0, 50).map(c => c.name)}
          />

          <SelectWithClear
            label="Status"
            value={filters.status}
            onChange={(val: string) => handleFilterChange('status', val)}
            onClear={() => clearFilter('status')}
            placeholder="All Status"
            options={['Active', 'Inactive']}
          />

          <SelectWithClear
            label="Del. Status"
            value={filters.deliveryStatus}
            onChange={(val: string) => handleFilterChange('deliveryStatus', val)}
            onClear={() => clearFilter('deliveryStatus')}
            placeholder="All Deliveries"
            options={['Pending', 'Completed', 'Skipped']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/${kpi.target}`)}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${kpi.icon} text-xl`}></i>
              </div>
              <span className="text-xs font-bold text-slate-400">Filtered</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{kpi.label}</p>
            <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Sales Analytics (Filtered)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="sales" name="Cash Sales" fill="#2ea9d1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="credit" name="Credit Sales" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Delivery Efficiency</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#2ea9d1" strokeWidth={4} dot={{ r: 5, fill: '#2ea9d1', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
