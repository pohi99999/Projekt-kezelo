import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  view: 'daily' | 'weekly';
}

export default function CalendarView({
  tasks,
  selectedDate,
  onSelectDate,
  view,
}: CalendarViewProps) {
  // Generate next 7 days
  const today = new Date();
  
  const getDayName = (date: Date) => {
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    return days[date.getDay()];
  };

  const getShortDayName = (date: Date) => {
    const days = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
    return days[date.getDay()];
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Count active tasks for a specific date
  const getTaskCountForDate = (date: Date) => {
    return tasks.filter(t => !t.completed && t.dueDate.toDateString() === date.toDateString()).length;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-200">
          <CalendarIcon size={20} className="text-emerald-500" />
          <h2 className="text-lg font-semibold tracking-tight">Naptár &amp; Időzítés</h2>
        </div>
        <span className="text-xs bg-gray-800 text-slate-400 px-3 py-1 rounded-full border border-gray-700">
          {view === 'daily' ? 'Kijelölt Nap Nézet' : 'Következő 7 Nap Összesítve'}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const isSelected = selectedDate.toDateString() === date.toDateString() && view === 'daily';
          const isTodayDate = date.toDateString() === today.toDateString();
          const taskCount = getTaskCountForDate(date);

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border outline-none cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                  : 'bg-gray-950 text-slate-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <span className={`text-[10px] font-medium tracking-wider uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                {getShortDayName(date)}
              </span>
              <span className="text-lg font-bold my-1 tracking-tight">
                {date.getDate()}
              </span>
              
              {/* Task Count Badge */}
              <div className="h-5 flex items-center justify-center">
                {taskCount > 0 ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white text-emerald-700' : 'bg-gray-800 text-slate-300 border border-gray-700'
                  }`}>
                    {taskCount}
                  </span>
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${isTodayDate ? (isSelected ? 'bg-white' : 'bg-emerald-500') : 'bg-transparent'}`} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {view === 'daily' && (
        <div className="text-center text-xs text-slate-400 mt-4 border-t border-gray-800/60 pt-3">
          Kiválasztott nap: <span className="text-emerald-400 font-medium">{getDayName(selectedDate)}</span>, {selectedDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}
    </div>
  );
}
