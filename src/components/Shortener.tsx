import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, Zap, Copy, Check, Trash2, ExternalLink, Globe, AlertCircle, Eye } from 'lucide-react';
import { ShortLinkItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Shortener({ onPlay, onSuccess }: { onPlay: (url: string) => void, onSuccess?: () => void }) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ShortLinkItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tourl_short_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse shortener history', e);
      }
    }
  }, []);

  const saveHistory = (newHistory: ShortLinkItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('tourl_short_history', JSON.stringify(newHistory));
    if (onSuccess) onSuccess();
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, customCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate short link');
      }

      const newItem: ShortLinkItem = {
        id: Math.random().toString(36).substring(2, 9),
        originalUrl: data.data.originalUrl,
        shortUrl: data.data.shortUrl,
        code: data.data.code,
        timestamp: Date.now(),
      };

      saveHistory([newItem, ...history]);
      setUrl('');
      setCustomCode('');
    } catch (err: any) {
      setError(err.message || 'SYSTEM ERROR: Link generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('SYSTEM PROMPT: Initialize data wipe for short links?')) {
      saveHistory([]);
    }
  };

  const handleRemoveItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 px-2 sm:px-0">
      
      {/* Generator Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-black/60 border border-white/10 rounded-[32px] p-6 md:p-10 relative shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
            <Link2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Pemendek URL</h2>
            <p className="text-zinc-400 text-[15px] mt-1">Buat tautan ringkas dan mudah dibagikan secara instan.</p>
          </div>
        </div>

        <form onSubmit={handleShorten} className="space-y-6 relative z-10">
          <div className="space-y-5">
            <div>
              <label className="text-[13px] uppercase tracking-wider font-bold text-zinc-400 ml-1">URL Tujuan</label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium text-[15px] shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] uppercase tracking-wider font-bold text-zinc-400 ml-1">Alias Kustom (Opsional)</label>
              <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all mt-2 shadow-inner">
                <span className="flex items-center px-5 bg-black/40 border-r border-white/10 text-zinc-500 text-[15px] font-bold shrink-0 select-none">
                  /
                </span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                  placeholder="link-kustom-saya"
                  className="w-full bg-transparent px-4 py-4 text-white focus:outline-none placeholder:text-zinc-600 font-medium text-[15px]"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-red-200 font-medium text-sm">{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!url || isGenerating}
            className="w-full btn-primary py-4 mt-2 sm:text-base text-sm"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Hasilkan Link
                <Zap className="w-4 h-4" />
              </div>
            )}
          </button>
        </form>
      </motion.div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="w-full mt-12 bg-black/60 border border-white/10 rounded-[32px] p-6 lg:p-8 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">Pustaka Link</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Tautan pendek yang Anda buat</p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[11px] font-bold text-red-500 hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
            )}
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black/60 border border-white/10 p-5 rounded-[24px] hover:border-white/20 transition-colors shadow-lg group relative"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                    
                    <div className="flex-1 min-w-0 w-full space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktif
                        </span>
                        <span className="text-zinc-500 text-[11px] font-medium tracking-wide">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: localeId })}
                        </span>
                      </div>
                      <h3 className="text-zinc-400 text-[13px] truncate" title={item.originalUrl}>
                        {item.originalUrl}
                      </h3>
                      
                      <div className="flex items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden w-full md:w-max focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/5 transition-all">
                        <div className="px-3 py-2 border-r border-white/10 bg-white/5 text-zinc-400">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <input 
                          type="text" 
                          readOnly 
                          value={item.shortUrl} 
                          className="bg-transparent text-[13px] font-mono font-medium text-white px-4 py-2.5 w-full md:w-72 outline-none"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                      <button
                        onClick={() => handleCopy(item.shortUrl, item.id)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 p-3.5 md:p-3 rounded-xl transition-all border ${
                          copiedId === item.id
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                        }`}
                        title="Salin URL"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => onPlay(item.originalUrl)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-3.5 md:p-3 bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-xl transition-colors"
                        title="Pratinjau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center p-3.5 md:p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all border border-transparent"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
