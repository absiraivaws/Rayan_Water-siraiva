
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabaseMutations } from '../hooks/useSupabaseMutations';
import { sortCustomersByProximity } from '../utils/geo';
import { Customer, Route } from '../types';

const RouteMaster: React.FC = () => {
  const { routes: fetchedRoutes, customers, drivers, vehicles, loading: dataLoading, error: dataError } = useSupabaseData();
  const { addRoute } = useSupabaseMutations();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [optimizedSequence, setOptimizedSequence] = useState<Customer[]>([]);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Added isEditing state
  const [isSaving, setIsSaving] = useState(false);

  // New Route Form State
  const [newRouteData, setNewRouteData] = useState({ name: '', vehicleId: '', driverId: '' });

  const YARD_COORDS = { lat: 6.9271, lng: 79.8612 };

  useEffect(() => {
    if (fetchedRoutes) {
      setRoutes(fetchedRoutes);
      // Auto-select first route if none selected and routes exist
      if (!selectedRoute && fetchedRoutes.length > 0) {
        setSelectedRoute(fetchedRoutes[0]);
      }
    }
  }, [fetchedRoutes]);

  useEffect(() => {
    if (selectedRoute) {
      // Filter customers belonging to the selected route
      const routeCustomers = customers.filter(c => c.routeId === selectedRoute.id);
      // Sort them by default when a route is first selected
      const sorted = sortCustomersByProximity(YARD_COORDS.lat, YARD_COORDS.lng, routeCustomers);
      setOptimizedSequence(sorted);
    } else {
      setOptimizedSequence([]);
    }
  }, [selectedRoute, customers]);

  const handleOptimize = () => {
    if (!selectedRoute) return;
    const routeCustomers = customers.filter(c => c.routeId === selectedRoute.id);
    const sorted = sortCustomersByProximity(YARD_COORDS.lat, YARD_COORDS.lng, routeCustomers);
    setOptimizedSequence(sorted);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newSequence = [...optimizedSequence];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSequence.length) return;

    [newSequence[index], newSequence[targetIndex]] = [newSequence[targetIndex], newSequence[index]];
    setOptimizedSequence(newSequence);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addRoute({
        name: newRouteData.name,
        vehicleId: newRouteData.vehicleId,
        driverId: newRouteData.driverId,
        customerIds: []
      });
      window.location.reload();
    } catch (err: any) {
      alert("Failed to create route: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (dataLoading) return <div className="p-8 text-center text-slate-500">Loading routes data...</div>;
  if (dataError) return <div className="p-8 text-center text-red-500">Error: {dataError}</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Route Planning</h2>
          <p className="text-slate-500 text-sm">Coordinate-based sequence optimization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOptimize}
            className="bg-white border border-slate-200 px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
            <i className="fa-solid fa-magic-wand-sparkles mr-2 text-primary"></i> Auto-Optimize
          </button>
          <button
            onClick={() => setShowRouteForm(true)}
            className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
          >
            <i className="fa-solid fa-plus mr-2"></i> New Route
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-widest ml-2">Active Routes</h3>
          <div className="space-y-3">
            {routes.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoute(r)}
                className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedRoute?.id === r.id ? 'bg-primary border-primary text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-lg">{r.name}</p>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedRoute?.id === r.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {customers.filter(c => c.routeId === r.id).length} Stops
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-80 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><i className="fa-solid fa-truck"></i> {vehicles.find(v => v.id === r.vehicleId)?.number || 'Unassigned'}</span>
                  <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-circle"></i> {drivers.find(d => d.id === r.driverId)?.name || 'Unassigned'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black text-2xl text-slate-800">Master Delivery Sequence</h3>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"><i className="fa-solid fa-print"></i></button>
              <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"><i className="fa-solid fa-share-nodes"></i></button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-50"></div>
            <div className="space-y-6">
              <div className="relative pl-14">
                <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-slate-800 border-4 border-white shadow-sm z-10"></div>
                <div>
                  <p className="text-sm font-black text-slate-800 tracking-wider">LOADING YARD (START)</p>
                  <p className="text-[10px] text-slate-400 font-bold">Lat: {YARD_COORDS.lat} | Lng: {YARD_COORDS.lng}</p>
                </div>
              </div>

              {selectedRoute ? (
                <div className="space-y-4">
                  {optimizedSequence.map((customer, index) => (
                    <div key={customer.id} className="relative pl-14 group">
                      <div className="absolute left-2.5 top-3 w-7 h-7 rounded-full bg-white border-2 border-slate-100 text-slate-300 flex items-center justify-center text-[10px] font-black z-10 group-hover:border-primary/60 group-hover:text-primary transition-all">
                        {index + 1}
                      </div>
                      <div className="p-5 rounded-[24px] border border-slate-100 bg-white group-hover:shadow-xl group-hover:border-blue-100 group-hover:-translate-y-1 transition-all flex justify-between items-center">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-slate-800 text-base truncate">{customer.name}</p>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${customer.waterType === 'Drinking' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                              {customer.waterType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate mb-1">{customer.address}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            <i className="fa-solid fa-location-dot mr-1 text-slate-200"></i>
                            {customer.lat.toFixed(4)}, {customer.lng.toFixed(4)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-primary disabled:opacity-20"
                          >
                            <i className="fa-solid fa-arrow-up"></i>
                          </button>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === optimizedSequence.length - 1}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-primary disabled:opacity-20"
                          >
                            <i className="fa-solid fa-arrow-down"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 italic">Select a route to view sequence</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRouteForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRouteForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-slide-in overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">New Route Configuration</h3>
              <button onClick={() => setShowRouteForm(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleCreateRoute} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1 tracking-widest">Route Identifier</label>
                <input required value={newRouteData.name} onChange={e => setNewRouteData({ ...newRouteData, name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="e.g. Northern Industrial Park" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1 tracking-widest">Select Truck</label>
                  <select value={newRouteData.vehicleId} onChange={e => setNewRouteData({ ...newRouteData, vehicleId: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1 tracking-widest">Assign Operator</label>
                  <select value={newRouteData.driverId} onChange={e => setNewRouteData({ ...newRouteData, driverId: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-5 bg-primary text-white font-black text-lg rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-10">
                {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Initialize Route'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMaster;
