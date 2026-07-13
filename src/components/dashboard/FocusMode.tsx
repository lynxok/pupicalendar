import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Pause, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { Task } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface FocusModeProps {
  task: Task;
}

export function FocusMode({ task }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsCompleted(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeLeft(25 * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 md:py-24 text-center space-y-8 md:space-y-12">
      <div className="relative inline-block">
        <motion.div 
          animate={{ rotate: isActive ? 360 : 3 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="h-32 w-32 md:h-48 md:w-48 rounded-[48px] md:rounded-[64px] bg-natural-accent text-white flex items-center justify-center mx-auto shadow-2xl relative z-10"
        >
          <Zap className="h-12 w-12 md:h-20 md:w-20" />
        </motion.div>
        {isActive && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[64px] bg-natural-accent/20 -z-10"
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl md:text-6xl font-serif italic mb-4">La Única Cosa</h2>
        <div className="flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-natural-accent">
          <ShieldCheck className="h-4 w-4" />
          <span>Ejecución Blindada Activa</span>
        </div>
      </div>

      <Card className="p-8 md:p-12 border border-natural-accent/20 shadow-2xl text-left bg-white/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-[64px] font-serif italic text-natural-accent/5 select-none leading-none">
          {formatTime(timeLeft)}
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent mb-4 md:mb-6 block opacity-50">Prioridad Estratégica Activa</span>
          <h3 className="text-2xl md:text-3xl font-serif italic mb-4 md:mb-6 text-natural-text">{task.title}</h3>
          
          <div className="flex items-center gap-10 mt-10">
            <div className="flex-1">
              <div className="text-5xl md:text-7xl font-mono tracking-tighter text-natural-text">
                {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant={isActive ? "outline" : "accent"} 
                className={cn(
                  "h-16 w-16 md:h-20 md:w-20 rounded-3xl shadow-2xl flex items-center justify-center transition-all group",
                  !isActive && "bg-natural-accent hover:scale-105 active:scale-95 shadow-natural-accent/20"
                )}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? (
                  <Pause className="h-6 w-6 md:h-8 md:w-8 text-natural-accent" />
                ) : (
                  <Play className="h-6 w-6 md:h-8 md:w-8 ml-1 fill-white" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="h-16 w-16 md:h-20 md:w-20 rounded-3xl border border-natural-border flex items-center justify-center hover:bg-natural-bg hover:text-rose-500 transition-colors"
                onClick={resetTimer}
              >
                <RotateCcw className="h-6 w-6 md:h-7 md:w-7 opacity-40 group-hover:opacity-100" />
              </Button>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-natural-accent/40">
            <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-natural-border")} />
            <span>{isActive ? "Transmisión de Enfoque en Curso" : "Esperando Inicio de Sesión"}</span>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sincronización de tarea completada exitosamente
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
