import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Download, Undo } from 'lucide-react';

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Listen for remote drawing
    socket?.on('whiteboard-draw', ({ x0, y0, x1, y1, color, brushSize }) => {
      drawLine(ctx, x0, y0, x1, y1, color, brushSize, false);
    });

    socket?.on('whiteboard-clear', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      socket?.off('whiteboard-draw');
      socket?.off('whiteboard-clear');
    };
  }, [socket]);

  const drawLine = (ctx, x0, y0, x1, y1, color, size, emit) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();

    if (emit) {
      socket.emit('whiteboard-draw', {
        x0, y0, x1, y1, color, brushSize: size
      });
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    canvasRef.current.lastX = x;
    canvasRef.current.lastY = y;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    drawLine(
      ctx,
      canvasRef.current.lastX,
      canvasRef.current.lastY,
      x,
      y,
      color,
      brushSize,
      true
    );
    
    canvasRef.current.lastX = x;
    canvasRef.current.lastY = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('whiteboard-clear');
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-700 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <input
          type="range"
          min="1"
          max="10"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-20"
        />
        
        <div className="flex-1" />
        
        <button
          onClick={clearCanvas}
          className="p-2 text-gray-400 hover:text-danger transition-colors"
          title="مسح الكل"
        >
          <Eraser className="w-5 h-5" />
        </button>
        
        <button
          onClick={downloadCanvas}
          className="p-2 text-gray-400 hover:text-primary transition-colors"
          title="تحميل"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-dark-light m-4 rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default Whiteboard;