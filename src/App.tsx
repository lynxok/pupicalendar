import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Zap, 
  Calendar, 
  Settings,
  Bell,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  PenTool,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useNextGen } from '@/src/hooks/useNextGen';
import { TaskBoard } from '@/src/components/dashboard/TaskBoard';
import { HabitTracker } from '@/src/components/dashboard/HabitTracker';
import { NoteCanvas } from '@/src/components/dashboard/NoteCanvas';
import { CalendarView } from '@/src/components/dashboard/CalendarView';
import { NotebookCanvas } from '@/src/components/dashboard/NotebookCanvas';
import { PupiAssistant } from '@/src/components/ai/PiaAssistant';
import { FocusMode } from '@/src/components/dashboard/FocusMode';
import { UserSettings } from '@/src/components/dashboard/UserSettings';
import { UpcomingTasks } from '@/src/components/dashboard/UpcomingTasks';
import { NotificationCenter } from '@/src/components/dashboard/NotificationCenter';
import { AuthOverlay } from '@/src/components/auth/AuthOverlay';
import { GlobalSearch } from '@/src/components/dashboard/GlobalSearch';
import { auth } from '@/src/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Button, Card } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';
import { AppMode } from '@/src/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { 
    tasks, 
    habits, 
    notes, 
    sketches,
    mode, 
    setMode, 
    addTask, 
    updateTask, 
    deleteTask,
    addHabit,
    updateHabit,
    deleteHabit,
    addNote,
    updateNote,
    deleteNote,
    loading: dataLoading 
  } = useNextGen(currentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiEngine, setAiEngine] = useState<string>('gemini-2.0-flash');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FBFBFD]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 animate-pulse flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-slate-400 animate-pulse uppercase tracking-[0.2em]">PupiCalendar</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthOverlay />;
  }

  const modes: { id: AppMode; label: string; icon: any }[] = [
    { id: 'full', label: 'Panel', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'notebook', label: 'Bocetos', icon: PenTool },
    { id: 'external_brain', label: 'Notas IA', icon: BrainCircuit },
    { id: 'minimalist', label: 'Foco', icon: Zap },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-natural-bg overflow-hidden text-natural-text flex-col md:flex-row">
      {/* Sidebar - Strategic Architecture Style (Desktop Only) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="relative bg-white/40 backdrop-blur-xl border-r border-natural-border hidden md:flex flex-col z-40 transition-all duration-300 ease-in-out"
      >
        <div className="h-20 px-6 flex items-center gap-4 overflow-hidden border-b border-natural-border">
          <div className="w-10 h-10 min-w-[40px] bg-natural-accent rounded-full flex items-center justify-center text-white font-serif text-xl shadow-lg">PC</div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">PupiCalendar</h1>
                <p className="text-[8px] text-natural-accent uppercase tracking-widest mt-1.5 opacity-60">Ecosistema Estratégico</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-8">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all relative group",
                mode === m.id 
                  ? "bg-natural-accent text-white shadow-xl shadow-natural-accent/20" 
                  : "text-natural-text/40 hover:text-natural-text hover:bg-white/60"
              )}
            >
              <m.icon className="h-5 w-5 min-w-[20px]" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
                  >
                    {m.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
          
          <div className="pt-8 pb-4">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 text-[9px] font-black text-natural-accent uppercase tracking-[0.3em] opacity-40"
                >
                  Arquitectura
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-rose-500/60 hover:text-rose-500 hover:bg-rose-50 mt-2 transition-all"
          >
            <LogOut className="h-5 w-5 min-w-[20px]" />
            {sidebarOpen && <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Cerrar Sesión</span>}
          </button>
        </nav>

        <div className="p-6 border-t border-natural-border">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-10 flex items-center justify-center rounded-xl bg-natural-bg text-natural-accent hover:bg-natural-border/30 transition-colors border border-natural-border/50"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="h-16 md:h-20 bg-white/40 backdrop-blur-md border-b border-natural-border flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 md:gap-6">
            <h1 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-natural-accent truncate max-w-[150px] md:max-w-none">
              {mode === 'full' ? 'Panel Control' : 
               mode === 'calendar' ? 'Calendario' :
               mode === 'notebook' ? 'Boceto Visual' :
               mode === 'external_brain' ? 'Cerebro' : 'Acción'} <span className="opacity-30 mx-2 md:mx-3">//</span> 2026
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center bg-natural-bg/50 px-3 py-1.5 rounded-full border border-natural-border/30 gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-natural-accent/40">Motor IA:</span>
              <select 
                value={aiEngine}
                onChange={(e) => setAiEngine(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-tight text-natural-accent focus:outline-none cursor-pointer"
              >
                <optgroup label="Google Gemini" className="bg-white text-slate-900">
                  <option value="gemini-2.0-flash">2.0 Flash</option>
                  <option value="gemini-1.5-flash">1.5 Flash</option>
                  <option value="gemini-1.5-pro">1.5 Pro</option>
                </optgroup>
                <optgroup label="OpenAI" className="bg-white text-slate-900">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </optgroup>
              </select>
            </div>
            
            <div className="flex gap-2 md:gap-4">
              <NotificationCenter />
              <div 
                className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-natural-accent text-white flex items-center justify-center font-serif italic text-base md:text-lg shadow-inner cursor-pointer overflow-hidden"
                onClick={() => setMode('settings')}
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="P" className="h-full w-full object-cover" />
                ) : (
                  currentUser?.email?.[0].toUpperCase() || 'P'
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 stationery-bg pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto space-y-10 md:space-y-16">
            
            <div className="mb-12">
              <GlobalSearch 
                tasks={tasks}
                notes={notes}
                sketches={sketches}
                onSelectItem={(type) => {
                  if (type === 'task') setMode('calendar');
                  if (type === 'note') setMode('external_brain');
                  if (type === 'sketch') setMode('notebook');
                }}
              />
            </div>

            {mode === 'full' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
                <div className="lg:col-span-3">
                  <TaskBoard 
                    tasks={tasks} 
                    addTask={addTask} 
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                  />
                </div>
                <div className="space-y-8 md:space-y-10">
                  <HabitTracker 
                    habits={habits} 
                    addHabit={addHabit}
                    updateHabit={updateHabit}
                    deleteHabit={deleteHabit}
                  />
                  <div className="h-[400px]">
                    <UpcomingTasks 
                      tasks={tasks} 
                      onViewCalendar={() => setMode('calendar')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'calendar' && (
              <CalendarView tasks={tasks} addTask={addTask} />
            )}

            {mode === 'notebook' && (
              <NotebookCanvas setMode={setMode} />
            )}

            {mode === 'external_brain' && (
              <NoteCanvas 
                notes={notes} 
                addNote={addNote} 
                updateNote={updateNote} 
                deleteNote={deleteNote} 
                aiEngine={aiEngine} 
              />
            )}

            {mode === 'settings' && (
              <UserSettings 
                tasks={tasks} 
                onTasksImported={(newTasks) => {
                  newTasks.forEach(t => addTask(t as any));
                }} 
                aiEngine={aiEngine}
                onChangeAiEngine={setAiEngine}
              />
            )}

            {mode === 'minimalist' && (
              tasks.length > 0 ? (
                <FocusMode task={tasks[0]} />
              ) : (
                <div className="max-w-2xl mx-auto py-12 md:py-24 text-center space-y-8 md:space-y-12">
                  <div className="h-24 w-24 md:h-32 md:w-32 rounded-[40px] md:rounded-[50px] bg-natural-accent text-white flex items-center justify-center mx-auto shadow-2xl rotate-3 transform transition-transform hover:rotate-0">
                    <Zap className="h-10 w-10 md:h-14 md:w-14" />
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-6xl font-serif italic mb-4">La Única Cosa</h2>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-natural-accent opacity-60">Elimina el Ruido • Ejecuta la Intención</p>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-natural-accent/40 font-bold uppercase tracking-widest italic">Sin tareas sincronizadas. La mente está clara.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-natural-border flex items-center justify-around px-2 z-40">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                mode === m.id ? "text-natural-accent" : "text-natural-text/30"
              )}
            >
              <m.icon className={cn("h-5 w-5", mode === m.id && "scale-110")} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{m.label.split(' ')[0]}</span>
              {mode === m.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-natural-accent" 
                />
              )}
            </button>
          ))}
        </nav>
      </main>

      <PupiAssistant tasks={tasks} aiEngine={aiEngine} />
    </div>
  );
}
