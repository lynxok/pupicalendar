import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Zap, Globe, Save, LogOut, Camera, Calendar as CalendarIcon } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { auth, db } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { Task } from '@/src/types';

interface UserSettingsProps {
  tasks: Task[];
  onTasksImported: (tasks: Partial<Task>[]) => void;
  aiEngine?: string;
  onChangeAiEngine?: (engine: string) => void;
}

export function UserSettings({ tasks, onTasksImported, aiEngine, onChangeAiEngine }: UserSettingsProps) {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    displayName: user?.displayName || '',
    bio: '',
    focusMode: true,
    biometrics: true,
    notifications: true,
    language: 'es',
    openaiKey: '',
    geminiKey: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err: any) {
        if (err.code === 'unavailable' || err.message?.includes('offline')) {
          console.log("Firestore is offline, using local state.");
        } else {
          console.error("Error fetching settings:", err);
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'settings'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Configuración sincronizada con la nube");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert('Fallo en la sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 pb-32">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[40px] border border-natural-border shadow-xl">
        <div className="relative group">
          <div className="h-32 w-32 rounded-[48px] bg-natural-accent flex items-center justify-center text-white font-serif italic text-4xl shadow-2xl relative overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              user?.email?.[0].toUpperCase() || '?'
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-serif italic text-natural-text mb-2">{user?.displayName || 'Usuario Estratégico'}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent">{user?.email || 'MODO INVITADO'}</p>
          <div className="mt-4 flex gap-3 justify-center md:justify-start">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">Cuenta Verificada</span>
            <span className="px-3 py-1 bg-natural-accent/10 text-natural-accent text-[9px] font-bold uppercase tracking-widest rounded-full border border-natural-accent/10">Plan Pro 2026</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-8 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-natural-accent/10 flex items-center justify-center text-natural-accent">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-natural-accent">Seguridad y Acceso</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center py-4 border-b border-natural-border/30">
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">Autenticación 2FA</p>
                <p className="text-[10px] text-natural-text/40 font-mono mt-1">Nivel de protección: Alto</p>
              </div>
              <div className="h-6 w-10 bg-emerald-500 rounded-full flex items-center px-1">
                <div className="h-4 w-4 bg-white rounded-full ml-auto shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-natural-border/30">
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">Visibilidad de Datos</p>
                <p className="text-[10px] text-natural-text/40 font-mono mt-1">Cifrado de extremo a extremo</p>
              </div>
              <div className="h-6 w-10 bg-natural-border rounded-full flex items-center px-1">
                <div className="h-4 w-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 space-y-8 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-natural-accent/10 flex items-center justify-center text-natural-accent">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-natural-accent">Preferencias de IA</h3>
          </div>

          <div className="space-y-6">
             {onChangeAiEngine && aiEngine && (
               <div className="space-y-2">
                 <p className="text-xs font-bold uppercase tracking-tight">Motor de Inteligencia Artificial</p>
                 <select 
                   value={aiEngine}
                   onChange={(e) => onChangeAiEngine(e.target.value)}
                   className="w-full bg-natural-bg border-none rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-natural-accent/20 cursor-pointer"
                 >
                   <optgroup label="Google Gemini">
                     <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                     <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                     <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                   </optgroup>
                   <optgroup label="OpenAI">
                     <option value="gpt-4o">GPT-4o</option>
                     <option value="gpt-4o-mini">GPT-4o Mini</option>
                   </optgroup>
                 </select>
               </div>
             )}
             <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-tight">Personalidad de Pupi</p>
                <select className="w-full bg-natural-bg border-none rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-natural-accent/20">
                  <option>Estratégica / Profesional</option>
                  <option>Empática / Motivadora</option>
                  <option>Minimalista / Directa</option>
                </select>
             </div>
             <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-tight">Frecuencia de Notificaciones</p>
                <select className="w-full bg-natural-bg border-none rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-natural-accent/20">
                  <option>Tiempo Real</option>
                  <option>Resumen Diario</option>
                  <option>Solo Críticas</option>
                </select>
             </div>

             <div className="pt-6 space-y-4 border-t border-natural-border/30">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">OpenAI API Key (Opcional)</label>
                  <input 
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiKey || ''}
                    onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                    className="w-full p-4 bg-natural-bg rounded-2xl border-none text-[11px] font-mono focus:ring-1 focus:ring-natural-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gemini API Key (Opcional)</label>
                  <input 
                    type="password"
                    placeholder="AIza..."
                    value={settings.geminiKey || ''}
                    onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                    className="w-full p-4 bg-natural-bg rounded-2xl border-none text-[11px] font-mono focus:ring-1 focus:ring-natural-accent/20"
                  />
                  <p className="text-[9px] text-slate-400 italic">
                    Habilita modelos premium en la cabecera.
                  </p>
                </div>
              </div>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 gap-8">
        <GoogleCalendarSync 
          existingGoogleEventIds={tasks.map(t => t.googleEventId).filter(Boolean) as string[]}
          onTasksImported={onTasksImported}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-10">
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="text-rose-500 hover:bg-rose-50 rounded-2xl px-8 h-14 text-[10px] font-black uppercase tracking-[0.3em] order-2 md:order-1"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Terminar Sesión
        </Button>
        <Button 
          disabled={loading}
          onClick={handleSave}
          className="rounded-2xl px-12 h-14 text-[11px] font-black uppercase tracking-[0.3em] shadow-xl order-1 md:order-2"
        >
          <Save className="h-4 w-4 mr-3" />
          {loading ? 'Sincronizando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
