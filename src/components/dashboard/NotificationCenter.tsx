import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Sincronización Completada',
      message: 'Tu cerebro externo se ha sincronizado con el motor Gemini 2.0.',
      type: 'success',
      time: 'Hace 2m',
      read: false
    },
    {
      id: '2',
      title: 'Alerta de Enfoque',
      message: 'Has superado el tiempo límite en tareas de baja prioridad.',
      type: 'warning',
      time: 'Hace 15m',
      read: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-natural-border flex items-center justify-center text-natural-accent hover:bg-white/60 transition-colors relative"
      >
        <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 md:top-3 md:right-3 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 md:w-96 z-50 origin-top-right"
            >
              <Card className="p-0 border-natural-border shadow-2xl rounded-[32px] overflow-hidden bg-white/95 backdrop-blur-xl">
                <div className="p-6 border-b border-natural-bg bg-natural-accent/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent">Centro de Notificaciones</h3>
                  <button onClick={() => setIsOpen(false)} className="text-natural-accent/40 hover:text-natural-accent">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer group",
                          n.read ? "bg-white border-natural-border/30 opacity-60" : "bg-natural-bg border-natural-accent/10"
                        )}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            n.type === 'success' ? "bg-emerald-50 text-emerald-500" : 
                            n.type === 'warning' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
                          )}>
                            {n.type === 'success' ? <CheckCircle className="h-4 w-4" /> : 
                             n.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-[11px] font-bold uppercase tracking-tight text-natural-text">{n.title}</h4>
                              <span className="text-[9px] font-mono text-natural-text/40">{n.time}</span>
                            </div>
                            <p className="text-xs text-natural-text/60 leading-relaxed font-serif italic">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-natural-accent/40">
                      <Clock className="h-8 w-8 mx-auto mb-4 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No hay eventos recientes</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <button 
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                    className="w-full p-4 text-[9px] font-black uppercase tracking-[0.3em] text-natural-accent hover:bg-natural-accent hover:text-white transition-all border-t border-natural-border"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
