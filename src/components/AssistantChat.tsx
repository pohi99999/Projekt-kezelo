import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles, Check, Plus, AlertCircle, MessageSquare } from 'lucide-react';
import { ChatMessage, Project, Task, SuggestedTask } from '../types';

interface AssistantChatProps {
  projects: Project[];
  tasks: Task[];
  onAddTask: (task: { projectId: string; title: string; dueDate: Date }) => Promise<void>;
}

export default function AssistantChat({ projects, tasks, onAddTask }: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Szia! Én vagyok a te személyes Projekt Tervező Asszisztensed. Segíthetek a feladataid rendszerezésében, új mérföldkövek kitalálásában és napi-heti teendők kigyűjtésében. Kérdezz bátran, vagy kérj tőlem egyedi és azonnal menthető feladatterveket!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Quick suggestion prompts
  const suggestions = [
    "Javasolj heti feladatokat a tanuláshoz",
    "Segíts beosztani a másnapi teendőmet",
    "Írj feladattervet új alkalmazás építéséhez",
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          projects,
          tasks: tasks.filter(t => !t.completed)
        })
      });

      if (!response.ok) {
        throw new Error('Szerver hiba történt a kommunikáció során.');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sajnálom, hiba történt a válaszadás során: ${err.message || 'Ismeretlen hiba'}. Ellenőrizd a beállításokat.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Parse suggested tasks from assistant response
  const parseResponseSuggestedTasks = (content: string): { cleanText: string, suggestedTasks: SuggestedTask[] } => {
    const regex = /```suggested_tasks\s*([\s\S]*?)\s*```/;
    const match = content.match(regex);
    
    if (match) {
      try {
        const jsonStr = match[1].trim();
        const suggestedTasks = JSON.parse(jsonStr) as SuggestedTask[];
        // Remove the json block from the main displayed text
        const cleanText = content.replace(regex, '').trim();
        return { cleanText, suggestedTasks };
      } catch (e) {
        console.error("Failed to parse suggested tasks JSON:", e);
      }
    }
    return { cleanText: content, suggestedTasks: [] };
  };

  // Helper to handle instant single-click added task
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [addedTaskKeys, setAddedTaskKeys] = useState<Record<string, boolean>>({});

  const handleSaveSuggestedTask = async (task: SuggestedTask, index: number, originalMsgId: string) => {
    const key = `${originalMsgId}-${index}`;
    if (addedTaskKeys[key]) return;

    setAddingTaskId(key);
    try {
      // Calculate due date based on offset
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (task.dueDateDaysOffset || 0));
      
      await onAddTask({
        projectId: task.projectId,
        title: task.title,
        dueDate
      });

      setAddedTaskKeys(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error("Feladat mentése sikertelen:", err);
    } finally {
      setAddingTaskId(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col h-[650px] shadow-2xl relative overflow-hidden">
      {/* Target header */}
      <div className="bg-gray-950 p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={22} className="text-emerald-400 animate-pulse" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-950"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-100">AI Projekt Asszisztens</h3>
            <p className="text-[10px] text-slate-400">Gemini 3.5 Flash • Folyamatos támogatás</p>
          </div>
        </div>
        <Sparkles size={16} className="text-emerald-500" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {messages.map((msg) => {
          const { cleanText, suggestedTasks } = parseResponseSuggestedTasks(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-2 rounded-xl border ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600/10 border-emerald-500/20 text-slate-100' 
                    : 'bg-gray-950 border-gray-800 text-slate-300'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-emerald-400" /> : <Bot size={14} className="text-slate-400" />}
                </div>

                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-955/30'
                    : 'bg-gray-950 text-slate-200 border border-gray-850 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{cleanText}</p>

                  {/* Render Suggested Tasks block inside the message container if any */}
                  {suggestedTasks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                        <Sparkles size={12} />
                        Azonnal Menthető Feladatok ({suggestedTasks.length})
                      </div>
                      
                      <div className="space-y-1.5">
                        {suggestedTasks.map((t, index) => {
                          const taskKey = `${msg.id}-${index}`;
                          const isAdded = addedTaskKeys[taskKey];
                          const assocProject = projects.find(p => p.id === t.projectId)?.name || 'Egyéb';
                          const offsetDayLabel = t.dueDateDaysOffset === 0 ? 'Ma' : t.dueDateDaysOffset === 1 ? 'Holnap' : `${t.dueDateDaysOffset} nap múlva`;

                          return (
                            <div key={index} className="bg-gray-900 border border-gray-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors hover:bg-gray-850">
                              <div className="flex-1 mr-2 pr-1">
                                <p className="font-semibold text-slate-200">{t.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Projekt: <span className="text-emerald-500">{assocProject}</span> • {offsetDayLabel}
                                </p>
                              </div>
                              <button
                                disabled={isAdded || addingTaskId === taskKey}
                                onClick={() => handleSaveSuggestedTask(t, index, msg.id)}
                                className={`px-2.5 py-1.5 rounded-lg flex items-center justify-center font-bold gap-1 cursor-pointer transition-colors ${
                                  isAdded
                                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check size={12} />
                                    Hozzáadva
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    Mentés
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-10">
                {msg.timestamp.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-slate-400">
              <Bot size={14} className="text-slate-400" />
            </div>
            <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset helpers */}
      {messages.length === 1 && !loading && (
        <div className="p-3 bg-gray-950/80 border-t border-gray-800/80">
          <p className="text-[10px] text-slate-500 font-semibold mb-2 flex items-center gap-1">
            <MessageSquare size={10} /> Választható kérdések:
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-left text-xs bg-gray-900 border border-gray-800 text-slate-300 hover:border-emerald-600/40 hover:text-emerald-400 p-2 rounded-xl transition-all font-medium cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-3 bg-gray-950 border-t border-gray-800 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kérdezz, vagy tervezz velem..."
            className="flex-1 bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
