import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, RefreshCw, Check, AlertCircle, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';
import { Task } from '@/src/types';
import { getAccessToken, googleSignIn } from '@/src/lib/firebase';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface GoogleCalendarSyncProps {
  onTasksImported: (tasks: Partial<Task>[]) => void;
  existingGoogleEventIds: string[];
}

export function GoogleCalendarSync({ onTasksImported, existingGoogleEventIds }: GoogleCalendarSyncProps) {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('No autorizado. Por favor reconecta Google.');

      const res = await fetch('/api/calendar/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('No autorizado. Por favor reconecta Google.');
        throw new Error('Error al obtener calendarios');
      }
      const data = await res.json();
      setCalendars(data);
      // Select primary by default
      const primary = data.find((c: GoogleCalendar) => c.primary);
      if (primary) setSelectedIds([primary.id]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await googleSignIn();
      fetchCalendars();
    } catch (err) {
      setError('Error al iniciar sesión con Google');
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  const toggleCalendar = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSync = async () => {
    if (selectedIds.length === 0) return;
    setSyncing(true);
    setError(null);
    setSuccess(false);
    try {
      const allEvents: Partial<Task>[] = [];
      const now = new Date();
      const timeMin = now.toISOString();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const timeMax = thirtyDaysLater.toISOString();
      const token = getAccessToken();

      for (const calendarId of selectedIds) {
        const res = await fetch(`/api/calendar/events?calendarId=${encodeURIComponent(calendarId)}&timeMin=${timeMin}&timeMax=${timeMax}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error(`Error al sincronizar ${calendarId}`);
        const events: GoogleEvent[] = await res.json();
        
        events.forEach(event => {
          // Skip if already imported
          if (existingGoogleEventIds.includes(event.id)) return;

          const startStr = event.start.dateTime || event.start.date;
          if (!startStr) return;

          const startDate = new Date(startStr);
          
          allEvents.push({
            title: event.summary || 'Evento sin título',
            description: event.description || '',
            dueDate: startDate.toISOString(),
            startTime: event.start.dateTime ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
            endTime: event.end.dateTime ? new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
            googleEventId: event.id,
            status: 'todo',
            priority: 'medium',
            isDeepWork: false
          });
        });
      }
      
      if (allEvents.length > 0) {
        onTasksImported(allEvents);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('No se encontraron nuevos eventos para sincronizar.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="bg-white border-natural-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-natural-border bg-natural-bg/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-natural-accent">Google Calendar Sync</h3>
            <p className="text-[10px] text-slate-400 font-mono">Sincronización Bidireccional de Ciclos</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-natural-accent animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cargando Ecosistema...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-rose-600">{error}</p>
              <button onClick={fetchCalendars} className="text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-500 mt-2">Reintentar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Seleccionar Orígenes</label>
              <div className="grid grid-cols-1 gap-2">
                {calendars.map(cal => (
                  <button
                    key={cal.id}
                    onClick={() => toggleCalendar(cal.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                      selectedIds.includes(cal.id)
                        ? "bg-natural-accent/5 border-natural-accent"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: cal.backgroundColor || '#3b82f6' }}
                      />
                      <span className="text-[11px] font-bold text-natural-text truncate max-w-[200px]">
                        {cal.summary}
                      </span>
                    </div>
                    {selectedIds.includes(cal.id) && <Check className="h-3 w-3 text-natural-accent" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleSync} 
                disabled={syncing || selectedIds.length === 0}
                className="w-full justify-center gap-2 h-11"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {syncing ? 'SINCRONIZANDO...' : success ? 'CONECTADO ✓' : 'SINCRONIZAR AHORA'}
              </Button>
              <p className="text-[9px] text-center text-slate-400 mt-3 italic font-serif">
                Sincroniza los próximos 30 días de tu agenda estratégica.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
