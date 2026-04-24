import React from 'react';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Video, FileArchive, ArrowRight, UploadCloud, Link as LinkIcon, Code2, CheckCircle2 } from 'lucide-react';

interface OnboardingWelcomeProps {
  onContinue: () => void;
}

export default function OnboardingWelcome({ onContinue }: OnboardingWelcomeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-zinc-950 font-sans antialiased overflow-y-auto selection:bg-blue-500/30"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-black z-[-1]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
      
      <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 mx-auto bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden"
            >
               <img src="https://url.dinzid.my.id/KhEKhl5" alt="Logo" className="w-full h-full object-cover scale-125 opacity-90 mix-blend-screen" referrerPolicy="no-referrer" />
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-4 uppercase italic font-display drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">DCDN</span>
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
              Dinz ClouDFree - Infrastruktur penyimpanan cloud berkecepatan tinggi dengan integrasi API yang mudah dan aman.
            </p>
          </div>

          {/* Features / Supported Files */}
          <div className="mb-16">
            <h2 className="text-xs sm:text-sm font-black tracking-[0.2em] text-blue-500 uppercase text-center mb-8 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-blue-500/30" />
              Dukungan Format File
              <span className="w-12 h-px bg-blue-500/30" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: ImageIcon, label: 'Images', desc: 'PNG, JPG, WEBP, GIF', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { icon: Video, label: 'Videos', desc: 'MP4, WEBM, MKV, AVI', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                { icon: FileText, label: 'Documents', desc: 'PDF, DOCX, TXT', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { icon: FileArchive, label: 'Archives', desc: 'ZIP, RAR, 7Z, TAR', color: 'text-orange-400', bg: 'bg-orange-400/10' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <span className="text-white font-bold text-base mb-1">{item.label}</span>
                  <span className="text-xs text-zinc-500 font-medium">{item.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How to use / Guide */}
          <div className="mb-16">
             <h2 className="text-xs sm:text-sm font-black tracking-[0.2em] text-blue-500 uppercase text-center mb-8 flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-blue-500/30" />
              Cara Penggunaan
              <span className="w-12 h-px bg-blue-500/30" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: UploadCloud, title: 'Upload Media', desc: 'Pilih file, drag & drop, atau paste gambar dari clipboard. Pilih jenis storage yang diinginkan (Private, Temporary, DinzCL).' },
                { icon: LinkIcon, title: 'Shorten Link', desc: 'Dapatkan link pendek dari hasil upload atau gunakan URL eksternal untuk dipendekkan di menu Shorts.' },
                { icon: Code2, title: 'Gunakan API', desc: 'Inkorporasikan DCDN ke aplikasi kamu dengan REST API kami. Dokumentasi tersedia di menu Engine.' },
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex flex-col items-center text-center p-6 bg-zinc-900/50 border border-white/5 rounded-3xl"
                >
                  <div className="w-12 h-12 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center pb-12"
          >
            <button
              onClick={onContinue}
              className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-3xl flex items-center gap-4 overflow-hidden transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="text-lg">Mulai Gunakan App</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
