import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem } from '../types';
import { Copy, Check, Trash2, ExternalLink, Database, FileImage, FileVideo, File, Link2, Layers, Eye, FileArchive, FileCode, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface HistoryProps {
  items: HistoryItem[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onPlay: (url: string, type?: string) => void;
}

export default function History({ items, onClear, onRemove, onPlay }: HistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-6 h-6 text-indigo-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-6 h-6 text-blue-500" />;
    if (type.includes('zip') || type.includes('archive') || type.includes('rar') || type.includes('7z')) return <FileArchive className="w-6 h-6 text-amber-500" />;
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css') || type.includes('typescript') || type.includes('text/x-')) return <FileCode className="w-6 h-6 text-emerald-500" />;
    if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) return <FileText className="w-6 h-6 text-sky-500" />;
    return <File className="w-6 h-6 text-zinc-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUrls = (item: HistoryItem) => {
    if (item.files && item.files.length > 0) {
      return item.files.map(f => f.result.url).join('\n');
    }
    return item.result?.url || '';
  };

  const getTitle = (item: HistoryItem) => {
    if (item.files && item.files.length > 0) {
      if (item.files.length === 1) return item.files[0].originalName;
      return `Unggahan Massal (${item.files.length} file)`;
    }
    return item.originalName || 'File Tidak Dikenal';
  };

  const getTotalSize = (item: HistoryItem) => {
    if (item.files && item.files.length > 0) {
      return item.files.reduce((acc, f) => acc + f.size, 0);
    }
    return item.size || 0;
  };

  const getIcon = (item: HistoryItem) => {
    if (item.files && item.files.length > 1) {
      return <Layers className="w-6 h-6 text-zinc-600" />;
    }
    const type = item.files && item.files.length > 0 ? item.files[0].type : (item.type || '');
    return getFileIcon(type);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-10 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">
            Riwayat Upload
          </h2>
          <span className="bg-white/10 text-zinc-300 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
            {items.length} Entri
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Semua
        </button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const urls = getUrls(item);
            const isBatch = item.files && item.files.length > 1;
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-black/60 border border-white/10 p-4 sm:p-5 rounded-[24px] hover:border-white/20 transition-colors shadow-2xl relative group"
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative z-10">
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                      {getIcon(item)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-bold truncate mb-1.5 text-[15px]" title={getTitle(item)}>
                        {getTitle(item)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-medium text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border border-blue-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          BERHASIL
                        </span>
                        <span>{formatSize(getTotalSize(item))}</span>
                        <span className="text-zinc-700">•</span>
                        <span>{formatDistanceToNow(item.timestamp, { addSuffix: true, locale: id })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <div className="flex bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/5 transition-all">
                      <div className="px-3 py-2 border-r border-white/10 bg-white/5 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-zinc-400" />
                      </div>
                      <textarea 
                        readOnly 
                        value={urls} 
                        rows={isBatch ? Math.min(item.files!.length, 3) : 1}
                        className="bg-transparent text-[13px] font-mono text-zinc-300 px-3 py-2.5 w-full md:w-48 outline-none resize-none whitespace-pre"
                        style={{ lineHeight: '1.5' }}
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(urls, item.id)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 p-3 sm:p-2.5 rounded-xl transition-all border ${
                          copiedId === item.id
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                        }`}
                        title="Salin URL"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      {!isBatch && (
                        <button
                          onClick={() => {
                            const type = item.files && item.files.length > 0 ? item.files[0].type : item.type;
                            onPlay(urls, type);
                          }}
                          className="flex-1 sm:flex-none p-3 sm:p-2.5 bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-xl transition-colors flex items-center justify-center"
                          title="Pratinjau Media"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onRemove(item.id)}
                        className="flex-1 sm:flex-none p-3 sm:p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all border border-transparent flex items-center justify-center"
                        title="Hapus Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
