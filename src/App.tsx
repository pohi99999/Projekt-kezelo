import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FolderPlus, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Filter, 
  Trash2, 
  Clock, 
  Sparkles, 
  ListTodo,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Project, Task } from './types';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import CalendarView from './components/CalendarView';
import AssistantChat from './components/AssistantChat';
import ProjectFormModal from './components/ProjectFormModal';
import TaskFormModal from './components/TaskFormModal';

export default function App() {
  const [view, setView] = useState<'daily' | 'weekly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Modal Toggles
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Fetch & Seed Fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Projects
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        let projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        // If no projects in DB, seed with initial ones
        if (projectsData.length === 0) {
          const defaultProjects = [
            { name: 'Alkalmazásfejlesztés', description: 'Az új applikáció sötét módú és naptár alapú felületének építése.' },
            { name: 'Magánélet & Tanulás', description: 'Napi rutinok, önfejlesztés és új készségek.' }
          ];

          const seededProjects: Project[] = [];
          for (const p of defaultProjects) {
            const docRef = await addDoc(collection(db, 'projects'), {
              ...p,
              createdAt: new Date()
            });
            seededProjects.push({ id: docRef.id, ...p });
          }
          projectsData = seededProjects;
        }
        setProjects(projectsData);

        // Fetch Tasks
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const tasksData = tasksSnapshot.docs.map(doc => {
          const data = doc.data();
          let parsedDate = new Date();
          if (data.dueDate) {
            // Check if Firestore Timestamp
            if (typeof data.dueDate.toDate === 'function') {
              parsedDate = data.dueDate.toDate();
            } else {
              parsedDate = new Date(data.dueDate);
            }
          }
          return {
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            completed: !!data.completed,
            dueDate: parsedDate,
            createdAt: data.createdAt
          };
        }) as Task[];
        
        setTasks(tasksData);
      } catch (err) {
        console.error("Hiba az adatok letöltésekor:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handlers
  const handleAddProject = async (projectInput: { name: string; description: string }) => {
    const newProj = {
      name: projectInput.name,
      description: projectInput.description,
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'projects'), newProj);
    setProjects(prev => [...prev, { id: docRef.id, ...newProj }]);
  };

  const handleAddTask = async (taskInput: { projectId: string; title: string; dueDate: Date }) => {
    const newTask = {
      projectId: taskInput.projectId,
      title: taskInput.title,
      dueDate: taskInput.dueDate,
      completed: false,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    setTasks(prev => [...prev, { id: docRef.id, ...newTask }]);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await updateDoc(doc(db, 'tasks', taskId), {
      completed: !task.completed
    });

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter logic for selected date range
  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return tasks.filter(task => {
      // Exclude completed tasks (user requested that checked off tasks "disappear")
      if (task.completed) return false;

      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0,0,0,0);

      if (view === 'daily') {
        // Daily view matching the selected calendar date
        return taskDate.toDateString() === selectedDate.toDateString();
      } else {
        // Weekly view matching upcoming 7 days starting today
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        endOfWeek.setHours(23,59,59,999);
        return taskDate >= today && taskDate <= endOfWeek;
      }
    }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top ambient blurred decorations - strictly visual design elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main container wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 z-10 flex flex-col">
        {/* Elegant top navigation / actions bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500 font-mono">
                Project &amp; Planner
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Projekt Követő
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View togglers */}
            <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl">
              <button 
                onClick={() => setView('daily')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  view === 'daily' 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-950/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} />
                Napi bontás
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  view === 'weekly' 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon size={13} />
                Heti bontás
              </button>
            </div>

            {/* Quick add triggers */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <FolderPlus size={14} className="text-emerald-500" />
                + Új Projekt
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
              >
                <Plus size={14} />
                + Új Feladat
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-slate-400 font-medium">Betöltés...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-1">
            {/* LEFT / CENTER COLUMN: Calendar & Task Lists */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Calendar list row */}
              <CalendarView
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setView('daily'); // Autofocus to daily view when clicking an individual day
                }}
                view={view}
              />

              {/* Tasks display card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ListTodo size={20} className="text-emerald-500" />
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {view === 'daily' ? 'Mai Tervezett Feladatok' : 'Heti Feladatok'}
                    </h2>
                  </div>
                  <span className="text-xs bg-gray-950 text-slate-400 border border-gray-850 px-3 py-1 rounded-full font-medium">
                    Aktív teendők: {filteredTasks.length} db
                  </span>
                </div>

                {/* Animated Tasks flow */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-950/40"
                      >
                        <CheckCircle2 size={36} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-sm text-slate-400 font-medium">Nincsenek tervezett feladatok erre a nézetre!</p>
                        <p className="text-xs text-slate-600 mt-1">Kattints a fenti gombra az új feladatok manuális felvételéhez.</p>
                      </motion.div>
                    ) : (
                      filteredTasks.map((task) => {
                        const project = projects.find(p => p.id === task.projectId);
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-950 border border-gray-850 rounded-xl p-4 flex items-center justify-between hover:border-gray-800 transition-all group"
                          >
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-1 flex-shrink-0 text-slate-600 hover:text-emerald-500 transition-all cursor-pointer"
                              >
                                <div className="w-5.5 h-5.5 rounded-lg border border-slate-700 group-hover:border-emerald-600 flex items-center justify-center transition-colors">
                                  <div className="w-2.5 h-2.5 rounded bg-transparent group-hover:bg-emerald-600/30"></div>
                                </div>
                              </button>
                              
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-200 tracking-tight leading-snug group-hover:text-white transition-colors">
                                  {task.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1.5">
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
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Projects overview gallery */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={20} className="text-emerald-500" />
                    <h2 className="text-lg font-bold tracking-tight text-white">Projektjeim listája</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj) => {
                    const projectActiveTasks = tasks.filter(t => !t.completed && t.projectId === proj.id).length;
                    return (
                      <div key={proj.id} className="bg-gray-950 border border-gray-850 hover:border-gray-800 p-4 rounded-xl transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-200">{proj.name}</h3>
                            <span className="text-[10px] bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                              {projectActiveTasks} feladat
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {proj.description || 'Nincs kitűzve leírás ehhez a projekthez.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Companion widget */}
            <div className="lg:col-span-1 h-full lg:sticky lg:top-8 gap-6 flex flex-col">
              <AssistantChat
                projects={projects}
                tasks={tasks}
                onAddTask={handleAddTask}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals Container */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <ProjectFormModal
            onAddProject={handleAddProject}
            onClose={() => setIsProjectModalOpen(false)}
          />
        )}

        {isTaskModalOpen && (
          <TaskFormModal
            projects={projects}
            onAddTask={handleAddTask}
            onClose={() => setIsTaskModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
