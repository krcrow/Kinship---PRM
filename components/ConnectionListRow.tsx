
import React from 'react';
import { Connection } from '../types';
import { User, Calendar } from 'lucide-react';

interface ConnectionListRowProps {
  connection: Connection;
  onClick: () => void;
}

export const ConnectionListRow: React.FC<ConnectionListRowProps> = ({ connection, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white border-b border-stone-100 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200 shrink-0">
          {connection.avatarUrl ? (
            <img src={connection.avatarUrl} alt={connection.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-stone-400" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-stone-900 group-hover:text-amber-900 transition-colors">{connection.name}</h3>
          <p className="text-sm text-stone-500">{connection.role} at {connection.company}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 text-sm text-stone-600">
        <div className="hidden md:block w-32 truncate">
          {connection.emailWork || connection.emailPersonal || '-'}
        </div>
        <div className="w-32 text-right">
           <span className="block text-xs text-stone-400 uppercase tracking-wide">Last Contact</span>
           <span className="font-medium">
             {connection.lastContactDate 
               ? new Date(connection.lastContactDate).toLocaleDateString() 
               : 'Never'}
           </span>
        </div>
        <div className="w-32 text-right hidden sm:block">
           {connection.plannedContactDate ? (
             <span className="flex items-center justify-end gap-1.5 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 inline-flex">
                <Calendar className="w-3 h-3" />
                {new Date(connection.plannedContactDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
             </span>
           ) : (
             <span className="text-stone-400">-</span>
           )}
        </div>
      </div>
    </div>
  );
};
