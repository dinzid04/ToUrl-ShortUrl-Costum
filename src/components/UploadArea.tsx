import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, File, Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadResult } from '../types';

interface UploadAreaProps {
  onUploadSuccess: (files: File[], results: any[]) => void;
}

const LOADING_TEXTS = [
  "> MENGHUBUNGKAN SERVER...",
  "> MENGENKRIPSI PAYLOAD...",
  "> MEMUTAR JARINGAN...",
  "> MENGUNGGAH KE NODE CDN...",
  "> MENYELESAIKAN...",
];

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<'private' | 'temporary'>('private');
  const [expireHour, setExpireHour] = useState('0');
  const [provider, setProvider] = useState('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
      }, 1500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleUpload(files);
    }
  }, [storageType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const MAX_FILE_SIZE = Infinity; // No limit

  const handleUpload = async (files: File[]) => {
    const oversized = files.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`File terlalu besar.`);
      return;
    }
    if (files.length > 10) {
      setError(`Maksimal 10 file dalam satu kali upload.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('duration', storageType);
    if (storageType === 'private') {
      formData.append('expireHours', expireHour);
      formData.append('provider', provider);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (response.status === 413) {
          throw new Error('File terlalu besar untuk diproses oleh server.');
        } else if (response.status === 504 || response.status === 500) {
          throw new Error('Upload timeout (500/504). File mungkin terlalu besar atau koneksi node lambat. Coba gunakan Provider lain atau kompres file.');
        }
        console.error("Non-JSON Server Response:", text.substring(0, 1000));
        throw new Error(`Server error (${response.status}): Endpoint tidak mengembalikan JSON. Cek console log / DevTools.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadSuccess(files, data.data);
      
      // Auto-refresh smooth state
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
      
      // Optionally reset dropzone provider to default if needed (left as is for user convenience)
    } catch (err: any) {
      setError(err.message || 'SYSTEM ERROR: Upload sequence failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full relative z-10">
      <div className="flex flex-col sm:flex-row bg-zinc-950/60 border border-white/10 p-1.5 rounded-2xl w-full mb-8 shadow-[0_0_15px_rgba(0,0,0,0.1)] relative gap-1">
        <button
          onClick={() => setStorageType('private')}
          disabled={isUploading}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl font-medium transition-all duration-200 relative ${
            storageType === 'private'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {storageType === 'private' && (
             <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl" />
          )}
          <span className="text-[13px] sm:text-[15px] z-10 tracking-wide font-semibold">Private Server</span>
          
          <div className="z-10 mt-1 h-5 flex flex-wrap items-center justify-center gap-1">
            {storageType === 'private' ? (
              <>
                <select 
                   value={expireHour}
                   onChange={(e) => setExpireHour(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
                   className="text-[10px] sm:text-[11px] w-auto bg-black/30 border border-white/20 rounded-md outline-none text-blue-300 px-2 py-0.5 cursor-pointer hover:bg-black/50 transition-colors"
                 >
                   <option value="0" className="bg-zinc-900">Perpetual</option>
                   <option value="1" className="bg-zinc-900">Exp 1 Jam</option>
                   <option value="12" className="bg-zinc-900">Exp 12 Jam</option>
                   <option value="24" className="bg-zinc-900">Exp 24 Jam</option>
                   <option value="168" className="bg-zinc-900">Exp 7 Hari</option>
                </select>
                <select 
                   value={provider}
                   onChange={(e) => setProvider(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
                   className="text-[10px] sm:text-[11px] w-auto bg-black/30 border border-white/20 rounded-md outline-none text-blue-300 px-2 py-0.5 cursor-pointer hover:bg-black/50 transition-colors"
                 >
                   <option value="auto" className="bg-zinc-900">Auto Net</option>
                   <option value="telegram" className="bg-zinc-900">DinzTel</option>
                   <option value="cloudsky" className="bg-zinc-900">DinzSky</option>
                   <option value="github" className="bg-zinc-900">DinzHUB</option>
                </select>
              </>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-zinc-500">DCDN Master Network</span>
            )}
          </div>
        </button>

        <button
          onClick={() => setStorageType('temporary')}
          disabled={isUploading}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl font-medium transition-all duration-200 relative ${
            storageType === 'temporary'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {storageType === 'temporary' && (
             <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl" />
          )}
          <span className="text-[13px] sm:text-[15px] z-10 tracking-wide font-semibold">Cloud Sementara</span>
          <div className="z-10 mt-1 h-5 flex items-center justify-center">
            <span className="text-[9px] sm:text-[10px] text-zinc-500">Hapus di 24 Jam</span>
          </div>
        </button>
      </div>

      <div
        className={`relative overflow-hidden rounded-[32px] transition-all duration-300 bg-zinc-900/60 border hover:border-white/20 shadow-2xl shadow-black/20 ${
          isDragging ? 'scale-[1.01] border-blue-500/50 bg-zinc-900/80 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/10'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[360px] relative z-10">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center w-full"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse blur-xl" />
                  <div className="w-24 h-24 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                  </div>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-xl p-5 w-full max-w-sm text-center relative overflow-hidden backdrop-blur-md">
                  <motion.p 
                    key={loadingTextIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-blue-300 font-mono text-[13px] tracking-wider"
                  >
                    {LOADING_TEXTS[loadingTextIndex]}
                  </motion.p>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center w-full"
              >
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border border-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight font-display italic">MENGUDARA</h3>
                <p className="text-zinc-400 text-[15px]">Akses siap dibagikan</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center cursor-pointer group w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 bg-white/5 group-hover:bg-white/10 group-hover:scale-110 rounded-full flex items-center justify-center mb-6 transition-all duration-300 border border-white/10 shadow-lg">
                  <UploadCloud className="w-10 h-10 text-white/70 group-hover:text-white transition-colors" strokeWidth={2} />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                  Upload Media
                </h3>
                <p className="text-zinc-400 text-[15px] mb-8 max-w-[280px] mx-auto leading-relaxed">
                  Tarik & letakkan file di sini, atau klik <br/>
                  <span className="text-zinc-500 text-sm mt-1 block">Bisa upload hingga 10 file sekaligus</span>
                </p>
                
                <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black hover:bg-zinc-200 font-semibold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95">
                  Pilih File
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mt-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 backdrop-blur-md"
          >
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-red-200 font-medium text-sm leading-relaxed">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
