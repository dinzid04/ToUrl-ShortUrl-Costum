import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Link2, Code2, Settings, ArrowLeft } from 'lucide-react';
import UploadArea from './components/UploadArea';
import History from './components/History';
import ApiDocs from './components/ApiDocs';
import Shortener from './components/Shortener';
import MediaViewer from './components/MediaViewer';
import OnboardingWelcome from './components/OnboardingWelcome';
import { HistoryItem, UploadResult } from './types';

const StatsBar = ({ history, shortHistory }: { history: HistoryItem[], shortHistory: any[] }) => {
  const totalUploads = Array.isArray(history) ? history.reduce((acc, item) => acc + (item.files?.length || 1), 0) : 0;
  const totalShorts = Array.isArray(shortHistory) ? shortHistory.length : 0;
  const totalSize = Array.isArray(history) ? history.reduce((acc, item) => {
    if (item.files) return acc + item.files.reduce((a, f) => a + f.size, 0);
    return acc + (item.size || 0);
  }, 0) : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3 mb-8 px-2 sm:px-0"
    >
      {[
        { label: 'UPLOADS', value: totalUploads, icon: UploadCloud, color: 'text-blue-400' },
        { label: 'LINKS', value: totalShorts, icon: Link2, color: 'text-emerald-400' },
        { label: 'BANDWIDTH', value: formatSize(totalSize), icon: Settings, color: 'text-purple-400' }
      ].map((stat, i) => (
        <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-xl">
          <stat.icon className={`w-4 h-4 mb-2 ${stat.color} opacity-80`} />
          <span className="text-xl font-black text-white font-display leading-none">{stat.value}</span>
          <span className="text-[9px] font-black text-zinc-500 tracking-widest mt-1 uppercase italic">{stat.label}</span>
        </div>
      ))}
    </motion.div>
  );
};

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [shortHistory, setShortHistory] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'upload' | 'shortener' | 'api'>('upload');
  const [mediaPlayer, setMediaPlayer] = useState<{ url: string; type?: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const refreshStats = () => {
    const savedShorts = localStorage.getItem('tourl_short_history');
    if (savedShorts) {
      try {
        const parsed = JSON.parse(savedShorts);
        if (Array.isArray(parsed)) setShortHistory(parsed);
      } catch (e) {}
    }
  };

  // Initialize and persistent data loading
  useEffect(() => {
    // Check onboarding
    if (localStorage.getItem('dcdn_onboarding_shown') !== 'true') {
      setShowOnboarding(true);
    }

    const savedUploads = localStorage.getItem('tourl_history');
    if (savedUploads) {
      try {
        const parsed = JSON.parse(savedUploads);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {}
    }
    refreshStats();

    const params = new URLSearchParams(window.location.search);
    const playUrl = params.get('play');
    if (playUrl) {
      setMediaPlayer({ url: playUrl, type: params.get('type') || undefined });
    }
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMediaPlayer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('tourl_history', JSON.stringify(newHistory));
  };

  const handleUploadSuccess = (files: File[], results: any[]) => {
    const validResults = results.filter(r => r.result);
    if (validResults.length === 0) return;

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      files: validResults.map(r => ({
        originalName: r.originalName,
        size: r.size,
        type: r.type,
        result: r.result
      }))
    };
    
    saveHistory([newItem, ...history]);
    refreshStats();
    setToast({ message: 'Media berhasil diunggah!', type: 'success' });
  };

  const handleClearHistory = () => {
    if (window.confirm('Delete all upload history?')) {
      saveHistory([]);
    }
  };

  const handleRemoveItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen pb-20 bg-black text-white relative selection:bg-blue-500/30 selection:text-white font-sans antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black z-[-1]"></div>
      
      {/* Background Anime Mascot - Polished Positioning */}
      <div className="fixed bottom-0 -right-12 md:-right-20 z-0 pointer-events-none select-none w-80 sm:w-[600px] md:w-[750px] opacity-[0.35] lg:opacity-[0.45] transition-opacity duration-1000 overflow-hidden">
        <img 
          src="https://url.dinzid.my.id/vFdrebv" 
          alt="Mascot Backdrop" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-right-bottom drop-shadow-[0_0_100px_rgba(59,130,246,0.15)] scale-110 translate-y-4 rounded-full mix-blend-screen"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <header className="w-full relative z-20 pt-10 px-6 sm:px-12 flex items-center justify-between pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-5 group pointer-events-auto"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:scale-105 transition-all duration-700 overflow-hidden relative">
             <img src="https://url.dinzid.my.id/KhEKhl5" alt="Logo" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700 opacity-90 mix-blend-screen" referrerPolicy="no-referrer" />
             <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay group-hover:bg-transparent transition-colors" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-[0.8] uppercase font-display drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">DCDN</h1>
            <span className="text-[11px] sm:text-xs font-black text-blue-500 tracking-[0.3em] uppercase mt-1 opacity-80">Dinz ClouDFree</span>
          </div>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-8">
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black tracking-[0.2em] uppercase italic">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse" />
                 Secure Uplink Node
              </div>
              <span className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase mt-0.5">High Performance Sync</span>
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-10 sm:pt-16 px-4 sm:px-6 relative z-10">
        
        {/* Dynamic Nav View */}
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 relative z-10"
          >
            <div className="flex bg-zinc-900/60 border border-white/5 p-2 rounded-[32px] w-full shadow-2xl shadow-black/80 relative backdrop-blur-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <button
                onClick={() => setCurrentView('upload')}
                className={`flex-1 flex items-center justify-center gap-3 py-4.5 rounded-[24px] text-[13px] sm:text-sm font-black transition-all duration-300 relative tracking-widest uppercase italic font-display ${
                  currentView === 'upload' 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {currentView === 'upload' && (
                   <motion.div layoutId="appTab" className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-[24px] shadow-[0_0_30px_rgba(59,130,246,0.1)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />
                )}
                <UploadCloud className={`w-4.5 h-4.5 z-10 transition-all duration-300 ${currentView === 'upload' ? 'scale-110 text-blue-400' : 'opacity-70'}`} />
                <span className="z-10">Media</span>
              </button>
              
              <button
                onClick={() => setCurrentView('shortener')}
                className={`flex-1 flex items-center justify-center gap-3 py-4.5 rounded-[24px] text-[13px] sm:text-sm font-black transition-all duration-300 relative tracking-widest uppercase italic font-display ${
                  currentView === 'shortener' 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {currentView === 'shortener' && (
                   <motion.div layoutId="appTab" className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-[24px] shadow-[0_0_30px_rgba(59,130,246,0.1)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />
                )}
                <Link2 className={`w-4.5 h-4.5 z-10 transition-all duration-300 ${currentView === 'shortener' ? 'scale-110 text-blue-400' : 'opacity-70'}`} />
                <span className="z-10">Shorts</span>
              </button>

              <button
                onClick={() => setCurrentView('api')}
                className={`flex-1 flex items-center justify-center gap-3 py-4.5 rounded-[24px] text-[13px] sm:text-sm font-black transition-all duration-300 relative tracking-widest uppercase italic font-display ${
                  currentView === 'api' 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {currentView === 'api' && (
                   <motion.div layoutId="appTab" className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-[24px] shadow-[0_0_30px_rgba(59,130,246,0.1)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />
                )}
                <Code2 className={`w-4.5 h-4.5 z-10 transition-all duration-300 ${currentView === 'api' ? 'scale-110 text-blue-400' : 'opacity-70'}`} />
                <span className="z-10">Engine</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <StatsBar history={history} shortHistory={shortHistory} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {currentView === 'upload' && (
              <div className="space-y-14">
                <div className="text-center px-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 italic uppercase leading-none font-display drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">CLOUD UPLINK</h2>
                  <p className="text-zinc-500 text-sm sm:text-lg font-bold max-w-xl mx-auto leading-relaxed tracking-wide opacity-80 uppercase italic">Infrastruktur media ultra-cepat dengan protokol redundansi node terenkripsi.</p>
                </div>
                <div className="relative group">
                   <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <UploadArea onUploadSuccess={handleUploadSuccess} />
                </div>
                <History
                  items={history}
                  onClear={handleClearHistory}
                  onRemove={handleRemoveItem}
                  onPlay={(url, type) => setMediaPlayer({ url, type })}
                />
              </div>
            )}
            
            {currentView === 'shortener' && (
              <div className="space-y-14">
                 <div className="text-center px-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 italic uppercase leading-none font-display drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">MINI-HASH</h2>
                  <p className="text-zinc-500 text-sm sm:text-lg font-bold max-w-xl mx-auto leading-relaxed tracking-wide opacity-80 uppercase italic">Generate tautan super ringkas dengan algoritma hash terdistribusi.</p>
                </div>
                <Shortener 
                  onPlay={(url) => setMediaPlayer({ url })} 
                  onSuccess={refreshStats} 
                />
              </div>
            )}

            {currentView === 'api' && (
              <div className="space-y-14">
                <div className="text-center px-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 italic uppercase leading-none font-display drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">ENGINE HUB</h2>
                  <p className="text-zinc-500 text-sm sm:text-lg font-bold max-w-xl mx-auto leading-relaxed tracking-wide opacity-80 uppercase italic">Integrasi API high-performance untuk pengembang aplikasi enterprise.</p>
                </div>
                <ApiDocs />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {mediaPlayer && (
        <MediaViewer 
          url={mediaPlayer.url} 
          type={mediaPlayer.type} 
          onClose={() => setMediaPlayer(null)} 
        />
      )}

      {/* Onboarding Welcome */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWelcome 
            onContinue={() => {
              localStorage.setItem('dcdn_onboarding_shown', 'true');
              setShowOnboarding(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 font-bold text-sm tracking-wide ${
              toast.type === 'success' 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' 
                : 'bg-red-600/20 border-red-500/50 text-red-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-blue-400 animate-pulse' : 'bg-red-400'}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
