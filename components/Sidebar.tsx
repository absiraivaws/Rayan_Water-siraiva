import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  companyName: string;
  logoUrl?: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ companyName, logoUrl, isCollapsed, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'customers', label: 'Customers', icon: 'fa-users' },
    { id: 'fleet', label: 'Fleet & Drivers', icon: 'fa-truck' },
    { id: 'routes', label: 'Routes', icon: 'fa-map-location-dot' },
    { id: 'deliveries', label: 'Daily Delivery', icon: 'fa-clipboard-list' },
    { id: 'finance', label: 'Finance', icon: 'fa-file-invoice-dollar' },
  ];

  return (
    <div className={`bg-slate-900 text-white flex flex-col h-full border-r border-slate-700 transition-all duration-300 z-50 ${isCollapsed ? 'w-20 relative' : 'w-64 absolute md:relative'}`}>
      <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <h1 className="text-xl font-bold flex items-center gap-3 animate-fade-in">
            {logoUrl ? (
              <img src={logoUrl} alt="L" className="w-8 h-8 object-contain rounded" />
            ) : (
              <i className="fa-solid fa-droplet text-primary"></i>
            )}
            <span className="truncate">{companyName.split(' ')[0]}</span>
          </h1>
        )}
        <button
          onClick={onToggle}
          className={`text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all p-2 ${isCollapsed ? 'w-full flex justify-center' : ''}`}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <i className={`fa-solid ${item.icon} w-6 text-center text-lg`}></i>
            {!isCollapsed && <span className="font-medium truncate animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}

        <div className={`pt-4 mt-4 border-t border-slate-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/settings"
            title={isCollapsed ? "Settings" : ''}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full ${isActive
              ? 'bg-primary text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <i className="fa-solid fa-gear w-6 text-center text-lg"></i>
            {!isCollapsed && <span className="font-medium truncate animate-fade-in">Settings</span>}
          </NavLink>
        </div>
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-4">
        {!isCollapsed && (
          <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white shadow-inner">R</div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">Rayan</p>
              <p className="text-[10px] text-slate-400 truncate">Owner Access</p>
            </div>
          </div>
        )}
        {/* Removed footer button */}
      </div>
    </div>
  );
};

export default Sidebar;
