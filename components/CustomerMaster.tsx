
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Customer } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabaseMutations } from '../hooks/useSupabaseMutations';

const CustomerMaster: React.FC = () => {
  const { userRole } = useOutletContext<{ userRole: 'ADMIN' | 'DRIVER' }>();
  const { customers: data, routes, transactions, loading: dataLoading, error: dataError } = useSupabaseData();
  const { addCustomer, updateCustomer, deleteCustomer } = useSupabaseMutations();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', whatsapp: '', nic: '', dob: '', address: '', waterType: 'Drinking', price: '150', routeId: '', creditLimit: '5000', creditAllowed: true, displayId: '', lat: 0, lng: 0
  });

  // Filters State
  const [filterRouteId, setFilterRouteId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Generate Customer ID based on Route
  useEffect(() => {
    if (!formData.routeId || editingCustomer) return; // Don't change ID if editing or no route

    const sortedRoutes = [...routes].sort((a, b) => a.name.localeCompare(b.name));
    const routeIndex = sortedRoutes.findIndex(r => r.id === formData.routeId);

    if (routeIndex === -1) return;

    const prefix = String.fromCharCode(65 + routeIndex); // A, B, C...
    const customersInRoute = customers.filter(c => c.routeId === formData.routeId);
    // Find max ID logic if needed, but for now simple count + 1 is MVP. 
    // Better: Parse existing IDs to find true max number to avoid duplicates if someone was deleted.
    // But keeping it simple as requested: "Count + 1" style logic mostly.

    // Let's actually parse to be safe, assuming format X000000
    let maxNum = 0;
    customersInRoute.forEach(c => {
      if (c.displayId && c.displayId.startsWith(prefix)) {
        const num = parseInt(c.displayId.slice(1));
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    const nextId = `${prefix}${(maxNum + 1).toString().padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, displayId: nextId }));

  }, [formData.routeId, customers, routes, editingCustomer]);

  useEffect(() => {
    if (data) setCustomers(data);
  }, [data]);

  // Compute Sales Data per Customer based on filters
  const salesMap = React.useMemo(() => {
    const map = new Map<string, { total: number, quantity: number }>();
    if (!transactions) return map;

    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if (end) end.setHours(23, 59, 59, 999); // Include full end day

    transactions.forEach(t => {
      const tDate = new Date(t.timestamp);
      if (start && tDate < start) return;
      if (end && tDate > end) return;

      if (!map.has(t.customerId)) {
        map.set(t.customerId, { total: 0, quantity: 0 });
      }
      const entry = map.get(t.customerId)!;
      entry.total += (t.total || 0);
      entry.quantity += (t.quantity || 0);
    });
    return map;
  }, [transactions, filterStartDate, filterEndDate]);

  // Compute Filtered & Sorted Customers
  const processedCustomers = React.useMemo(() => {
    let result = customers.filter(c =>
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.whatsapp && c.whatsapp.includes(searchTerm)) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.displayId && c.displayId.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterRouteId ? c.routeId === filterRouteId : true)
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        if (sortConfig.key === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortConfig.key === 'route') {
          aValue = routes.find(r => r.id === a.routeId)?.name || '';
          bValue = routes.find(r => r.id === b.routeId)?.name || '';
        } else if (sortConfig.key === 'balance') {
          aValue = a.balance;
          bValue = b.balance;
        } else if (sortConfig.key === 'sales') {
          aValue = salesMap.get(a.id)?.total || 0;
          bValue = salesMap.get(b.id)?.total || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, searchTerm, filterRouteId, sortConfig, salesMap, routes]);

  // Calculate Grand Totals
  const { totalRevenue, totalVolume } = React.useMemo(() => {
    return processedCustomers.reduce((acc, curr) => {
      const sales = salesMap.get(curr.id);
      return {
        totalRevenue: acc.totalRevenue + (sales?.total || 0),
        totalVolume: acc.totalVolume + (sales?.quantity || 0)
      };
    }, { totalRevenue: 0, totalVolume: 0 });
  }, [processedCustomers, salesMap]);

  if (dataLoading) return <div className="p-8 text-center text-slate-500">Loading customers...</div>;
  if (dataError) return <div className="p-8 text-center text-red-500">Error: {dataError}</div>;

  const startEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      whatsapp: c.whatsapp || '',
      nic: c.nic || '',
      dob: c.dob || '',
      address: c.address,
      waterType: c.waterType,
      price: c.pricePerUnit.toString(),
      routeId: c.routeId,
      creditLimit: c.creditLimit.toString(),
      creditAllowed: c.creditAllowed,
      creditLimit: c.creditLimit.toString(),
      creditAllowed: c.creditAllowed,
      displayId: c.displayId || '',
      lat: c.lat,
      lng: c.lng
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert("Failed to delete customer");
        console.error(err);
      }
    }
  };

  const toggleCustomerStatus = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    const newStatus = customer.status === 'Active' ? 'Inactive' : 'Active';

    // Optimistic update
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      await updateCustomer(id, { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
      // Revert
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: customer.status } : c));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocating(true);

    const processSubmission = async (lat: number, lng: number) => {
      setIsSaving(true);
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, {
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            nic: formData.nic,
            dob: formData.dob || undefined,
            address: formData.address,
            lat, lng,
            routeId: formData.routeId,
            waterType: formData.waterType as any,
            pricePerUnit: Number(formData.price),
            creditAllowed: formData.creditAllowed,
            creditLimit: Number(formData.creditLimit),
            displayId: formData.displayId
          });
          // Update local state (or wait for re-fetch, but optimistic is better UX)
          // Ideally we re-fetch or update local item
          window.location.reload(); // Simple refresh to fetch new data or use re-fetch from hook
        } else {
          await addCustomer({
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            nic: formData.nic,
            dob: formData.dob || undefined,
            address: formData.address,
            lat, lng,
            routeId: formData.routeId,
            waterType: formData.waterType as any,
            pricePerUnit: Number(formData.price),
            creditAllowed: formData.creditAllowed,
            creditLimit: Number(formData.creditLimit),
            displayId: formData.displayId
          });
          window.location.reload();
        }
        setShowForm(false);
        setEditingCustomer(null);
      } catch (err: any) {
        console.error(err);
        alert("Error saving customer: " + err.message);
      } finally {
        setIsSaving(false);
        setIsLocating(false);
      }
    };

    if (formData.lat && formData.lng) {
      processSubmission(formData.lat, formData.lng);
    } else if (editingCustomer) {
      processSubmission(editingCustomer.lat, editingCustomer.lng);
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => processSubmission(pos.coords.latitude, pos.coords.longitude),
          () => processSubmission(6.9271, 79.8612),
          { enableHighAccuracy: true }
        );
      } else {
        processSubmission(6.9271, 79.8612);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Directory</h2>
          <p className="text-slate-500 text-sm">Profile management & credit control</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"></i>
            <input
              type="text"
              placeholder="Search name, phone..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold w-full md:w-64 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setEditingCustomer(null); setFormData(prev => ({ ...prev, routeId: '', displayId: '' })); setShowForm(true); }}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all shadow-lg shadow-primary/30 text-sm"
          >
            <i className="fa-solid fa-user-plus"></i> <span className="hidden sm:inline">New Customer</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex flex-wrap gap-4 items-end w-full md:w-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Filter by Route</label>
            <select
              value={filterRouteId}
              onChange={e => setFilterRouteId(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none min-w-[200px]"
            >
              <option value="">All Routes</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
          {(filterRouteId || filterStartDate || filterEndDate) && (
            <button
              onClick={() => { setFilterRouteId(''); setFilterStartDate(''); setFilterEndDate(''); }}
              className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Grand Total Summary */}
        <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-black text-primary">Rs. {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
            <p className="text-lg font-bold text-slate-600">{totalVolume.toLocaleString()} L</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => setSortConfig({ key: 'name', direction: sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Customer {sortConfig?.key === 'name' && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'down-a-z' : 'up-z-a'} ml-1`}></i>}
                </th>
                <th className="px-6 py-4">Identifiers</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => setSortConfig({ key: 'balance', direction: sortConfig?.key === 'balance' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Financials {sortConfig?.key === 'balance' && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => setSortConfig({ key: 'sales', direction: sortConfig?.key === 'sales' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                  Total Sales {sortConfig?.key === 'sales' && <i className={`fa-solid fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                </th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {processedCustomers.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors group ${c.status === 'Inactive' ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      {c.name}
                      {c.displayId && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-bold">{c.displayId}</span>}
                    </p>
                    <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">
                      {routes?.find(r => r.id === c.routeId)?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-600">NIC: {c.nic || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">DOB: {c.dob || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{c.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{c.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-black ${c.balance > 0 ? 'text-red-500' : 'text-slate-800'}`}>Rs. {c.balance}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-accent' : 'bg-slate-300'}`}></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lim: {c.creditLimit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-sm">Rs. {(salesMap.get(c.id)?.total || 0).toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">{(salesMap.get(c.id)?.quantity || 0).toLocaleString()} Liters</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {userRole === 'ADMIN' && (
                        <>
                          <button onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"><i className="fa-solid fa-pen text-xs"></i></button>
                          <button onClick={() => toggleCustomerStatus(c.id)} className={`w-8 h-8 rounded-lg ${c.status === 'Active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-600' : 'bg-accent/10 text-accent hover:bg-accent'} hover:text-white transition-all`} title={c.status === 'Active' ? 'Deactivate' : 'Activate'}>
                            <i className={`fa-solid ${c.status === 'Active' ? 'fa-ban' : 'fa-check'} text-xs`}></i>
                          </button>
                          <button onClick={() => deleteCustomer(c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                        </>
                      )}
                      {userRole === 'DRIVER' && <span className="text-[10px] text-slate-300 italic">View Only</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {
        showForm && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-8 animate-slide-in overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pb-10">
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <label className="text-xs font-bold text-primary uppercase mb-1 block">Customer ID (Auto-Generated)</label>
                  <input disabled className="w-full bg-transparent text-xl font-black text-primary outline-none" value={formData.displayId || 'Pending Route...'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                    <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Customer Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Phone</label>
                    <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">WhatsApp</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Delivery Address</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocating(true);
                        if ("geolocation" in navigator) {
                          navigator.geolocation.getCurrentPosition(position => {
                            setFormData(prev => ({ ...prev, lat: position.coords.latitude, lng: position.coords.longitude }));
                            setIsLocating(false);
                          }, (err) => {
                            alert("Location failed: " + err.message);
                            setIsLocating(false);
                          });
                        } else {
                          setIsLocating(false);
                        }
                      }}
                      className="text-[10px] font-bold text-primary hover:text-secondary flex items-center gap-1 cursor-pointer"
                    >
                      <i className={`fa-solid ${isLocating ? 'fa-circle-notch fa-spin' : 'fa-location-crosshairs'}`}></i>
                      {formData.lat ? 'Update Location' : 'Get Auto Location'}
                    </button>
                  </div>
                  {formData.lat !== 0 && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                      <i className="fa-solid fa-check-circle"></i>
                      <span>GPS Captured: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</span>
                    </div>
                  )}
                  <textarea required rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Route Assignment</label>
                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })}>
                      <option value="">Select Route</option>
                      {routes?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Water Type</label>
                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value={formData.waterType} onChange={e => setFormData({ ...formData, waterType: e.target.value })}>
                      <option>Drinking</option><option>RO</option><option>Well</option><option>Industrial</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase">Enable Credit Line</label>
                    <button type="button" onClick={() => setFormData({ ...formData, creditAllowed: !formData.creditAllowed })} className={`w-12 h-6 rounded-full transition-all relative ${formData.creditAllowed ? 'bg-primary' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.creditAllowed ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <button
                  disabled={isLocating}
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                >
                  {isLocating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                  {editingCustomer ? 'Update Record' : 'Save Customer & Record Location'}
                </button>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default CustomerMaster;
