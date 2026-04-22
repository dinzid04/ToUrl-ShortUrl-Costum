import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Image as ImageIcon, ExternalLink, Download } from 'lucide-react';

interface MediaPlayerProps {
  url: string;
  type?: string; 
  onClose: () => void;
}

export default function MediaPlayer({ url, type, onClose }: MediaPlayerProps) {
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVideo(type.startsWith('video/'));
    } else {
      // Guess from extension if possible, otherwise assume image initially
      const lowerUrl = url.toLowerCase();
      setIsVideo(
        lowerUrl.endsWith('.mp4') || 
        lowerUrl.endsWith('.webm') || 
        lowerUrl.endsWith('.ogg') ||
        lowerUrl.endsWith('.mov')
      );
    }
  }, [url, type]);

  const handleMediaLoad = () => {
    setLoading(false);
  };

  const handleMediaError = () => {
    setError(true);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50"
        >
          <X className="w-6 h-6" />
        </button>

          <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[85vh] bg-black/60 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              {isVideo ? (
                <PlayCircle className="w-5 h-5 text-zinc-400" />
              ) : (
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              )}
              <h3 className="text-zinc-200 font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-md tracking-wide">
                Penampil Media
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={url} 
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium transition-colors shadow-inner"
                title="Unduh langsung"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh</span>
              </a>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium transition-colors shadow-inner"
                title="Buka di tab baru"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Media Player Area */}
          <div className="relative flex-1 flex items-center justify-center bg-black/80 min-h-[300px] overflow-hidden custom-scrollbar">
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                 <div className="w-12 h-12 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                 <span className="text-zinc-400 text-sm font-mono tracking-widest uppercase">Memuat Media...</span>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-black/50 backdrop-blur-sm z-10">
                <X className="w-12 h-12 mb-4 text-red-400/80" />
                <p className="text-zinc-300 font-medium tracking-wide">Gagal memuat media.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-blue-400 hover:text-blue-300 text-sm font-medium transition-all">
                  Buka sumber langsung
                </a>
              </div>
            )}

            {isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
                className={`w-full h-full object-contain transition-opacity duration-700 ease-out border-none outline-none ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              />
            ) : (
              <img
                src={url}
                alt="Media Preview"
                onLoad={handleMediaLoad}
                onError={handleMediaError}
                className={`w-full h-full object-contain transition-all duration-700 ease-out drop-shadow-2xl ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
