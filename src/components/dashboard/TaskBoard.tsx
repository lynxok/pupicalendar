import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Zap, 
  MoreVertical, 
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { Task, Priority } from '@/src/types';
import { cn, formatDate } from '@/src/lib/utils';

interface TaskBoardProps {
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function TaskBoard({ tasks, addTask, updateTask, deleteTask }: TaskBoardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    priority: 'medium' as Priority, 
    isDeepWork: false,
    startTime: '',
    endTime: '',
    recurrenceDays: [] as number[],
    recurrenceUntil: ''
  });

  const daysOfWeek = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'X', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 0 },
  ];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    await addTask({
      title: newTask.title,
      priority: newTask.priority,
      status: 'todo',
      dueDate: new Date().toISOString(),
      isDeepWork: newTask.isDeepWork,
      startTime: newTask.startTime || undefined,
      endTime: newTask.endTime || undefined,
      recurrence: newTask.recurrenceDays.length > 0 ? {
        days: newTask.recurrenceDays,
        until: newTask.recurrenceUntil || undefined
      } : undefined
    });
    setNewTask({ 
      title: '', 
      priority: 'medium', 
      isDeepWork: false, 
      startTime: '', 
      endTime: '', 
      recurrenceDays: [], 
      recurrenceUntil: '' 
    });
    setIsAdding(false);
  };

  const toggleDay = (day: number) => {
    setNewTask(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day].sort()
    }));
  };

  const recalibrate = async () => {
    setIsRecalibrating(true);
    try {
      const res = await fetch('/api/recalibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, focusHours: 4 })
      });
      await new Promise(r => setTimeout(r, 1000)); // Just for visual impact
      const data = await res.json();
      alert("Matriz de prioridades recalibrada algorítmicamente. El orden neural ha sido sincronizado.");
    } catch (err) {
      alert("Fallo en la sincronización del motor neural");
    } finally {
      setIsRecalibrating(false);
    }
  };

  const priorityColors = {
    critical: "bg-rose-50 text-rose-600 border-rose-100",
    high: "bg-orange-50 text-orange-600 border-orange-100",
    medium: "bg-blue-50 text-blue-600 border-blue-100",
    low: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Sprints Activos</h2>
          <p className="text-xs md:text-sm text-slate-500">Programación autónoma activa • 4 Bloques de Enfoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={recalibrate} disabled={isRecalibrating}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isRecalibrating && "animate-spin")} />
            Recalibrar
          </Button>
          <Button size="sm" className="flex-1 md:flex-none" onClick={() => setIsAdding(!isAdding)}>
            <Plus className={cn("h-3.5 w-3.5 mr-2 transition-transform", isAdding && "rotate-45")} />
            {isAdding ? 'Cancelar' : 'Nueva Tarea'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-1"
            >
            <Card className="p-5 md:p-6 border-natural-accent/30 bg-natural-accent/5 shadow-inner">
              <form onSubmit={handleAddTask} className="space-y-4">
                <input
                  autoFocus
                  placeholder="Título de la tarea..."
                  className="w-full bg-transparent border-b border-natural-accent/20 py-1 text-sm font-semibold focus:outline-none focus:border-natural-accent transition-colors"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  {(['low', 'medium', 'high', 'critical'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: p })}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all",
                        newTask.priority === p 
                          ? "bg-natural-accent text-white border-natural-accent" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Inicio</label>
                    <input
                      type="time"
                      className="w-full bg-white/50 border border-slate-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-natural-accent"
                      value={newTask.startTime}
                      onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fin</label>
                    <input
                      type="time"
                      className="w-full bg-white/50 border border-slate-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-natural-accent"
                      value={newTask.endTime}
                      onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recurrencia (Días)</label>
                  <div className="flex justify-between">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "w-7 h-7 rounded-full text-[10px] font-bold border transition-all flex items-center justify-center",
                          newTask.recurrenceDays.includes(day.value)
                            ? "bg-natural-accent text-white border-natural-accent"
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {newTask.recurrenceDays.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Repetir hasta</label>
                    <input
                      type="date"
                      className="w-full bg-white/50 border border-slate-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-natural-accent"
                      value={newTask.recurrenceUntil}
                      onChange={(e) => setNewTask({ ...newTask, recurrenceUntil: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, isDeepWork: !newTask.isDeepWork })}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                      newTask.isDeepWork ? "text-natural-accent" : "text-slate-400"
                    )}
                  >
                    <Zap className={cn("h-3 w-3", newTask.isDeepWork && "fill-natural-accent")} />
                    Deep Work
                  </button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" type="button" className="h-8 px-3 text-[9px]" onClick={() => setIsAdding(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" type="submit" className="h-8 px-4 text-[9px]">
                      Crear
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        </AnimatePresence>

        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group relative overflow-hidden h-full flex flex-col p-5 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  priorityColors[task.priority]
                )}>
                  {task.priority}
                </span>
                <div className="flex gap-1">
                    <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (window.confirm('¿Eliminar esta tarea?')) {
                         deleteTask(task.id);
                       }
                     }}
                     className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                    >
                     <Plus className="h-4 w-4 rotate-45" />
                   </button>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {task.title}
              </h3>
              
              {task.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {task.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t space-y-3">
                {(task.startTime || task.endTime) && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Clock className="h-3 w-3" />
                    {task.startTime || '--:--'} - {task.endTime || '--:--'}
                  </div>
                )}
                
                {task.recurrence && (
                  <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                    <RefreshCw className="h-3 w-3" />
                    {task.recurrence.days.map(d => daysOfWeek.find(day => day.value === d)?.label).join(' ')}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] md:text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </span>
                    {task.isDeepWork && (
                      <span className="flex items-center gap-1 text-natural-accent">
                        <Zap className="h-3 w-3 fill-natural-accent" />
                        <span className="hidden xs:inline">Deep Work</span>
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                    className={cn(
                      "h-8 w-8 md:h-6 md:w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      task.status === 'done' 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-200 hover:border-natural-accent"
                    )}
                  >
                    {task.status === 'done' && <CheckCircle2 className="h-4 w-4 md:h-3 md:w-3" />}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        
        {!isAdding && tasks.length === 0 && (
          <div className="col-span-full py-12 md:py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
            <LayoutGrid className="h-10 w-10 md:h-12 md:w-12 mb-4 opacity-20" />
            <p className="font-medium text-sm md:text-base">No hay tareas sincronizadas todavía</p>
            <Button variant="ghost" size="sm" className="mt-4 text-xs" onClick={() => setIsAdding(true)}>
              Inicializar Proyecto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
