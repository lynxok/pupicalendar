import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Calendar, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { Habit } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface HabitTrackerProps {
  habits: Habit[];
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

export function HabitTracker({ habits, addHabit, updateHabit, deleteHabit }: HabitTrackerProps) {
  const toggleHabit = async (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    if (habit.lastCompleted === today) {
      // Already completed today, maybe toggle off? (simple logic: decrement streak)
      await updateHabit(habit.id, {
        streak: Math.max(0, habit.streak - 1),
        lastCompleted: null
      });
    } else {
      await updateHabit(habit.id, {
        streak: habit.streak + 1,
        lastCompleted: today
      });
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      await addHabit({ name: newHabitName });
      setNewHabitName('');
      setIsAdding(false);
    }
  };

  return (
    <Card className="stationery-bg p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold font-display">Bucles de Identidad</h3>
          <p className="text-[10px] text-slate-500 font-mono">Marco de Hábitos Atómicos Activo</p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsAdding(!isAdding)}>
          <Plus className={cn("h-4 w-4 transition-transform", isAdding && "rotate-45")} />
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <form onSubmit={handleAddHabit} className="flex gap-2 bg-natural-accent/5 p-3 rounded-2xl border border-natural-accent/10">
              <input 
                autoFocus
                placeholder="Nombre del hábito..."
                className="flex-1 bg-transparent border-b border-natural-accent/20 py-1 text-sm font-semibold focus:outline-none focus:border-natural-accent transition-colors"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
              <Button size="sm" type="submit" className="h-8 px-3 text-[10px]">Añadir</Button>
              <Button variant="ghost" size="sm" type="button" className="h-8 px-2" onClick={() => setIsAdding(false)}>X</Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 md:space-y-4">
        {habits.map((habit) => (
          <div 
            key={habit.id} 
            className="flex items-center justify-between p-2.5 md:p-3 rounded-2xl bg-white border border-natural-border/30 shadow-sm transition-transform active:scale-98 group"
          >
            <div className="flex items-center gap-3">
              <div 
                className={cn(
                  "h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center transition-colors",
                  habit.lastCompleted === new Date().toISOString().split('T')[0] 
                    ? "bg-natural-accent text-white" 
                    : "bg-natural-bg text-natural-accent"
                )}
              >
                <Flame className={cn("h-4 w-4 md:h-5 md:w-5", habit.streak > 5 && "animate-pulse")} />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wide">{habit.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        i < habit.streak % 7 ? "bg-natural-accent" : "bg-natural-border/50"
                      )} 
                    />
                  ))}
                  <span className="text-[9px] text-slate-400 ml-1 font-mono">{habit.streak}d</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Eliminar este hábito?')) {
                    deleteHabit(habit.id);
                  }
                }}
              >
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-8 w-8 p-0 rounded-full md:h-9 md:w-9 transition-all",
                  habit.lastCompleted === new Date().toISOString().split('T')[0] && "bg-emerald-50 border-emerald-200 text-emerald-500"
                )}
                onClick={() => toggleHabit(habit)}
              >
                <ChevronRight className={cn("h-4 w-4", habit.lastCompleted === new Date().toISOString().split('T')[0] && "rotate-90")} />
              </Button>
            </div>
          </div>
        ))}
        
        {habits.length === 0 && (
          <div className="text-center py-4 md:py-6">
            <p className="text-xs text-slate-400 italic font-serif">No hay bucles de identidad definidos.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
