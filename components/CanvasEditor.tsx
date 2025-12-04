
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhotoState, FrameState } from '../types';

interface CanvasEditorProps {
  photo: PhotoState;
  frame: FrameState;
  setPhoto: React.Dispatch<React.SetStateAction<PhotoState>>;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  photo, 
  frame, 
  setPhoto, 
  onCanvasReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Image caching to prevent flickering
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);

  // Load Frame Image
  useEffect(() => {
    if (frame.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer"; // Added for Google Drive compatibility
      img.src = frame.src;
      img.onload = () => setFrameImg(img);
    } else {
      setFrameImg(null);
    }
  }, [frame.src]);

  // Load Photo Image
  useEffect(() => {
    if (photo.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photo.src;
      img.onload = () => setPhotoImg(img);
    } else {
      setPhotoImg(null);
    }
  }, [photo.src]);

  // Set Canvas Size based on Frame Aspect Ratio or Default
  useEffect(() => {
    if (canvasRef.current) {
      // Default to square 1080x1080 if no frame dimensions
      let width = 1080;
      let height = 1080;

      if (frame.width && frame.height) {
        // Calculate aspect ratio and fit within a reasonable texture limit while keeping high quality
        // Max dimension 1080
        const maxDim = 1080;
        const ratio = frame.width / frame.height;
        if (frame.width > frame.height) {
             width = maxDim;
             height = maxDim / ratio;
        } else {
             height = maxDim;
             width = maxDim * ratio;
        }
      }

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady, frame.width, frame.height]);

  // Drawing Logic
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill white background (standard for photos)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Photo (Bottom Layer)
    if (photoImg) {
      drawPhotoLayer(ctx, photoImg, photo, canvas.width, canvas.height);
    }

    // 2. Draw Frame (Overlay Layer)
    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    }

  }, [photo, frame, photoImg, frameImg]);


  const drawPhotoLayer = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, p: PhotoState, cw: number, ch: number) => {
    ctx.save();
    // Move to center of canvas + offset
    ctx.translate(cw / 2 + p.x, ch / 2 + p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.scale(p.scale, p.scale);
    // Draw image centered at the new origin
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [draw]);

  // --- Interaction Handlers (Mouse & Touch) ---

  const handlePointerDown = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if(!rect) return;

    // Sensitivity factor based on canvas display size vs actual size
    const sensitivity = canvasRef.current!.width / rect.width; 

    const dx = (clientX - dragStart.x) * sensitivity;
    const dy = (clientY - dragStart.y) * sensitivity;

    setPhoto(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));

    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handlePointerDown(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY);
  const onMouseUp = () => handlePointerUp();

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handlePointerDown(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden relative z-0">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain cursor-move touch-none shadow-2xl"
        style={{ 
            maxWidth: '90%', 
            maxHeight: '90%',
            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: 'white'
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      />
    </div>
  );
};

export default CanvasEditor;
