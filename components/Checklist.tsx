
import React from 'react';
import { MODULE_CHECKLIST } from '../constants';

const Checklist: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Development Roadmap Checklist</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {MODULE_CHECKLIST.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${item.status === 'Done' ? 'bg-accent/10 text-accent' :
                  item.status === 'Doing' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                }`}>
                {item.id}
              </span>
              <p className={`font-medium ${item.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {item.task}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'Done' ? 'bg-accent/10 text-accent border border-accent/20' :
                item.status === 'Doing' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <p className="text-sm text-secondary">
          <i className="fa-solid fa-info-circle mr-2"></i>
          Rayan, we are currently focused on completing the <strong>Delivery & Collection</strong> logic to enable the mobile driver module.
        </p>
      </div>
    </div>
  );
};

export default Checklist;
