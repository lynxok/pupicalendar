import { useState, useMemo } from 'react';
import { Search, Calendar, StickyNote, PenTool, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/src/components/ui/Base';
import { Task, Note, Sketch } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface GlobalSearchProps {
  tasks: Task[];
  notes: Note[];
  sketches: Sketch[];
  onSelectItem: (type: string, item: any) => void;
}

export function GlobalSearch({ tasks, notes, sketches, onSelectItem }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return { tasks: [], notes: [], sketches: [] };
    
    const q = query.toLowerCase();
    
    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
      notes: notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
      sketches: sketches.filter(s => s.title.toLowerCase().includes(q))
    };
  }, [query, tasks, notes, sketches]);

  const hasResults = results.tasks.length > 0 || results.notes.length > 0 || results.sketches.length > 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className={cn(
        "flex items-center gap-4 bg-white/80 backdrop-blur-xl border px-6 py-4 rounded-[24px] shadow-lg transition-all duration-300",
        isOpen ? "border-natural-accent shadow-2xl bg-white" : "border-natural-border"
      )}>
        <Search className={cn("h-5 w-5 transition-colors", isOpen ? "text-natural-accent" : "text-natural-accent/40")} />
        <input 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busca en PupiCalendar (tareas, notas, bocetos...)"
          className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold uppercase tracking-widest placeholder:text-natural-text/20"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-[10px] font-black uppercase tracking-widest text-natural-text/30 hover:text-natural-accent">
            Limpiar
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query && (
          <>
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-4 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-natural-border rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] p-4 space-y-6"
            >
              {!hasResults ? (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-natural-accent/10 mx-auto mb-4" />
                  <p className="text-sm italic font-serif text-natural-text/30">No encontramos coincidencias para "{query}"</p>
                </div>
              ) : (
                <>
                  {results.tasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent/50 flex items-center gap-3">
                        <CheckCircle2 className="h-3 w-3" />
                        Tareas
                      </h4>
                      <div className="space-y-1">
                        {results.tasks.map(task => (
                          <button 
                            key={task.id}
                            onClick={() => {
                              onSelectItem('task', task);
                              setIsOpen(false);
                            }}
                            className="w-full text-left p-4 hover:bg-natural-accent/5 rounded-2xl transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-natural-text group-hover:text-natural-accent transition-colors">{task.title}</span>
                              <span className="text-[10px] font-mono text-natural-text/30">{task.priority}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.notes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent/50 flex items-center gap-3">
                        <StickyNote className="h-3 w-3" />
                        Notas IA
                      </h4>
                      <div className="space-y-1">
                        {results.notes.map(note => (
                          <button 
                            key={note.id}
                            onClick={() => {
                              onSelectItem('note', note);
                              setIsOpen(false);
                            }}
                            className="w-full text-left p-4 hover:bg-natural-accent/5 rounded-2xl transition-colors group"
                          >
                            <span className="text-sm font-bold text-natural-text group-hover:text-natural-accent transition-colors block">{note.title}</span>
                            <span className="text-[10px] text-natural-text/40 line-clamp-1 mt-1 italic font-serif">{note.content}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.sketches.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent/50 flex items-center gap-3">
                        <PenTool className="h-3 w-3" />
                        Bocetos
                      </h4>
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {results.sketches.map(sketch => (
                          <button 
                            key={sketch.id}
                            onClick={() => {
                              onSelectItem('sketch', sketch);
                              setIsOpen(false);
                            }}
                            className="text-left p-3 hover:bg-natural-accent/5 rounded-2xl transition-colors group flex items-center gap-3"
                          >
                            <div className="h-10 w-10 rounded-lg bg-natural-bg overflow-hidden border border-natural-border/20 shrink-0">
                              <img src={sketch.imageData} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                            <span className="text-xs font-bold text-natural-text group-hover:text-natural-accent transition-colors truncate">{sketch.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
