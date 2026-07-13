import React from 'react';
import { motion } from 'motion/react';
import { Clock, Calendar, RefreshCw, ChevronRight } from 'lucide-react';
import { Task } from '../../types';
import { Card } from '../ui/Base';
import { cn } from '../../lib/utils';

interface UpcomingTasksProps {
  tasks: Task[];
  onViewCalendar: () => void;
}

export function UpcomingTasks({ tasks, onViewCalendar }: UpcomingTasksProps) {
  const upcomingTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const formatTime = (time?: string) => time || '--:--';

  const daysOfWeek = [
    { label: 'D', value: 0 },
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'X', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
  ];

  return (
    <Card className="bg-white border-natural-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-natural-border flex items-center justify-between bg-natural-bg/30">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-natural-accent">Próximos Compromisos</h3>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Sincronización de Agenda Activa</p>
        </div>
        <button 
          onClick={onViewCalendar}
          className="h-7 w-7 rounded-full bg-white border border-natural-border flex items-center justify-center hover:bg-natural-bg transition-colors"
        >
          <Calendar className="h-3.5 w-3.5 text-natural-accent" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {upcomingTasks.length > 0 ? (
          <div className="divide-y divide-natural-border">
            {upcomingTasks.map((task, i) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-natural-bg/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                    task.priority === 'high' ? 'bg-rose-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-natural-text truncate group-hover:text-natural-accent transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                        <Clock className="h-3 w-3 opacity-60" />
                        {formatTime(task.startTime)}
                      </div>
                      {task.recurrence && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500/70 uppercase tracking-tighter">
                          <RefreshCw className="h-2.5 w-2.5" />
                          {task.recurrence.days.map(d => daysOfWeek.find(day => day.value === d)?.label).join('')}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-natural-border group-hover:text-natural-accent transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40 grayscale">
            <Calendar className="h-8 w-8 mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Sin tareas programadas</p>
          </div>
        )}
      </div>

      <button 
        onClick={onViewCalendar}
        className="p-4 bg-natural-bg/30 text-[9px] font-black uppercase tracking-[0.2em] text-natural-accent hover:bg-natural-bg transition-all flex items-center justify-center gap-2 border-t border-natural-border"
      >
        Ver Calendario Completo
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
