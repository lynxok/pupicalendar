import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { Task } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface CalendarViewProps {
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<void>;
}

export function CalendarView({ tasks, addTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth(year, month) }, (_, i) => i);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
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

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDay || !newTask.title.trim()) return;
    
    const dueDate = new Date(year, month, selectedDay).toISOString();
    
    await addTask({
      title: newTask.title,
      status: 'todo',
      priority: 'medium',
      dueDate,
      isDeepWork: false,
      startTime: newTask.startTime || undefined,
      endTime: newTask.endTime || undefined,
      recurrence: newTask.recurrenceDays.length > 0 ? {
        days: newTask.recurrenceDays,
        until: newTask.recurrenceUntil || undefined
      } : undefined
    });
    setNewTask({ title: '', startTime: '', endTime: '', recurrenceDays: [], recurrenceUntil: '' });
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

  const getTasksForDay = (day: number) => {
    return tasks.filter(t => {
      const d = new Date(t.dueDate);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif italic">{monthNames[month]} {year}</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-natural-accent mt-1">Cronograma de Ejecución Estratégica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-natural-border shadow-2xl">
        <div className="grid grid-cols-7 bg-natural-bg/50 border-b border-natural-border">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-natural-accent opacity-60">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[300px] md:min-h-[600px]">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="border-r border-b border-natural-bg/10 bg-natural-bg/5" />
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = selectedDay === day;
            
            return (
              <div 
                key={day} 
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "border-r border-b border-natural-bg/30 p-1 md:p-2 hover:bg-natural-bg/20 transition-colors relative min-h-[60px] md:min-h-[120px] cursor-pointer",
                  isToday && "bg-white",
                  isSelected && "ring-2 ring-inset ring-natural-accent/20 bg-natural-bg/10"
                )}
              >
                <span className={cn(
                  "text-[9px] md:text-[10px] font-bold font-mono transition-all",
                  isToday ? "bg-natural-accent text-white h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center" : 
                  isSelected ? "text-natural-accent font-black" : "text-natural-text/30"
                )}>
                  {day < 10 ? `0${day}` : day}
                </span>
                
                <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "text-[6px] md:text-[9px] p-0.5 md:p-1.5 rounded-sm md:rounded-lg border leading-tight truncate font-bold uppercase tracking-tighter",
                        task.priority === 'critical' ? "bg-rose-50 border-rose-100 text-rose-700" :
                        task.priority === 'high' ? "bg-orange-50 border-orange-100 text-orange-700" :
                        "bg-indigo-50 border-indigo-100 text-indigo-700"
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[6px] md:text-[8px] text-natural-accent/40 font-bold px-1">
                      + {dayTasks.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task Details for Mobile/Selected Day */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-natural-accent" />
                <h3 className="font-serif italic text-2xl">Agenda: {selectedDay} de {monthNames[month]}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("text-[10px] uppercase font-bold tracking-widest transition-all", isAdding && "text-rose-500")}
                onClick={() => setIsAdding(!isAdding)}
              >
                {isAdding ? 'Cancelar' : '+ Añadir Tarea'}
              </Button>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2"
                >
                  <Card className="p-4 md:p-6 bg-natural-accent/5 border-natural-accent/20 space-y-4">
                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          placeholder="Nueva intención estratégica..."
                          className="flex-1 bg-transparent border-b border-natural-accent/30 py-2 text-sm font-semibold focus:outline-none focus:border-natural-accent transition-colors"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-natural-accent opacity-60">Inicio</label>
                          <input 
                            type="time"
                            className="w-full bg-white/50 border border-natural-accent/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-natural-accent"
                            value={newTask.startTime}
                            onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-natural-accent opacity-60">Fin</label>
                          <input 
                            type="time"
                            className="w-full bg-white/50 border border-natural-accent/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-natural-accent"
                            value={newTask.endTime}
                            onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-natural-accent opacity-60">Recurrencia Neural</label>
                        <div className="flex justify-between md:justify-start md:gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={cn(
                                "w-8 h-8 rounded-full text-[10px] font-bold border transition-all flex items-center justify-center",
                                newTask.recurrenceDays.includes(day.value)
                                  ? "bg-natural-accent text-white border-natural-accent"
                                  : "bg-white text-natural-accent border-natural-accent/10 hover:border-natural-accent/30"
                              )}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {newTask.recurrenceDays.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-natural-accent opacity-60">Sincronizar hasta</label>
                          <input 
                            type="date"
                            className="w-full bg-white/50 border border-natural-accent/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-natural-accent"
                            value={newTask.recurrenceUntil}
                            onChange={(e) => setNewTask({ ...newTask, recurrenceUntil: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" type="button" onClick={() => setIsAdding(false)}>Cancelar</Button>
                        <Button size="sm" type="submit">Sincronizar Ciclo</Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTasks.length > 0 ? (
                selectedTasks.map(task => (
                  <Card key={task.id} className="p-5 flex items-start gap-4 border-natural-border/50 group">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      task.priority === 'critical' ? "bg-rose-100 text-rose-600" : "bg-natural-bg text-natural-accent"
                    )}>
                      {task.isDeepWork ? <Zap className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold uppercase tracking-wider">{task.title}</h4>
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                          task.priority === 'critical' ? "bg-rose-500 text-white" : "bg-natural-accent/10 text-natural-accent"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        {(task.startTime || task.endTime) && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-natural-accent/60">
                            <Clock className="h-3 w-3" />
                            {task.startTime || '--:--'} - {task.endTime || '--:--'}
                          </span>
                        )}
                        {task.recurrence && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                            <RefreshCw className="h-3 w-3" />
                            {task.recurrence.days.map(d => daysOfWeek.find(day => day.value === d)?.label).join('')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-natural-text/60 line-clamp-2 italic font-serif">{task.description || 'Sin descripción estratégica.'}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-10 border-dashed border-natural-border text-center flex flex-col items-center justify-center col-span-full">
                  <p className="text-sm text-natural-accent/40 italic font-serif">No hay tareas programadas para este ciclo.</p>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
