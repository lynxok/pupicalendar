import { useRef, useState, useEffect } from 'react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  Download, 
  Settings2,
  ChevronLeft,
  ChevronRight,
  Save,
  History,
  Clock,
  Plus
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { cn } from '@/src/lib/utils';
import { AppMode, Sketch } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';

interface PageData {
  id: number;
  paths: any[];
}

export function NotebookCanvas({ setMode }: { setMode: (mode: AppMode) => void }) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [pages, setPages] = useState<PageData[]>([{ id: 1, paths: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const [strokeColor, setStrokeColor] = useState('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(24);
  const [opacity, setOpacity] = useState(1);
  const [isEraser, setIsEraser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sketchTitle, setSketchTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedSketches, setSavedSketches] = useState<Sketch[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "sketches"), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const sketches: Sketch[] = [];
      querySnapshot.forEach((doc) => {
        sketches.push({ id: doc.id, ...doc.data() } as Sketch);
      });
      setSavedSketches(sketches);
    } catch (error) {
      console.error("Error fetching sketches:", error);
    }
  };

  const handleSave = async () => {
    if (!sketchTitle.trim()) return;
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const paths = await canvasRef.current?.exportPaths();
      const imageData = await canvasRef.current?.exportImage('png');
      
      const newSketch = {
        userId: user.uid,
        title: sketchTitle,
        paths: JSON.stringify(paths),
        imageData: imageData || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "users", user.uid, "sketches"), newSketch);
      setSketchTitle('');
      fetchHistory();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSketch = async (sketch: Sketch) => {
    try {
      const paths = JSON.parse(sketch.paths);
      canvasRef.current?.clearCanvas();
      setTimeout(() => {
        canvasRef.current?.loadPaths(paths);
      }, 100);
      setShowHistory(false);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  const colors = [
    { name: 'Onyx', value: '#0f172a' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Crimson', value: '#991b1b' },
    { name: 'Cobalt', value: '#1e40af' },
    { name: 'Emerald', value: '#065f46' },
    { name: 'Sand', value: '#d97706' },
  ];

  const changePage = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= 10) return;

    const currentPaths = await canvasRef.current?.exportPaths();
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], paths: currentPaths || [] };

    if (newIndex >= updatedPages.length) {
      updatedPages.push({ id: newIndex + 1, paths: [] });
    }

    setPages(updatedPages);
    setCurrentPageIndex(newIndex);
    
    canvasRef.current?.clearCanvas();
    if (updatedPages[newIndex].paths.length > 0) {
      setTimeout(() => {
        canvasRef.current?.loadPaths(updatedPages[newIndex].paths);
      }, 10);
    }
  };

  const handleExport = async () => {
    const dataUrl = await canvasRef.current?.exportImage('png');
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `boceto-estratégico-p${currentPageIndex + 1}.png`;
      link.click();
    }
  };

  const currentStrokeColor = `${strokeColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-[#F4F4F5] z-[60] flex flex-col overflow-hidden">
      {/* Background Texture & Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '32px 32px' }} 
      />
      
      {/* Canvas Area - Creative Stage */}
      <div className="flex-1 relative overflow-auto p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-w-fit min-h-fit mx-auto relative group"
        >
          <div className="w-[1200px] h-[1600px] md:w-[1600px] md:h-[2000px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[4px] relative overflow-hidden ring-1 ring-black/5">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={isEraser ? '#ffffff' : currentStrokeColor}
              eraserWidth={eraserWidth}
              canvasColor="transparent"
              className="w-full h-full cursor-crosshair z-10"
              style={{ border: 'none' }}
              allowOnlyPointerType="all"
            />
            
            <div className="absolute top-12 left-12 md:left-16 flex flex-col gap-1 select-none pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-natural-accent">Planify Creative Lab</span>
              <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-natural-accent">Página {currentPageIndex + 1} // Sincronización 2026</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mode Rail (Top Left) */}
      <div className="fixed top-6 left-6 z-[70] flex items-center gap-4">
        <button 
          onClick={() => setMode('full')}
          className="h-12 w-12 bg-white/80 backdrop-blur-xl border border-natural-border shadow-xl rounded-2xl flex items-center justify-center text-natural-accent hover:scale-105 transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="bg-white/80 backdrop-blur-xl border border-natural-border px-6 h-12 rounded-2xl shadow-xl items-center gap-4 hidden lg:flex">
          <PenTool className="h-4 w-4 text-natural-accent/40" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-natural-accent">PupiCanvas // Bocetos</h2>
        </div>
      </div>

      {/* Save Action Rail (Top Center) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2">
        <div className="bg-white/90 backdrop-blur-xl border border-natural-border p-1.5 rounded-2xl shadow-2xl flex items-center gap-2">
          <input 
            value={sketchTitle}
            onChange={(e) => setSketchTitle(e.target.value)}
            placeholder="Título..."
            className="bg-natural-bg/50 border-none rounded-xl px-3 h-9 text-[10px] font-bold uppercase tracking-widest w-24 sm:w-48 md:w-64 focus:ring-1 focus:ring-natural-accent/20"
          />
          <Button 
            size="sm"
            disabled={!sketchTitle.trim() || isSaving}
            onClick={handleSave}
            className="h-9 px-3 sm:px-4 rounded-xl bg-natural-accent text-white text-[9px] font-black uppercase tracking-widest"
          >
            {isSaving ? <Clock className="h-3.5 w-3.5 animate-spin sm:mr-2" /> : <Save className="h-3.5 w-3.5 sm:mr-2" />}
            <span className="hidden sm:inline">Guardar</span>
          </Button>
        </div>
      </div>

      {/* History Toggle (Top Right) */}
      <div className="fixed top-6 right-6 z-[70]">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "h-12 w-12 md:w-auto md:px-6 bg-white border border-natural-border shadow-xl rounded-2xl flex items-center justify-center md:gap-3 transition-all",
            showHistory ? "bg-natural-accent text-white" : "text-natural-accent hover:bg-natural-bg"
          )}
        >
          <History className="h-5 w-5" />
          <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">Mis Bocetos</span>
        </button>
      </div>

      {/* Floating Vertical Palette (Right Rail) */}
      <motion.div 
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-[70] flex flex-col gap-4"
      >
        <div className="bg-white/90 backdrop-blur-2xl border border-natural-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2.5 rounded-[32px] flex flex-col gap-2">
          <button 
            onClick={() => setIsEraser(false)}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group relative",
              !isEraser ? "bg-natural-accent text-white shadow-lg" : "text-natural-accent/40 hover:bg-natural-bg"
            )}
          >
            <PenTool className="h-5 w-5" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-natural-accent text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Lápiz</span>
          </button>
          <button 
            onClick={() => setIsEraser(true)}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group relative",
              isEraser ? "bg-natural-accent text-white shadow-lg" : "text-natural-accent/40 hover:bg-natural-bg"
            )}
          >
            <Eraser className="h-5 w-5" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-natural-accent text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Borrador</span>
          </button>

          <div className="h-px bg-natural-border/30 mx-2 my-1" />

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group relative",
              showSettings ? "bg-natural-accent/5 text-natural-accent border border-natural-accent/20" : "text-natural-accent/40 hover:bg-natural-bg"
            )}
          >
            <Settings2 className="h-5 w-5" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-natural-accent text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Ajustes</span>
          </button>

          <button onClick={handleExport} className="h-12 w-12 rounded-2xl flex items-center justify-center text-natural-accent/40 hover:bg-natural-bg transition-colors group relative">
            <Download className="h-5 w-5" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-natural-accent text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Exportar</span>
          </button>

          <button 
            onClick={() => canvasRef.current?.clearCanvas()} 
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors group relative"
          >
            <Trash2 className="h-5 w-5" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Limpiar</span>
          </button>
        </div>

        {/* Page Nav Rail */}
        <div className="bg-white/90 backdrop-blur-2xl border border-natural-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 rounded-[28px] flex flex-col gap-2">
          <button 
            onClick={() => changePage(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-natural-bg disabled:opacity-10 transition-all text-natural-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 flex items-center justify-center text-[11px] font-black text-natural-accent bg-natural-bg rounded-xl">
            {currentPageIndex + 1}
          </div>
          <button 
            onClick={() => changePage(currentPageIndex + 1)}
            disabled={currentPageIndex === 9}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-natural-bg disabled:opacity-10 transition-all text-natural-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white/95 backdrop-blur-2xl border-l border-natural-border z-[100] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="p-8 border-b border-natural-bg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-serif italic text-natural-accent">Tu Galería</h3>
                <button onClick={() => setShowHistory(false)} className="text-natural-text/40 hover:text-natural-accent">
                  Cerrar
                </button>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-natural-text/40">Historial de bocetos guardados</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {savedSketches.map(sketch => (
                <button
                  key={sketch.id}
                  onClick={() => loadSketch(sketch)}
                  className="w-full group text-left space-y-3 p-4 bg-white border border-natural-border/30 rounded-3xl hover:border-natural-accent/40 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/5] bg-natural-bg/30 rounded-2xl overflow-hidden border border-natural-border/10">
                    <img src={sketch.imageData} alt={sketch.title} className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-natural-accent line-clamp-1">{sketch.title}</h4>
                    <p className="text-[8px] text-natural-text/40 font-mono mt-1">
                      {new Date(sketch.createdAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </button>
              ))}
              {savedSketches.length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <PenTool className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay bocetos aún</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Settings Context Menu */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="fixed right-24 top-1/2 -translate-y-1/2 w-80 z-[80]"
          >
            <Card className="p-8 border-natural-accent/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] bg-white/98 backdrop-blur-3xl space-y-8 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-natural-accent" />
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent">Calibre de Punta</label>
                  <span className="px-3 py-1 bg-natural-bg rounded-full text-[9px] font-mono text-natural-accent font-black">
                    {isEraser ? eraserWidth : strokeWidth}PT
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max={isEraser ? "120" : "60"} 
                  value={isEraser ? eraserWidth : strokeWidth}
                  onChange={(e) => isEraser ? setEraserWidth(parseInt(e.target.value)) : setStrokeWidth(parseInt(e.target.value))}
                  className="w-full accent-natural-accent h-1.5 bg-natural-bg rounded-full appearance-none cursor-pointer"
                />
              </div>

              {!isEraser && (
                <>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent">Densidad de Pigmento</label>
                      <span className="px-3 py-1 bg-natural-bg rounded-full text-[9px] font-mono text-natural-accent font-black">
                        {Math.round(opacity * 100)}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-natural-accent h-1.5 bg-natural-bg rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-natural-accent">Paleta Arquitectónica</label>
                    <div className="grid grid-cols-6 gap-3">
                      {colors.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setStrokeColor(c.value)}
                          className={cn(
                            "h-8 w-8 rounded-xl border-2 transition-all flex items-center justify-center",
                            strokeColor === c.value ? "border-natural-accent scale-110 shadow-lg ring-4 ring-natural-accent/5" : "border-transparent"
                          )}
                          style={{ backgroundColor: c.value }}
                        >
                          {strokeColor === c.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4 flex flex-col gap-3">
                <div className="p-4 bg-natural-bg/50 rounded-2xl border border-natural-border/30">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-natural-accent/40 text-center">
                    Sincronización de boceto en tiempo real habilitada
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Bottom Status (Mobile optimized) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-[70]">
         <div className="bg-natural-accent text-white px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
            <PenTool className="h-3 w-3" />
            MODO EDICIÓN P{currentPageIndex + 1}
         </div>
      </div>
    </div>
  );
}
