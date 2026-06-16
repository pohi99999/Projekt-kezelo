import { useState } from 'react';
import { X, CalendarPlus, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../types';

interface TaskFormModalProps {
  projects: Project[];
  onAddTask: (task: { projectId: string; title: string; dueDate: Date }) => Promise<void>;
  onClose: () => void;
  defaultDate?: Date;
}

export default function TaskFormModal({
  projects,
  onAddTask,
  onClose,
  defaultDate,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  
  // Date configuration
  const [dateType, setDateType] = useState<'today' | 'tomorrow' | 'nextWeek' | 'custom'>('tomorrow');
  
  // Custom date state (for picking arbitrary dates, default to tomorrow)
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [customDateValue, setCustomDateValue] = useState(getTomorrowString());
  const [loading, setLoading] = useState(false);

  const calculateFinalDate = (): Date => {
    const base = new Date();
    if (dateType === 'today') {
      return base;
    } else if (dateType === 'tomorrow') {
      base.setDate(base.getDate() + 1);
      return base;
    } else if (dateType === 'nextWeek') {
      base.setDate(base.getDate() + 7);
      return base;
    } else {
      // custom date
      const parts = customDateValue.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return base;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || loading) return;

    setLoading(true);
    try {
      const finalDate = calculateFinalDate();
      await onAddTask({
        projectId,
        title,
        dueDate: finalDate,
      });
      onClose();
    } catch (err) {
      console.error("Feladat mentése sikertelen:", err);
    } finally {
      setLoading(false);
    }
  };

  const dateShortcuts = [
    { type: 'today', label: 'Ma (Ma)' },
    { type: 'tomorrow', label: 'Holnap (Másnap)' },
    { type: 'nextWeek', label: '1 hét múlva' },
    { type: 'custom', label: 'Egyéni dátum' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <CalendarPlus size={22} className="text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight text-white">Új Feladat Tervezése</h2>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400 mb-4">Kérjük, először hozz létre legalább egy projektet a feladatok rögzítéséhez!</p>
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-750 text-slate-300 py-2.5 px-6 rounded-xl font-bold cursor-pointer"
            >
              Rendben
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Feladat Megnevezése *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pl.: Megírni a projekt vázlatát..."
                className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none placeholder-slate-600 transition-colors"
              />
            </div>

            {/* Project Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Kapcsolódó Projekt
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Presets & Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                Határidő / Esedékesség
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {dateShortcuts.map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => setDateType(s.type)}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                      dateType === s.type
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/20'
                        : 'bg-gray-950 text-slate-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {dateType === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <input
                    type="date"
                    required
                    value={customDateValue}
                    onChange={(e) => setCustomDateValue(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                  />
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-750 text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !projectId || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                {loading ? 'Mentés...' : 'Teendő Rögzítése'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
