
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useSupabaseMutations } from '../hooks/useSupabaseMutations';
import { DRIVER_REMARKS } from '../constants';
import { Transaction } from '../types';

interface DailyDeliveryProps {
  customRemarks?: string[];
}

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with webpack/vite
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when lat/lng changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const DailyDelivery: React.FC<DailyDeliveryProps> = ({ customRemarks }) => {
  const { routes, customers, vehicles, drivers, loading, error } = useSupabaseData();
  const { addTransaction } = useSupabaseMutations();

  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Transaction State
  const [bottles, setBottles] = useState(1);
  const [amount, setAmount] = useState(0);
  const [remark, setRemark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit' | 'QR'>('Cash');

  // Filter customers based on selected route
  // Note: customers have routeId, routes have customerIds. We can use customers.routeId
  const routeCustomers = customers.filter(c => c.routeId === selectedRouteId && c.status === 'Active');

  const currentCustomer = routeCustomers[activeStep];
  const activeRemarks = customRemarks || DRIVER_REMARKS;
  const currentRoute = routes.find(r => r.id === selectedRouteId);

  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes]);

  useEffect(() => {
    if (currentCustomer) {
      setAmount(currentCustomer.pricePerUnit * bottles);
    }
  }, [currentCustomer, bottles]);

  const handleDeliverySubmit = async () => {
    if (!currentRoute || !currentCustomer) return;

    setIsSaving(true);
    try {
      await addTransaction({
        customerId: currentCustomer.id,
        driverId: currentRoute.driverId, // Assuming route has driver assigned
        quantity: bottles,
        total: amount,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'Completed',
        gpsProof: `${currentCustomer.lat},${currentCustomer.lng}` // Mock GPS proof using customer location for now
      });

      // Move to next or finish
      setShowConfirm(false);
      setRemark('');
      if (activeStep < routeCustomers.length - 1) {
        setActiveStep(activeStep + 1);
        // Reset defauts for next
        setBottles(1);
      } else {
        alert("Route Completed!");
        setActiveStep(0); // Reset or handle completion state
      }
    } catch (err: any) {
      alert("Failed to log delivery: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading delivery data...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">

      {/* Route Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <i className="fa-solid fa-route"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Route</p>
            <select
              value={selectedRouteId}
              onChange={e => { setSelectedRouteId(e.target.value); setActiveStep(0); }}
              className="font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            >
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver</p>
          <p className="font-bold text-slate-800">{currentRoute ? drivers.find(d => d.id === currentRoute.driverId)?.name || 'Unassigned' : 'N/A'}</p>
        </div>
      </div>

      {routeCustomers.length > 0 && currentCustomer ? (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h2 className="text-xl font-black text-slate-800">ACTIVE TASK</h2>
            </div>
            <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg shadow-primary/20">
              {activeStep + 1} / {routeCustomers.length}
            </span>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-1 shadow-2xl shadow-slate-200 relative overflow-hidden mb-6">
            <div className="relative h-64 w-full rounded-[30px] overflow-hidden">
              {currentCustomer.lat && currentCustomer.lng ? (
                <MapContainer
                  center={[currentCustomer.lat, currentCustomer.lng]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  attributionControl={false}
                >
                  <ChangeView center={[currentCustomer.lat, currentCustomer.lng]} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[currentCustomer.lat, currentCustomer.lng]}>
                    <Popup>{currentCustomer.name}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-500 font-bold">
                  Map Unavailable
                </div>
              )}
              {/* Overlay Gradient */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>

              <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                <span className="bg-primary text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg">Delivery Stop</span>
                <h3 className="text-2xl font-black text-white mt-2 drop-shadow-md">{currentCustomer.name}</h3>
                <p className="text-slate-200 text-sm font-medium mt-1 drop-shadow-md flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-primary"></i> {currentCustomer.address}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentCustomer.lat},${currentCustomer.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-primary/10 text-primary py-4 rounded-2xl font-black text-center flex items-center justify-center gap-3 hover:bg-primary/20 transition-all"
            >
              <i className="fa-solid fa-location-arrow"></i> Navigate
            </a>
            <button className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-black text-center flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
              <i className="fa-solid fa-phone"></i> Call
            </button>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-5 bg-primary text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
            >
              I've Arrived at Site
            </button>
          ) : (
            <div className="space-y-6 animate-slide-in">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 border-2 border-slate-100 rounded-3xl bg-slate-50">
                  <label className="text-[10px] font-black text-slate-400 block mb-2 tracking-[2px]">BOTTLES</label>
                  <input
                    type="number"
                    className="w-full bg-transparent font-black text-3xl outline-none text-slate-800"
                    value={bottles}
                    onChange={(e) => setBottles(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="p-5 border-2 border-slate-100 rounded-3xl bg-slate-50">
                  <label className="text-[10px] font-black text-slate-400 block mb-2 tracking-[2px]">LKR AMOUNT</label>
                  <input
                    type="number"
                    className="w-full bg-transparent font-black text-3xl outline-none text-slate-800"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-3 block tracking-widest">Select Remark (Optional)</label>
                  <select
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none bg-slate-50 focus:border-primary transition-colors"
                  >
                    <option value="">Status: Delivered Successfully</option>
                    {activeRemarks.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-3 block tracking-widest">Payment Collection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Cash', 'Credit', 'QR'].map(m => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m as any)}
                        className={`py-3 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === m ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 hover:border-primary/50'
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeliverySubmit}
                disabled={isSaving}
                className="w-full py-5 bg-accent text-white rounded-3xl font-black text-lg shadow-2xl shadow-accent/20 mt-6 hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Verify & Log Delivery'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-[40px] border border-slate-200">
          <p className="text-slate-500 font-bold">No customers found for this route.</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-[40px] border border-slate-200">
        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-6 px-2 tracking-[4px]">Upcoming Stops</h4>
        <div className="space-y-3">
          {routeCustomers.map((c, idx) => (
            <div key={c.id} className={`flex items-center gap-5 p-4 rounded-3xl border transition-all ${idx < activeStep ? 'opacity-30 border-slate-50' : 'border-slate-50 hover:bg-slate-50'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${idx === activeStep ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">GPS: {c.lat.toFixed(4)}, {c.lng.toFixed(4)}</p>
              </div>
              {idx < activeStep && <i className="fa-solid fa-circle-check text-accent text-lg"></i>}
              {idx === activeStep && <i className="fa-solid fa-truck-fast text-primary animate-bounce"></i>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyDelivery;
