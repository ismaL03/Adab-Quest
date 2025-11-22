
import React, { useEffect, useRef } from 'react';

interface GuildSectionProps {
    onJoinRaid: () => void;
    hasJoined: boolean;
}

export const GuildSection: React.FC<GuildSectionProps> = ({ onJoinRaid, hasJoined }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation "Truc de fou" : Une sphère rotative de points connectés
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const stars: {x: number, y: number, z: number, size: number}[] = [];
    const numStars = 150;
    
    for(let i=0; i<numStars; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 150; // Radius
      stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: Math.random() * 1.5 + 0.5
      });
    }

    let angle = 0;
    let rotationSpeed = 0.005;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      
      if (hasJoined) {
          rotationSpeed = 0.015; // S'accélère si rejoint
      } else {
          rotationSpeed = 0.005;
      }
      angle += rotationSpeed;

      // Sort stars by depth for rendering order
      const projectedStars = stars.map(star => {
        // Rotate Y
        const x1 = star.x * Math.cos(angle) - star.z * Math.sin(angle);
        const z1 = star.z * Math.cos(angle) + star.x * Math.sin(angle);
        
        // Project 3D to 2D
        const scale = 400 / (400 + z1);
        return {
          x: x1 * scale + cx,
          y: star.y * scale + cy,
          z: z1,
          scale: scale,
          size: star.size
        };
      }).sort((a, b) => a.z - b.z);

      // Draw Connections (Constellation lines)
      ctx.strokeStyle = hasJoined ? 'rgba(34, 211, 238, 0.25)' : 'rgba(217, 119, 6, 0.15)'; 
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < projectedStars.length; i++) {
        for (let j = i + 1; j < projectedStars.length; j++) {
             const d = Math.hypot(projectedStars[i].x - projectedStars[j].x, projectedStars[i].y - projectedStars[j].y);
             if (d < 50 && projectedStars[i].scale > 0.8) {
                 ctx.moveTo(projectedStars[i].x, projectedStars[i].y);
                 ctx.lineTo(projectedStars[j].x, projectedStars[j].y);
             }
        }
      }
      ctx.stroke();

      // Draw Stars
      projectedStars.forEach(p => {
        const alpha = (p.z + 150) / 300; // Fade out back stars
        ctx.fillStyle = hasJoined ? `rgba(34, 211, 238, ${alpha})` : `rgba(251, 191, 36, ${alpha})`; 
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.scale * (hasJoined ? 2.5 : 2), 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    }
  }, [hasJoined]);

  return (
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Canvas Background */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full p-6 pointer-events-none">
         <div className="text-center mt-4">
            <h2 className="text-3xl text-amber-100 font-serif glow-text">La Constellation</h2>
            <p className="text-cyan-400 text-xs tracking-widest uppercase mt-2">Guilde : Les Gardiens de l'Aube</p>
         </div>

         <div className="flex-1 flex flex-col justify-center items-center pointer-events-auto">
            {/* Center Data */}
            <div className={`backdrop-blur-md border p-6 rounded-full w-64 h-64 flex flex-col items-center justify-center text-center transition-all duration-1000 ${hasJoined ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.3)]' : 'bg-slate-900/80 border-amber-500/30 shadow-[0_0_50px_rgba(217,119,6,0.1)]'}`}>
               <span className="text-slate-400 text-xs uppercase">Impact Collectif</span>
               <span className="text-4xl font-bold text-white font-serif mt-1">12,450</span>
               <span className="text-amber-500 text-sm mb-4">Hasanat cette semaine</span>
               
               <button 
                 onClick={onJoinRaid}
                 disabled={hasJoined}
                 className={`px-6 py-2 rounded-full text-xs uppercase tracking-wider transition-all duration-500 border ${
                    hasJoined 
                    ? 'bg-transparent border-cyan-500 text-cyan-400 cursor-default' 
                    : 'bg-cyan-700/50 hover:bg-cyan-600 text-cyan-100 border-cyan-500/30 hover:scale-105'
                 }`}
               >
                 {hasJoined ? 'Raid Rejoint' : 'Rejoindre le Raid'}
               </button>
            </div>
         </div>

         <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-800 p-4 pointer-events-auto">
           <h3 className="text-amber-500 font-serif mb-3">Dernières actions de la Guilde</h3>
           <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-slate-300">Mehdi a complété <span className="text-white">Prière à l'heure</span></span>
             </div>
             <div className="flex items-center gap-3 text-sm">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-slate-300">Sarah a lu <span className="text-white">Sourate Al-Mulk</span></span>
             </div>
             {hasJoined && (
                <div className="flex items-center gap-3 text-sm animate-fade-in">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]"></div>
                    <span className="text-cyan-200">Karim a rejoint le Raid !</span>
                </div>
             )}
             <div className="flex items-center gap-3 text-sm">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
               <span className="text-slate-300">Raid "Quartier Propre" en cours...</span>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};
