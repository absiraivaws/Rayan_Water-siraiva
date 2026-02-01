
import React, { useState } from 'react';

interface SettingsProps {
  remarks: string[];
  onUpdateRemarks: (newRemarks: string[]) => void;
  companyName: string;
  onUpdateCompanyName: (name: string) => void;
  logoUrl: string;
  onUpdateLogoUrl: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  remarks, onUpdateRemarks,
  companyName, onUpdateCompanyName,
  logoUrl, onUpdateLogoUrl
}) => {
  const [newRemark, setNewRemark] = useState('');

  const addRemark = () => {
    if (newRemark.trim()) {
      onUpdateRemarks([...remarks, newRemark.trim()]);
      setNewRemark('');
    }
  };

  const removeRemark = (idx: number) => {
    onUpdateRemarks(remarks.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Branding Management */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <i className="fa-solid fa-palette"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Branding</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => onUpdateCompanyName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Logo Image URL</label>
              <input
                value={logoUrl}
                onChange={(e) => onUpdateLogoUrl(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/logo.png"
              />
            </div>
            {logoUrl && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <img src={logoUrl} alt="Preview" className="h-12 w-auto object-contain rounded" onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=Error")} />
                <span className="text-xs text-slate-400">Current Logo Preview</span>
              </div>
            )}
          </div>
        </div>

        {/* Remark Management */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <i className="fa-solid fa-comment-dots"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Driver Remarks</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">Configure standard options for drivers.</p>

          <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto pr-2">
            {remarks.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <span className="text-sm font-bold text-slate-600">{r}</span>
                <button onClick={() => removeRemark(i)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="e.g. Broken Pipe"
            />
            <button onClick={addRemark} className="bg-primary text-white p-3 rounded-xl font-bold hover:bg-secondary transition-all">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Global Controls */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">System Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Auto-GPS Capture</p>
                  <p className="text-[10px] text-slate-400">Capture location on new customer submit</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative">
                  <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
