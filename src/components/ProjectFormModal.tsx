import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectFormModalProps {
  onAddProject: (project: { name: string; description: string }) => Promise<void>;
  onClose: () => void;
}

export default function ProjectFormModal({ onAddProject, onClose }: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      await onAddProject({ name, description });
      onClose();
    } catch (err) {
      console.error("Projekt hozzáadása sikertelen:", err);
    } finally {
      setLoading(false);
    }
  };

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
          <FolderPlus size={22} className="text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight text-white">Új Projekt Létrehozása</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Projekt Megnevezése *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pl.: Alkalmazásfejlesztés, Lakásfelújítás..."
              className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none placeholder-slate-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Leírás / Célkitűzés
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rövid összefoglaló a projekt fókuszáról..."
              rows={3}
              className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none placeholder-slate-600 resize-none transition-colors"
            />
          </div>

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
              disabled={!name.trim() || loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
            >
              {loading ? 'Mentés...' : 'Projekt Mentése'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
