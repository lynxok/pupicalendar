import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Sparkles, Loader2, Mail, Lock } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Base';
import { auth, googleSignIn } from '@/src/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

export function AuthOverlay() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await googleSignIn();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-natural-bg/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 md:p-10 border-natural-accent/20 shadow-2xl rounded-[40px] bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-natural-accent" />
          
          <div className="text-center mb-10">
            <div className="h-16 w-16 rounded-[24px] bg-natural-accent text-white flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-serif italic text-natural-text mb-2">PupiCalendar</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent opacity-60">Sincronización Neural de Intenciones</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-natural-accent/40" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="CORREO ELECTRÓNICO"
                  className="w-full pl-12 pr-6 py-4 bg-natural-bg/50 border border-natural-border rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-natural-accent transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-natural-accent/40" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="CONTRASEÑA"
                  className="w-full pl-12 pr-6 py-4 bg-natural-bg/50 border border-natural-border rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-natural-accent transition-all"
                />
              </div>
            </div>

            {error && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest text-center">{error}</p>}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isLogin ? 'ENTRAR AL FLUJO' : 'CREAR IDENTIDAD'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-natural-border text-center space-y-6">
            <button 
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 w-full p-4 border border-natural-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-bg transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
              Sincronizar con Google
            </button>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-natural-accent/60 hover:text-natural-accent"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
