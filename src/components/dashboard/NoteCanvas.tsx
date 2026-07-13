import { 
  StickyNote, 
  Search, 
  Hash, 
  FileText,
  Clock,
  ArrowUpRight,
  Sparkles,
  Send,
  Loader2,
  BrainCircuit,
  Network,
  Calendar,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from '@/src/components/ui/Base';
import { Note } from '@/src/types';
import { cn, formatDate } from '@/src/lib/utils';
import { auth, getAccessToken } from '@/src/lib/firebase';
import { KnowledgeGraph } from './KnowledgeGraph';

interface NoteCanvasProps {
  notes: Note[];
  addNote: (note: Partial<Note>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export function NoteCanvas({ notes, addNote, updateNote, deleteNote, aiEngine }: NoteCanvasProps & { aiEngine: string }) {
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ answer: string; suggestedStrategy?: string } | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());
  const [extractedEvents, setExtractedEvents] = useState<Record<string, any[]>>({});
  const [savingEventIds, setSavingEventIds] = useState<Set<string>>(new Set());

  const handleAiQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    setAiResponse(null);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const response = await fetch('/api/cerebro/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        },
        body: JSON.stringify({ query, notes, model: aiEngine })
      });
      const data = await response.json();
      setAiResponse(data);
    } catch (error) {
      console.error('Wiki Error:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExtractEvents = async (note: Note) => {
    setExtractingIds(prev => new Set(prev).add(note.id));
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const res = await fetch('/api/calendar/extract-events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        },
        body: JSON.stringify({ content: note.content, model: aiEngine })
      });
      const data = await res.json();
      setExtractedEvents(prev => ({ ...prev, [note.id]: data.events || [] }));
    } catch (error) {
      console.error('Extraction Error:', error);
    } finally {
      setExtractingIds(prev => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
    }
  };

  const handleSaveToCalendar = async (noteId: string, event: any, eventIndex: number) => {
    const eventKey = `${noteId}-${eventIndex}`;
    setSavingEventIds(prev => new Set(prev).add(eventKey));
    try {
      const token = getAccessToken();
      if (!token) throw new Error('No Google token');

      const res = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event })
      });
      
      if (res.ok) {
        // Remove from list or mark as saved
        setExtractedEvents(prev => ({
          ...prev,
          [noteId]: prev[noteId].filter((_, i) => i !== eventIndex)
        }));
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSavingEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventKey);
        return next;
      });
    }
  };

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    
    await addNote({
      title: newNote.title,
      content: newNote.content,
      tags: ['boceto', 'estrategia', 'captura']
    });
    setNewNote({ title: '', content: '' });
    setIsAddingNote(false);
  };

  // Grouping notes by date
  const groupNotesByDate = () => {
    const groups: Record<string, Note[]> = {};
    notes.forEach(note => {
      const date = new Date(note.updatedAt).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return groups;
  };

  const groupedNotes = groupNotesByDate();

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif italic text-natural-accent">Mis Bocetos</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-natural-accent/50 mt-1">Ecosistema de Ideas y Estrategias PupiCalendar</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            variant="accent" 
            size="sm" 
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="text-[10px] font-black uppercase tracking-widest bg-natural-accent text-white hover:bg-natural-accent/90 transition-all rounded-full px-6 shadow-lg shadow-natural-accent/20"
          >
            <Plus className={cn("h-4 w-4 mr-2 transition-transform", isAddingNote && "rotate-45")} />
            {isAddingNote ? 'Cerrar' : 'Nuevo Boceto'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGraph(true)}
            className="text-[10px] font-black uppercase tracking-widest border-natural-accent/20 text-natural-accent hover:bg-natural-accent hover:text-white transition-all rounded-full px-6"
          >
            <Network className="h-4 w-4 mr-2" />
            Mapa de Ideas
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAddingNote && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 md:p-8 border-natural-accent shadow-2xl bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-natural-accent" />
              <form onSubmit={handleCreateNote} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-natural-accent/40">Título del Boceto</label>
                  <input 
                    autoFocus
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Ej: Estrategia de Marketing Q3..."
                    className="w-full text-2xl font-serif italic border-b border-natural-border pb-2 focus:outline-none focus:border-natural-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-natural-accent/40">Contenido</label>
                  <textarea 
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Describe tu idea o boceto aquí..."
                    className="w-full h-32 text-sm leading-relaxed text-natural-text/80 focus:outline-none resize-none bg-natural-bg/30 p-4 rounded-2xl"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-natural-border/30">
                  <Button variant="ghost" type="button" onClick={() => setIsAddingNote(false)} className="text-[10px] font-black uppercase tracking-widest">
                    Cancelar
                  </Button>
                  <Button type="submit" className="px-8 bg-natural-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    Guardar Boceto
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGraph && (
          <KnowledgeGraph notes={notes} aiEngine={aiEngine} onClose={() => setShowGraph(false)} />
        )}
      </AnimatePresence>

      {/* LLM WIKI Search / AI Assistant */}
      <Card className="p-1 md:p-1.5 border-natural-accent/20 bg-natural-bg shadow-xl rounded-[32px]">
        <div className="bg-white rounded-[28px] p-4 md:p-6 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-natural-accent/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-natural-accent" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-natural-accent">Inteligencia Pupi</h3>
              <p className="text-[10px] text-natural-text/40 font-mono">Consulta tus bocetos y estrategias guardadas</p>
            </div>
          </div>

          <form onSubmit={handleAiQuery} className="relative mb-4">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué ideas guardamos sobre el calendario?"
              className="w-full pl-6 pr-24 py-4 bg-natural-bg/30 border border-natural-border rounded-2xl text-sm focus:outline-none focus:border-natural-accent transition-all font-serif italic"
            />
            <Button 
              type="submit"
              disabled={isQuerying}
              className="absolute right-2 top-2 h-10 px-4 rounded-xl shadow-lg"
            >
              {isQuerying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-natural-bg/50 rounded-2xl p-5 border border-natural-border/40"
              >
                <div className="flex items-start gap-4">
                  <BrainCircuit className="h-5 w-5 text-natural-accent mt-1 shrink-0" />
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-natural-text/80 italic font-serif">
                      "{aiResponse.answer}"
                    </p>
                    {aiResponse.suggestedStrategy && (
                      <div className="pt-4 border-t border-natural-border/30">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-natural-accent block mb-2">Estrategia Sugerida</span>
                        <p className="text-xs font-bold uppercase tracking-tight text-natural-accent/60">
                          {aiResponse.suggestedStrategy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <div className="space-y-12 pb-12">
        {Object.entries(groupedNotes).map(([date, dateNotes]) => (
          <div key={date} className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent/50 flex items-center gap-4">
              {date}
              <div className="h-px bg-natural-accent/10 flex-1" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {dateNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  extractingIds={extractingIds} 
                  extractedEvents={extractedEvents}
                  savingEventIds={savingEventIds}
                  handleExtractEvents={handleExtractEvents}
                  handleSaveToCalendar={handleSaveToCalendar}
                  updateNote={updateNote}
                  deleteNote={deleteNote}
                />
              ))}
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="py-20 text-center">
            <BrainCircuit className="h-12 w-12 text-natural-accent/10 mx-auto mb-4" />
            <p className="text-sm italic font-serif text-natural-text/30">No hay bocetos guardados. Comienza a capturar ideas.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteCardProps {
  key?: string;
  note: Note; 
  extractingIds: Set<string>; 
  extractedEvents: Record<string, any[]>; 
  savingEventIds: Set<string>;
  handleExtractEvents: (note: Note) => any;
  handleSaveToCalendar: (noteId: string, event: any, idx: number) => any;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

function NoteCard({ 
  note, 
  extractingIds, 
  extractedEvents, 
  savingEventIds, 
  handleExtractEvents, 
  handleSaveToCalendar,
  updateNote,
  deleteNote
}: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;
    await updateNote(note.id, { title: editTitle, content: editContent });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar el boceto "${note.title}"?`)) {
      await deleteNote(note.id);
    }
  };

  return (
    <Card className="p-0 overflow-hidden border-natural-card-border hover:shadow-xl transition-all group flex flex-col">
      <div className="px-5 py-3 md:px-6 md:py-4 bg-natural-bg/50 border-b border-natural-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-3.5 w-3.5 text-natural-accent" />
          <span className="text-[9px] font-bold text-natural-accent uppercase tracking-[0.2em]">Boceto Estratégico</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="text-natural-accent/60 hover:text-natural-accent transition-colors cursor-pointer text-[9px] font-bold uppercase tracking-widest"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
          <span className="text-natural-border text-[9px]">|</span>
          <button 
            onClick={handleDelete} 
            className="text-rose-500/60 hover:text-rose-500 transition-colors cursor-pointer text-[9px] font-bold uppercase tracking-widest"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-natural-accent/40">Título del Boceto</label>
            <input 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-base font-serif italic border-b border-natural-border pb-1 focus:outline-none focus:border-natural-accent"
            />
          </div>
          <div className="space-y-1 flex-1 flex flex-col">
            <label className="text-[9px] font-black uppercase tracking-widest text-natural-accent/40">Contenido</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-32 text-xs md:text-sm text-natural-text/70 leading-relaxed bg-natural-bg/30 p-3 rounded-xl focus:outline-none resize-none flex-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-[9px] font-black uppercase tracking-widest">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleUpdate} className="text-[9px] font-black uppercase tracking-widest px-6">
              Guardar
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8">
          <h3 className="text-base md:text-lg font-serif italic text-natural-text mb-3 md:mb-4">{note.title}</h3>
          <p className={cn(
            "text-xs md:text-sm text-natural-text/70 leading-relaxed mb-6 cursor-pointer transition-all",
            !isExpanded && "line-clamp-4"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          >
            {note.content}
          </p>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-6">
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-natural-bg text-natural-accent rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest border border-natural-border/30">
                <Hash className="h-2 w-2 md:h-2.5 md:w-2.5" />
                {tag}
              </span>
            ))}
          </div>

        {/* Extraction UI */}
        <div className="mb-6 space-y-3">
          {!extractedEvents[note.id] && (
            <Button 
              variant="outline" 
              size="sm"
              disabled={extractingIds.has(note.id)}
              onClick={() => handleExtractEvents(note)}
              className="w-full text-[9px] font-black uppercase tracking-widest border-natural-accent/10 hover:bg-natural-accent/5"
            >
              {extractingIds.has(note.id) ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-2 text-natural-accent" />
              )}
              Detectar Eventos IA
            </Button>
          )}

          <AnimatePresence>
            {extractedEvents[note.id]?.map((event, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-natural-accent/5 rounded-xl border border-natural-accent/10 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold truncate text-natural-accent uppercase tracking-tight">{event.summary}</p>
                  <p className="text-[8px] text-natural-text/40 font-mono">
                    {new Date(event.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={savingEventIds.has(`${note.id}-${idx}`)}
                  onClick={() => handleSaveToCalendar(note.id, event, idx)}
                  className="h-8 w-8 rounded-lg bg-natural-accent text-white p-0 shrink-0"
                >
                  {savingEventIds.has(`${note.id}-${idx}`) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </motion.div>
            ))}
            {extractedEvents[note.id] && extractedEvents[note.id].length === 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] text-center text-natural-text/30 italic"
              >
                No se detectaron eventos específicos.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between text-[8px] md:text-[9px] text-natural-text/30 font-bold uppercase tracking-widest pt-4 border-t border-natural-bg mt-auto">
          <span className="flex items-center gap-1.5 md:gap-2">
            <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
            {formatDate(note.updatedAt)}
          </span>
          <span className="flex items-center gap-1.5 md:gap-2">
            <FileText className="h-2.5 w-2.5 md:h-3 md:w-3" />
            {note.content.length} u.
          </span>
        </div>
      </div>
      )}
    </Card>
  );
}
