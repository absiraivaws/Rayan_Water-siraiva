import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

import CustomerMaster from './components/CustomerMaster';
import FleetDrivers from './components/FleetDrivers';
import RouteMaster from './components/RouteMaster';
import DailyDelivery from './components/DailyDelivery';
import FinanceModule from './components/FinanceModule';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { DRIVER_REMARKS } from './constants';

interface MainLayoutProps {
  session: Session | null;
  companyName: string;
  logoUrl: string;
  handleLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ session, companyName, logoUrl, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If session is null, redirect to login. This acts as a protected route.
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Determine the active module from the URL path
  // Example: /dashboard -> dashboard, /customers -> customers
  // If path is just '/', it defaults to 'dashboard' for display purposes
  const activeModule = location.pathname.substring(1) || 'dashboard';

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
      <Sidebar
        companyName={companyName}
        logoUrl={logoUrl}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain mr-2" />}
            <span className="text-slate-400 text-sm capitalize">{companyName}</span>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 mx-2"></i>
            <span className="font-bold text-slate-700 capitalize">{activeModule.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer p-2 hover:bg-slate-50 rounded-full transition-all">
              <i className="fa-solid fa-bell text-slate-400 group-hover:text-primary transition-colors"></i>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>

            <div className="flex items-center gap-4">
              <div
                onClick={() => navigate('/settings')} // Navigate to settings page
                className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-2xl transition-all"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                    {session.user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400">Administrator</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-primary overflow-hidden shadow-sm group-hover:border-primary/50 transition-all">
                  <i className="fa-solid fa-user-tie text-xl"></i>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                title="Sign Out"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scroll-smooth bg-slate-50/50">
          <Outlet /> {/* This is where the routed components will be rendered */}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [remarks, setRemarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('app_remarks');
    return saved ? JSON.parse(saved) : DRIVER_REMARKS;
  });
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('app_companyName') || 'HydroFlow ERP');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('app_logoUrl') || '');

  // Persist settings
  useEffect(() => {
    localStorage.setItem('app_remarks', JSON.stringify(remarks));
  }, [remarks]);

  useEffect(() => {
    localStorage.setItem('app_companyName', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('app_logoUrl', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-primary">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login route: If session exists, redirect to home/dashboard */}
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />

        {/* Protected routes wrapped by MainLayout */}
        <Route element={<MainLayout session={session} companyName={companyName} logoUrl={logoUrl} handleLogout={handleLogout} />}>
          {/* Default redirect from root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerMaster />} />
          <Route path="/fleet" element={<FleetDrivers />} />
          <Route path="/routes" element={<RouteMaster />} />
          <Route path="/deliveries" element={<DailyDelivery customRemarks={remarks} />} />
          <Route path="/finance" element={<FinanceModule />} />

          <Route path="/settings" element={
            <Settings
              remarks={remarks}
              onUpdateRemarks={setRemarks}
              companyName={companyName}
              onUpdateCompanyName={setCompanyName}
              logoUrl={logoUrl}
              onUpdateLogoUrl={setLogoUrl}
            />
          } />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                <i className="fa-solid fa-hammer text-4xl"></i>
              </div>
              <h2 className="text-xl font-bold">Page Not Found</h2>
              <p className="text-center max-w-sm">The requested URL was not found on this server.</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
