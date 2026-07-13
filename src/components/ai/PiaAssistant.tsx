import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, MessageSquare, Sparkles, X } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Base';
import { Task } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebase';
interface PupiAssistantProps {
  tasks: Task[];
  aiEngine: string;
}

export function PupiAssistant({ tasks, aiEngine }: PupiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'pupi'; text: string; actions?: string[] }[]>([
    { role: 'pupi', text: "¡Hola! Soy Pupi, tu socia de rendimiento. ¿Cómo puedo ayudarte a alcanzar tu estado de flujo hoy?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      askPupi(inputValue);
      setInputValue('');
    }
  };

  const askPupi = async (action: string, task?: Task) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', text: action }]);
    
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const res = await fetch('/api/pia', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : ''
        },
        body: JSON.stringify({ 
          task: task || tasks[0], 
          context: "Control de productividad general", 
          action,
          model: aiEngine
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'pupi', text: data.message || data.response, actions: data.suggestedActions }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'pupi', text: "Tengo problemas para conectarme ahora, ¡pero mantén el enfoque!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-10 right-6 md:right-10 h-14 w-14 md:h-16 md:w-16 rounded-full bg-natural-accent text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50 border-4 border-white/20"
      >
        {isOpen ? <X className="h-6 w-6 md:h-7 md:w-7" /> : <Bot className="h-6 w-6 md:h-7 md:w-7" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed inset-0 md:inset-auto md:bottom-32 md:right-10 w-full md:w-[400px] h-full md:h-[70vh] md:max-h-[700px] z-50 flex flex-col p-0 md:p-0"
          >
            <Card className="flex-1 overflow-hidden border-none md:border-natural-border shadow-2xl flex flex-col p-0 bg-white md:bg-white/95 md:backdrop-blur-xl rounded-none md:rounded-[32px]">
              <div className="p-6 border-b border-natural-bg bg-natural-accent text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">PUPI : Socia Estratégica</h3>
                    <p className="text-[8px] uppercase tracking-widest mt-1.5 opacity-60">Motor de Rendición de Cuentas v4.0</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-[400px]">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-[24px] text-sm leading-relaxed",
                      m.role === 'user' 
                        ? "bg-natural-text text-white rounded-tr-none" 
                        : "bg-natural-bg text-natural-text font-serif italic text-base rounded-tl-none border border-natural-border/30"
                    )}>
                      {m.text}
                      {m.actions && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {m.actions.map(a => (
                            <button
                              key={a}
                              onClick={() => askPupi(a)}
                              className="px-3 py-1.5 bg-white hover:bg-natural-accent hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-natural-border/50 transition-all shadow-sm"
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-[10px] font-bold uppercase tracking-widest text-natural-accent/40 animate-pulse px-4">Pupi está procesando estrategia...</div>}
              </div>

              <div className="p-6 border-t border-natural-bg bg-white">
                <div className="flex gap-3">
                  <input 
                    placeholder="Sincronizar intención estratégica..."
                    className="flex-1 text-[11px] font-bold uppercase tracking-widest bg-natural-bg border-none rounded-2xl px-5 py-3 outline-none focus:ring-1 focus:ring-natural-accent/30 transition-all"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSend();
                      }
                    }}
                  />
                  <Button 
                    variant="accent" 
                    size="sm" 
                    className="rounded-2xl h-11 w-11 p-0 shadow-lg"
                    onClick={handleSend}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
