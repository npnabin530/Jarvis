import React, { useEffect, useRef } from 'react';

interface ArcReactorProps {
  isActive: boolean;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  analyser: AnalyserNode | null;
}

const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, isAiSpeaking, isUserSpeaking, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

    const draw = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Get audio data if available
      let averageVolume = 0;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        averageVolume = sum / dataArray.length; // 0 - 255
      }

      // Base rotation
      const rotation = time * 0.001;
      
      // Dynamic Pulse
      const pulse = isActive ? (averageVolume / 255) * 20 : 0;
      const baseRadius = 120;
      
      // Color
      const primaryColor = isAiSpeaking ? '#00ffff' : isUserSpeaking ? '#00ffaa' : isActive ? '#00cccc' : '#334455';
      const glowColor = isAiSpeaking ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 204, 204, 0.2)';

      // Outer Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = glowColor;
      ctx.stroke();

      // Dashed Ring 1
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius - 15 + pulse * 0.5, 0, Math.PI * 2);
      ctx.setLineDash([20, 10]);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Inner Rotating Ring (Counter)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotation * 1.5);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius - 40 + pulse * 0.3, 0, Math.PI * 2);
      ctx.setLineDash([5, 15]);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, (baseRadius - 70) + (pulse * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = isActive ? `rgba(0, 255, 255, ${0.1 + (averageVolume / 400)})` : 'rgba(0,0,0,0)';
      ctx.fill();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tech details/lines
      if (isActive) {
        ctx.fillStyle = primaryColor;
        ctx.font = '10px monospace';
        ctx.fillText(`SYS.MONITOR // ${Math.floor(averageVolume)}`, centerX - 40, centerY + baseRadius + 40);
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, [isActive, isAiSpeaking, isUserSpeaking, analyser]);

  return (
    <div className="relative w-[400px] h-[400px] flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="w-full h-full z-10"
      />
      <div className={`absolute inset-0 rounded-full bg-cyan-500/5 blur-3xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
    </div>
  );
};

export default ArcReactor;
