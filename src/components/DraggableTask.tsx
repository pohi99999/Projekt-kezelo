import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Clock } from 'lucide-react';
import { Task, Project } from '../types';

interface DraggableTaskProps {
  task: Task;
  project?: Project;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function DraggableTask({ task, project, onToggle, onDelete }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-gray-950 border border-gray-850 rounded-xl p-4 flex items-center justify-between hover:border-gray-800 transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className="mt-1 flex-shrink-0 text-slate-600 hover:text-emerald-500 transition-all cursor-pointer z-10"
        >
          <div className="w-5.5 h-5.5 rounded-lg border border-slate-700 group-hover:border-emerald-600 flex items-center justify-center transition-colors">
            <div className={`w-2.5 h-2.5 rounded ${task.completed ? 'bg-emerald-600' : 'bg-transparent group-hover:bg-emerald-600/30'}`}></div>
          </div>
        </button>
        
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 tracking-tight leading-snug group-hover:text-white transition-colors">
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1.5">
            <span className={`flex items-center gap-1 font-semibold ${
              task.priority === 'magas' ? 'text-red-400' :
              task.priority === 'közepes' ? 'text-amber-400' :
              'text-blue-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                  task.priority === 'magas' ? 'bg-red-400' :
                  task.priority === 'közepes' ? 'bg-amber-400' :
                  'bg-blue-400'
              }`}></span>
              {task.priority === 'magas' ? 'Magas' : task.priority === 'közepes' ? 'Közepes' : 'Alacsony'}
            </span>
            {project && (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {project.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {task.dueDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer z-10"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
