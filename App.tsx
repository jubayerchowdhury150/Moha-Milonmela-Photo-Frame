import React, { useState, useRef, useEffect } from 'react';
import { PhotoState, FrameState } from './types';
import { INITIAL_PHOTO_STATE, PLACEHOLDER_FRAME } from './constants';
import CanvasEditor from './components/CanvasEditor';
import { MoveIcon, RotateIcon, UploadIcon, DownloadIcon } from './components/Icons';

const App: React.FC = () => {
  const [photo, setPhoto] = useState<PhotoState>(INITIAL_PHOTO_STATE);
  const [frame, setFrame] = useState<FrameState>({ src: null });
  const [frameError, setFrameError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

  // Initialize with placeholder frame on mount
  useEffect(() => {
    if (PLACEHOLDER_FRAME) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Crucial for Google Drive images
        img.referrerPolicy = "no-referrer"; // Helps with Google Drive hotlinking
        
        // Add timestamp to bypass cache completely
        const srcWithCacheBust = `${PLACEHOLDER_FRAME}=s0?t=${Date.now()}`; // =s0 requests original size from lh3
        img.src = srcWithCacheBust;

        img.onload = () => {
            setFrame({ 
                src: srcWithCacheBust,
                width: img.width,
                height: img.height 
            });
            setFrameError(null);
        };
        img.onerror = (e) => {
            const msg = "Failed to load default frame. CORS restrictions may apply.";
            console.warn(msg);
            setFrameError(msg);
        };
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'frame') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (type === 'photo') {
          setPhoto({ ...INITIAL_PHOTO_STATE, src: result });
        } else {
          // Load frame to get dimensions for auto-resizing canvas
          const img = new Image();
          img.onload = () => {
             setFrame({ 
                 src: result,
                 width: img.width,
                 height: img.height
             });
             setFrameError(null);
          };
          img.src = result;
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      try {
        const link = document.createElement('a');
        link.download = 'framed-masterpiece.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      } catch (e) {
        alert("Could not export image. This usually happens if the frame image is blocked by browser security rules. Please try uploading the frame manually.");
        console.error("Export failed:", e);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 z-10 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h1 className="text-sm md:text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden text-ellipsis">
            মিলনমেলা ২০২৬
          </h1>
        </div>
      </header>

      {/* Main Workspace */}
      {/* Mobile: Flex-col (Canvas Top, Sidebar Bottom) */}
      {/* Desktop: Flex-row-reverse (Sidebar Left, Canvas Right) via DOM ordering */}
      <main className="flex-1 flex flex-col md:flex-row-reverse overflow-hidden relative">
        
        {/* Canvas Area - Top on Mobile, Right on Desktop */}
        <div className="flex-1 bg-[#0f1115] p-4 md:p-10 flex flex-col items-center justify-center relative overflow-hidden gap-4">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{
                     backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                     backgroundSize: '24px 24px'
                 }}>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative z-0">
                <CanvasEditor 
                    photo={photo}
                    frame={frame}
                    setPhoto={setPhoto}
                    onCanvasReady={(canvas) => { canvasRef.current = canvas; }}
                />
                 {/* Floating Hint */}
                {photo.src && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-[10px] md:text-xs py-1 px-3 rounded-full pointer-events-none border border-white/10 whitespace-nowrap z-10">
                        Drag photo to adjust position
                    </div>
                )}
            </div>
            
            {/* Download Button */}
            <div className="z-20 shrink-0 pb-2 md:pb-0">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3 rounded-full text-base font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 ring-2 ring-white/10"
                >
                  <DownloadIcon />
                  Download Photo
                </button>
            </div>
        </div>

        {/* Sidebar Controls - Bottom on Mobile, Left on Desktop */}
        <aside className="w-full md:w-80 bg-gray-900 border-t md:border-t-0 md:border-r border-gray-800 flex flex-col overflow-y-auto custom-scrollbar z-20 shrink-0 max-h-[50vh] md:max-h-full">
          
          {/* Section: Uploads */}
          <div className="p-6 border-b border-gray-800 space-y-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. Upload Assets</h2>
            
            {/* Upload Photo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex justify-between">
                  <span>Base Photo</span>
                  {photo.src && <span className="text-xs text-green-400">Active</span>}
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group h-24 md:h-32 relative overflow-hidden ${photo.src ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 hover:border-indigo-400 hover:bg-gray-800'}`}
              >
                {photo.src ? (
                    <img src={photo.src} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                ) : null}
                <UploadIcon />
                <span className="text-xs text-gray-400 mt-2 z-10 relative font-medium shadow-sm">
                  {photo.src ? 'Change Photo' : 'Upload Photo'}
                </span>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'photo')} 
                />
              </div>
            </div>

            {/* Upload Frame */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex justify-between">
                  <span>Frame Overlay</span>
                  {frame.src && <span className="text-xs text-green-400">Active</span>}
              </label>
              <div 
                onClick={() => frameInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group h-24 md:h-32 relative overflow-hidden ${frame.src ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 hover:border-indigo-400 hover:bg-gray-800'}`}
              >
                {frame.src ? (
                    <img src={frame.src} alt="Preview" className="absolute inset-0 w-full h-full object-contain opacity-60 group-hover:opacity-50 transition-opacity p-2" />
                ) : null}
                <UploadIcon />
                <span className="text-xs text-gray-400 mt-2 z-10 relative font-medium shadow-sm">
                  {frame.src ? 'Change Frame' : 'Upload Frame'}
                </span>
                <input 
                  ref={frameInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'frame')} 
                />
              </div>
              {frameError && (
                  <p className="text-[10px] text-red-400 mt-1 bg-red-900/20 p-1 rounded border border-red-800">
                      {frameError}. Try uploading it manually.
                  </p>
              )}
            </div>
          </div>

          {/* Section: Adjustments */}
          <div className="p-6 space-y-6 opacity-100 pb-10 md:pb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Adjust Photo</h2>
                {photo.src && (
                    <button 
                        onClick={() => setPhoto(prev => ({...prev, x: 0, y: 0, scale: 1, rotation: 0}))}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                    >
                        Reset Position
                    </button>
                )}
              </div>
              
              {photo.src ? (
                <>
                  {/* Scale */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-400 flex items-center gap-1"><MoveIcon /> Zoom / Scale</label>
                      <span className="text-xs font-mono text-indigo-400">{Math.round(photo.scale * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="4" 
                      step="0.1" 
                      value={photo.scale}
                      onChange={(e) => setPhoto(p => ({ ...p, scale: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Rotate */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-gray-400 flex items-center gap-1"><RotateIcon /> Rotate</label>
                        <span className="text-xs font-mono text-indigo-400">{Math.round(photo.rotation)}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      step="1" 
                      value={photo.rotation}
                      onChange={(e) => setPhoto(p => ({ ...p, rotation: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </>
              ) : (
                  <div className="text-xs text-gray-600 text-center py-4 bg-gray-800/50 rounded-lg border border-gray-800">
                      Upload a photo to enable adjustments
                  </div>
              )}
          </div>

        </aside>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 p-3 text-center shrink-0 z-30">
        <p className="text-gray-500 text-sm font-medium">
          তালমা নাজিমুদ্দিন হাই স্কুল মহা মিলনমেলা ২০২৬
        </p>
      </footer>
      
    </div>
  );
};

export default App;