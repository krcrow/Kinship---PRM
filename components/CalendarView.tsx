import React from 'react';
import { Connection } from '../types';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

interface CalendarViewProps {
  connections: Connection[];
  onSelectConnection: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ connections, onSelectConnection }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Helper to find events for a specific day
  const getEventsForDay = (day: number) => {
    return connections.filter(c => {
      if (!c.plannedContactDate) return false;
      const d = new Date(c.plannedContactDate);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
        <h2 className="text-lg font-bold text-stone-800">{monthName} {year}</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider text-center py-3">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] bg-stone-100 gap-px border-b border-stone-100">
        {/* Empty cells for prev month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-stone-50/30"></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = getEventsForDay(day);
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div key={day} className={`bg-white p-2 min-h-[120px] hover:bg-stone-50 transition-colors relative group`}>
              <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'}`}>
                {day}
              </div>
              <div className="space-y-1.5">
                {events.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => onSelectConnection(c.id)}
                    className="w-full text-left bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-md px-2 py-1.5 transition-all shadow-sm group-hover:shadow hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></div>
                       <p className="text-xs font-semibold text-stone-800 truncate">{c.name}</p>
                    </div>
                    {c.plannedContactDate && (
                      <p className="text-[10px] text-stone-500 pl-3">
                         {new Date(c.plannedContactDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
