import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Code2, Play, Copy, Check, ServerCog, Braces } from 'lucide-react';

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python'>('curl');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const snippets = {
    curl: `curl -X POST \\
  -F "file=@/path/to/your/media.jpg" \\
  ${origin}/api/upload`,
    node: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadMedia() {
  const form = new FormData();
  form.append('file', fs.createReadStream('/path/to/media.jpg'));

  try {
    const response = await axios.post('${origin}/api/upload', form, {
      headers: { ...form.getHeaders() }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

uploadMedia();`,
    python: `import requests

url = "${origin}/api/upload"
files = {'file': open('/path/to/media.jpg', 'rb')}

response = requests.post(url, files=files)
print(response.json())`
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippets[activeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestUpload = async () => {
    if (!testFile) return;
    setTestLoading(true);
    setTestResponse(null);

    const formData = new FormData();
    formData.append('file', testFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setTestResponse({ error: err.message || 'Network Error' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      
      {/* Documentation Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
            <ServerCog className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Referensi REST API</h2>
            <p className="text-zinc-400 text-[15px] mt-1">Integrasikan simpanan CDN aman kami langsung ke dalam aplikasi Anda.</p>
          </div>
        </div>

        <div className="mb-10 block">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-lg uppercase tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]">POST</span>
            <code className="text-zinc-300 font-mono text-sm bg-black/50 px-4 py-2 rounded-xl border border-white/10 shadow-inner">/api/upload</code>
          </div>
          <div className="overflow-x-auto bg-white/5 rounded-2xl border border-white/10 p-1">
            <table className="w-full text-left text-sm text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 bg-black/20">
                  <th className="py-4 px-5 font-semibold tracking-wide uppercase text-xs">Parameter</th>
                  <th className="py-4 px-5 font-semibold tracking-wide uppercase text-xs">Tipe</th>
                  <th className="py-4 px-5 font-semibold tracking-wide uppercase text-xs">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 font-mono text-[13px] text-blue-300">files</td>
                  <td className="py-4 px-5 font-medium">File[] (Binary)</td>
                  <td className="py-4 px-5 text-zinc-400">File media (gambar/video) untuk diunggah. Tanpa batas ukuran dari sistem. (Gunakan field 'files', mendukung banyak file).</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 font-mono text-[13px] text-blue-300">duration</td>
                  <td className="py-4 px-5 font-medium">String</td>
                  <td className="py-4 px-5 text-zinc-400">Opsi penyimpanan. Bisa 'private' (GDrive/Catbox) atau 'temporary' (Hapus dalam 24 jam).</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 font-mono text-[13px] text-blue-300">expireHours</td>
                  <td className="py-4 px-5 font-medium">Number (Opsional)</td>
                  <td className="py-4 px-5 text-zinc-400">Jika durasi 'private', jumlah jam sebelum hapus otomatis. 0 = selamanya.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="flex items-center justify-between bg-zinc-800/50 border-b border-zinc-800 px-4">
            <div className="flex gap-2">
              {(['curl', 'node', 'python'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                    activeTab === tab 
                      ? 'text-white border-white bg-white/5' 
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  {tab === 'node' ? 'Node.js' : tab}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Salin Kode"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-sm font-mono text-zinc-300">
              <code>{snippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </motion.div>

      {/* Interactive Tester */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
            <Terminal className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Live Tester</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Area */}
          <div className="space-y-6">
            <div className="bg-black/40 border border-white/10 rounded-[24px] p-6 shadow-inner relative">
              <label className="block text-[13px] uppercase tracking-wider font-bold text-zinc-400 mb-4">
                Pilih Payload
              </label>
              <input
                type="file"
                onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-zinc-400
                  file:mr-5 file:py-3 file:px-6
                  file:rounded-xl file:border file:border-white/10
                  file:text-xs file:font-bold file:uppercase file:tracking-wider
                  file:bg-white/5 file:text-white
                  hover:file:bg-white/10 hover:file:border-white/20 file:transition-all file:shadow-lg
                  cursor-pointer focus:outline-none"
              />
            </div>
            
            <button
              onClick={handleTestUpload}
              disabled={!testFile || testLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95 tracking-wide"
            >
              {testLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Mengeksekusi...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Jalankan Permintaan
                </>
              )}
            </button>
          </div>

          {/* Output Area */}
          <div className="bg-black border border-white/10 rounded-[24px] flex flex-col overflow-hidden h-72 md:h-auto shadow-2xl relative">
            <div className="flex items-center gap-3 bg-white/5 border-b border-white/10 px-5 py-4">
              <Braces className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Respon Payload</span>
            </div>
            <div className="p-6 flex-1 overflow-auto custom-scrollbar">
              {testResponse ? (
                <pre className="text-[13px] font-mono text-emerald-400 leading-relaxed">
                  <code>{JSON.stringify(testResponse, null, 2)}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                  Menunggu Eksekusi...
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
