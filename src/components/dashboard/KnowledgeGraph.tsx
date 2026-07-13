import { useEffect, useState, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { motion } from 'motion/react';
import { Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { Note } from '@/src/types';
import { auth } from '@/src/lib/firebase';

interface GraphData {
  nodes: any[];
  links: any[];
}

interface KnowledgeGraphProps {
  notes: Note[];
  aiEngine: string;
  onClose: () => void;
}

export function KnowledgeGraph({ notes, aiEngine, onClose }: KnowledgeGraphProps) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : '';

        const response = await fetch('/api/cerebro/analyze-graph', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': idToken ? `Bearer ${idToken}` : ''
          },
          body: JSON.stringify({ notes, model: aiEngine })
        });
        const graphData = await response.json();
        const safeData = {
          nodes: Array.isArray(graphData.nodes) ? graphData.nodes : [],
          links: Array.isArray(graphData.links) ? graphData.links : []
        };
        setData(safeData);
      } catch (error) {
        console.error('Failed to load graph:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [notes]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-slate-900 z-[100] flex flex-col overflow-hidden transition-all duration-500",
        isFullscreen ? "fixed inset-0" : "relative h-[400px] md:h-[600px] rounded-[32px] border border-slate-800 shadow-2xl"
      )}
    >
      <div className="absolute top-6 left-8 z-10">
        <h3 className="text-white text-xl font-serif italic">Grafo de Conocimiento 3D</h3>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Sincronización Neural Activa</p>
      </div>

      <div className="absolute top-6 right-8 z-10 flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-white/40 hover:text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-white/40 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-natural-accent" />
          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analizando Conexiones Semánticas...</p>
        </div>
      ) : (
        <div className="flex-1">
          <ForceGraph3D
            graphData={data || { nodes: [], links: [] }}
            nodeLabel="label"
            nodeAutoColorBy="group"
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            backgroundColor="#0f172a"
            showNavInfo={false}
          />
        </div>
      )}

      <div className="absolute bottom-6 left-8 z-10 pointer-events-none">
        <div className="flex items-center gap-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
          <span>{data?.nodes?.length || 0} Nodos</span>
          <span>•</span>
          <span>{data?.links?.length || 0} Conexiones</span>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
