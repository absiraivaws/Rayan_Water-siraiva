import React, { useState, useEffect } from 'react';
import { Vehicle, Driver } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabaseMutations } from '../hooks/useSupabaseMutations';

const FleetDrivers: React.FC = () => {
  const { vehicles: fetchedVehicles, drivers: fetchedDrivers, loading: dataLoading, error: dataError } = useSupabaseData();
  const { addVehicle, updateVehicle, deleteVehicle, addDriver, updateDriver, deleteDriver } = useSupabaseMutations();

  // State for UI
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'v' | 'd', data: any } | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ type: 'v' | 'd', id: string } | null>(null);

  // Local state for UI responsiveness (though reloading page is safer for MVP)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Loading states for actions
  const [isSaving, setIsSaving] = useState(false);

  // Forms
  const [vehicleForm, setVehicleForm] = useState({
    number: '', capacityValue: '5000', capacityUnit: 'Liters', width: '', height: '',
    waterTypeAllowed: ['Drinking'], assignedDriverId: '', fuelType: 'Diesel', avgMileage: '8'
  });

  const [driverForm, setDriverForm] = useState({
    name: '', phone: '', nic: '', licenseNo: '', licenseExpiry: '',
    dailySalary: '2500', commissionPct: '2'
  });

  useEffect(() => {
    if (fetchedVehicles) setVehicles(fetchedVehicles);
    if (fetchedDrivers) setDrivers(fetchedDrivers);
  }, [fetchedVehicles, fetchedDrivers]);

  if (dataLoading) return <div className="p-8 text-center text-slate-500">Loading fleet data...</div>;
  if (dataError) return <div className="p-8 text-center text-red-500">Error: {dataError}</div>;

  // --- Handlers ---

  const toggleVehicleStatus = async (id: string) => {
    const v = vehicles.find(v => v.id === id);
    if (!v) return;
    const newStatus = v.status === 'Active' ? 'Repair' : 'Active';
    // Optimistic
    setVehicles(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    try {
      await updateVehicle(id, { status: newStatus });
    } catch (e: any) {
      alert("Failed to update vehicle status: " + e.message);
      setVehicles(prev => prev.map(item => item.id === id ? { ...item, status: v.status } : item)); // Revert
    }
  };

  const toggleDriverStatus = async (id: string) => {
    const d = drivers.find(d => d.id === id);
    if (!d) return;
    const newStatus = d.status === 'Available' ? 'Leave' : 'Available';
    setDrivers(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    try {
      await updateDriver(id, { status: newStatus });
    } catch (e: any) {
      alert("Failed to update driver status: " + e.message);
      setDrivers(prev => prev.map(item => item.id === id ? { ...item, status: d.status } : item)); // Revert
    }
  };

  const handleDelete = async () => {
    if (!deleteWarning) return;
    try {
      if (deleteWarning.type === 'v') {
        await deleteVehicle(deleteWarning.id);
        setVehicles(prev => prev.filter(v => v.id !== deleteWarning.id));
      } else {
        await deleteDriver(deleteWarning.id);
        setDrivers(prev => prev.filter(d => d.id !== deleteWarning.id));
      }
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleteWarning(null);
    }
  };

  const startEdit = (type: 'v' | 'd', data: any) => {
    setEditingItem({ type, data });
    if (type === 'v') {
      setVehicleForm({
        number: data.number,
        capacityValue: data.capacityValue.toString(),
        capacityUnit: data.capacityUnit,
        width: data.width ? data.width.toString() : '',
        height: data.height ? data.height.toString() : '',
        waterTypeAllowed: data.waterTypeAllowed || ['Drinking'],
        assignedDriverId: data.assignedDriverId || '',
        fuelType: data.fuelType,
        avgMileage: data.avgMileage.toString()
      });
      setShowVehicleForm(true);
    } else {
      setDriverForm({
        name: data.name,
        phone: data.phone,
        nic: data.nic,
        licenseNo: data.licenseNo,
        licenseExpiry: data.licenseExpiry,
        dailySalary: data.dailySalary.toString(),
        commissionPct: data.commissionPct.toString()
      });
      setShowDriverForm(true);
    }
  };

  // No duplicates here, just the submit handlers
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        number: vehicleForm.number,
        capacity_value: Number(vehicleForm.capacityValue),
        capacity_unit: vehicleForm.capacityUnit,
        water_type_allowed: vehicleForm.waterTypeAllowed, // Now correctly an array
        assigned_driver_id: vehicleForm.assignedDriverId || null,
        fuel_type: vehicleForm.fuelType,
        avg_mileage: Number(vehicleForm.avgMileage),
        width: Number(vehicleForm.width),
        height: Number(vehicleForm.height)
      };

      if (editingItem?.type === 'v') {
        await updateVehicle(editingItem.data.id, payload);
      } else {
        await addVehicle(payload);
      }
      window.location.reload();
    } catch (err: any) {
      alert("Error saving vehicle: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        name: driverForm.name,
        phone: driverForm.phone,
        nic: driverForm.nic,
        license_no: driverForm.licenseNo,
        license_expiry: driverForm.licenseExpiry,
        daily_salary: Number(driverForm.dailySalary),
        commission_pct: Number(driverForm.commissionPct)
      };

      if (editingItem?.type === 'd') {
        await updateDriver(editingItem.data.id, payload);
      } else {
        await addDriver(payload);
      }
      window.location.reload();
    } catch (err: any) {
      alert("Error saving driver: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicles Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Vehicle Master</h3>
            <button
              onClick={() => setShowVehicleForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-secondary transition-all"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add Vehicle
            </button>
          </div>
          <div className="grid gap-4">
            {vehicles.map(v => {
              const assignedDriver = v.assignedDriverId ? drivers.find(d => d.id === v.assignedDriverId) : null;
              return (
                <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group relative overflow-hidden">
                  {v.status !== 'Active' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>}
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-4 rounded-xl text-slate-500">
                      <i className="fa-solid fa-truck-moving text-xl"></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{v.number}</p>
                      <p className="text-xs text-slate-500">Cap: {v.capacityValue} {v.capacityUnit} | {v.fuelType}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-primary font-bold uppercase">Mileage: {v.avgMileage} km/l</p>
                        {assignedDriver && (
                          <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                            <i className="fa-solid fa-user-tag"></i> {assignedDriver.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${v.status === 'Active' ? 'bg-accent/10 text-accent' : 'bg-red-100 text-red-700'}`}>
                        {v.status}
                      </span>
                    </div>
                    <div className="relative group/menu">
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-20 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100">
                        <button onClick={() => toggleVehicleStatus(v.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Toggle Status</button>
                        <button onClick={() => startEdit('v', v)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Edit Record</button>
                        <div className="h-px bg-slate-50 my-1"></div>
                        <button onClick={() => setDeleteWarning({ type: 'v', id: v.id })} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Drivers Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Driver Master</h3>
            <button
              onClick={() => setShowDriverForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-secondary transition-all"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add Driver
            </button>
          </div>
          <div className="grid gap-4">
            {drivers.map(d => (
              <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{d.name}</p>
                    <p className="text-xs text-slate-500">NIC: {d.nic} | Ph: {d.phone}</p>
                    <div className="flex gap-2">
                      <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">License No: {d.licenseNo}</p>
                      {d.licenseExpiry && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Exp: {d.licenseExpiry}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${d.status === 'Available' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-secondary'}`}>
                    {d.status}
                  </span>
                  <div className="relative group/menu">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-20 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100">
                      <button onClick={() => toggleDriverStatus(d.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Toggle Status</button>
                      <button onClick={() => startEdit('d', d)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Edit Record</button>
                      <div className="h-px bg-slate-50 my-1"></div>
                      <button onClick={() => setDeleteWarning({ type: 'd', id: d.id })} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteWarning(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-slide-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h4 className="text-xl font-bold text-center text-slate-800 mb-2">Delete Record?</h4>
            <p className="text-slate-500 text-center text-sm mb-8">This will permanently remove the record from the active directory.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteWarning(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Form Overlay */}
      {showVehicleForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeForms}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-slide-in overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">{editingItem ? 'Edit Vehicle' : 'New Vehicle Registration'}</h3>
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Plate Number</label>
                <input required value={vehicleForm.number} onChange={e => setVehicleForm({ ...vehicleForm, number: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="WP-ABC-1234" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Capacity</label>
                  <input required value={vehicleForm.capacityValue} onChange={e => setVehicleForm({ ...vehicleForm, capacityValue: e.target.value })} type="number" className="w-full p-3 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Unit</label>
                  <select value={vehicleForm.capacityUnit} onChange={e => setVehicleForm({ ...vehicleForm, capacityUnit: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl">
                    <option>Liters</option>
                    <option>Bottles</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Width (m)</label>
                  <input required value={vehicleForm.width} onChange={e => setVehicleForm({ ...vehicleForm, width: e.target.value })} type="number" step="0.1" className="w-full p-3 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Height (m)</label>
                  <input required value={vehicleForm.height} onChange={e => setVehicleForm({ ...vehicleForm, height: e.target.value })} type="number" step="0.1" className="w-full p-3 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Fuel Type</label>
                <select value={vehicleForm.fuelType} onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl">
                  <option>Diesel</option>
                  <option>Petrol</option>
                  <option>Electric</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Average Mileage (km/l)</label>
                <input required value={vehicleForm.avgMileage} onChange={e => setVehicleForm({ ...vehicleForm, avgMileage: e.target.value })} type="number" className="w-full p-3 bg-slate-50 border rounded-xl" />
              </div>
              <button disabled={isSaving} type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 flex justify-center">
                {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : (editingItem ? 'Update Vehicle' : 'Save Vehicle')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Form Overlay */}
      {showDriverForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeForms}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-slide-in overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">{editingItem ? 'Edit Driver' : 'New Driver Onboarding'}</h3>
            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <input required value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Full Name" />
              <input required value={driverForm.nic} onChange={e => setDriverForm({ ...driverForm, nic: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="NIC Number" />
              <input required value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Phone Number" />
              <input required value={driverForm.licenseNo} onChange={e => setDriverForm({ ...driverForm, licenseNo: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="License Number" />
              <div>
                <label className="text-xs font-bold text-slate-400 ml-1">License Expiry</label>
                <input required value={driverForm.licenseExpiry} onChange={e => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} type="date" className="w-full p-3 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required value={driverForm.dailySalary} onChange={e => setDriverForm({ ...driverForm, dailySalary: e.target.value })} type="number" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Daily Salary" />
                <input required value={driverForm.commissionPct} onChange={e => setDriverForm({ ...driverForm, commissionPct: e.target.value })} type="number" className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Commission %" />
              </div>
              <button disabled={isSaving} type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 flex justify-center">
                {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : (editingItem ? 'Update Driver' : 'Complete Onboarding')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetDrivers;
