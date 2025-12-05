
import React from 'react';
import { Connection, ContactType } from '../types';
import { Calendar, Building2, User } from 'lucide-react';

interface ConnectionCardProps {
  connection: Connection;
  onClick: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onClick }) => {
  const getLastContactColor = (dateString: string | null) => {
    if (!dateString) return 'bg-stone-100 text-stone-500';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) return 'bg-green-100 text-green-700 border-green-200';
    if (diffDays <= 30) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-lg hover:border-stone-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                {connection.avatarUrl ? (
                  <img src={connection.avatarUrl} alt={connection.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-stone-400" />
                )}
             </div>
             <div>
               <h3 className="font-semibold text-stone-900 text-lg leading-tight group-hover:text-amber-900 transition-colors">{connection.name}</h3>
               <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                 <Building2 className="w-3 h-3" />
                 {connection.company}
               </p>
             </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-stone-600 bg-stone-50 px-2 py-1 rounded-md inline-block border border-stone-100">
            {connection.role}
          </p>
          {connection.overviewSummary ? (
            <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
              {connection.overviewSummary.split('•').slice(1,2).join('').trim()}
            </p>
          ) : connection.contextSummary ? (
             <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
               {connection.contextSummary.split('•').slice(1,2).join('').trim()}
             </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-50 mt-auto">
        <div className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${getLastContactColor(connection.lastContactDate)}`}>
           <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
           {connection.lastContactDate 
             ? `Last: ${new Date(connection.lastContactDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}` 
             : 'No contact yet'}
        </div>
        
        {connection.plannedContactDate && (
          <div className="text-xs text-amber-700 flex items-center gap-1 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
            <Calendar className="w-3 h-3" />
            {new Date(connection.plannedContactDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
          </div>
        )}
      </div>
    </div>
  );
};
