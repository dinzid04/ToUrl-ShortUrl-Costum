import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { google } from 'googleapis';
import os from 'os';
import * as url from 'url';

export const app = express();
const PORT = 3000;

app.use(express.json());

const uploadDir = os.tmpdir();

const upload = multer({ 
  dest: uploadDir
});

const API_KEY_IMGBB = '39b30df76fd9a15260dfe000fedef40d';

// Load Config
const configPath = path.join(process.cwd(), 'config.json');
let appConfig = {
  SHORTENER_API_URL: 'https://url.dinzid.my.id/add',
  SHORTENER_BASE_URL: 'https://url.dinzid.my.id/'
};
if (fs.existsSync(configPath)) {
  try {
    appConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error('Failed to parse config.json, using defaults.');
  }
}

const REDIRECT_FILE = path.join(process.cwd(), 'redirects.json');
let localRedirects: Record<string, string> = {};
if (fs.existsSync(REDIRECT_FILE)) {
  try { localRedirects = JSON.parse(fs.readFileSync(REDIRECT_FILE, 'utf-8')); } catch {}
}

const saveLocalRedirect = (code: string, url: string) => {
  localRedirects[code] = url;
  fs.writeFileSync(REDIRECT_FILE, JSON.stringify(localRedirects, null, 2));
};

const makeid = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const shorten = async (originalUrl: string) => {
  const code = makeid(7);
  // Default to internal masking if it's a GDrive proxy
  if (originalUrl.includes('/api/drive/stream/')) {
    saveLocalRedirect(code, originalUrl);
    const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
    return `${appUrl}/${code}`;
  }

  // Fallback to external shortener if configured
  try {
    await axios.post(appConfig.SHORTENER_API_URL, { code, url: originalUrl });
    const baseUrl = appConfig.SHORTENER_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/${code}`;
  } catch {
    // If external fails, use internal
    saveLocalRedirect(code, originalUrl);
    const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
    return `${appUrl}/${code}`;
  }
};

app.post('/api/upload', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const durationPref = req.body.duration || 'private';
  const expireHoursStr = req.body.expireHours;

  try {
    const results = [];

    for (const file of files) {
      const mediaPath = file.path;
      const originalName = file.originalname;

      const catboxTask = async () => {
        try {
          const form = new FormData();
          form.append('fileToUpload', fs.createReadStream(mediaPath), { filename: originalName });
          form.append('reqtype', 'fileupload');
          const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() },
          });
          if (!response.data || response.data.includes('error')) return null;
          const myUrl = await shorten(response.data);
          return { name: 'Catbox', duration: 'Permanen', url: myUrl };
        } catch {
          return null;
        }
      };

      const imgbbTask = async () => {
        try {
          const form = new FormData();
          form.append('image', fs.createReadStream(mediaPath), { filename: originalName });
          const response = await axios.post(`https://api.imgbb.com/1/upload?key=${API_KEY_IMGBB}`, form, {
            headers: { ...form.getHeaders() },
          });
          const url = response.data?.data?.url || response.data?.data?.display_url;
          if (!url) return null;
          const myUrl = await shorten(url);
          return { name: 'ImgBB', duration: 'Permanen', url: myUrl };
        } catch {
          return null;
        }
      };

      const lunaraTask = async () => {
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(mediaPath), { filename: originalName });
          form.append('expire_value', '7');
          form.append('expire_unit', 'hours');
          const response = await axios.post('https://lunara.softbotz.my.id/upload', form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          });
          if (response.data && response.data.file_url) {
            const myUrl = await shorten(response.data.file_url);
            return { name: 'Lunara', duration: '7 Jam', url: myUrl };
          }
          return null;
        } catch {
          return null;
        }
      };

      const codeteamTask = async () => {
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(mediaPath), { filename: originalName });
          form.append('duration', '24h');
          const response = await axios.post('https://cloud.codeteam.my.id/api/upload', form, {
            headers: { ...form.getHeaders(), accept: '*/*' },
            maxBodyLength: Infinity,
          });
          if (response.data && response.data.files && response.data.files[0]) {
            const url = 'https://cloud.codeteam.my.id' + response.data.files[0].url;
            const myUrl = await shorten(url);
            return { name: 'Codeteam', duration: '24 Jam', url: myUrl };
          }
          return null;
        } catch {
          return null;
        }
      };

      const image2urlTask = async () => {
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(mediaPath), { filename: originalName });
          const randomUA = `CT Nasa/${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
          const response = await axios.post('https://www.image2url.com/api/upload', form, {
            headers: {
              ...form.getHeaders(),
              accept: 'application/json, text/plain, */*',
              origin: 'https://www.image2url.com',
              referer: 'https://www.image2url.com/',
              'user-agent': randomUA,
            },
          });
          const url = response.data?.url || response.data?.data?.url;
          if (url) {
            const myUrl = await shorten(url);
            return { name: 'Image2Url', duration: 'Permanen', url: myUrl };
          }
          return null;
        } catch {
          return null;
        }
      };

      const gdriveTask = async () => {
        try {
          const folderId = process.env.GDRIVE_FOLDER_ID;
          if (!folderId) throw new Error("GDRIVE_FOLDER_ID_MISSING");

          let authClient: any;

          // Prefer Service Account if provided
          if (process.env.GDRIVE_CLIENT_EMAIL && process.env.GDRIVE_PRIVATE_KEY) {
            authClient = new google.auth.JWT({
              email: process.env.GDRIVE_CLIENT_EMAIL,
              key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              scopes: ['https://www.googleapis.com/auth/drive'],
            });
          } 
          // Fallback to OAuth2
          else if (process.env.GDRIVE_CLIENT_ID && process.env.GDRIVE_CLIENT_SECRET && process.env.GDRIVE_REFRESH_TOKEN) {
            authClient = new google.auth.OAuth2(
              process.env.GDRIVE_CLIENT_ID,
              process.env.GDRIVE_CLIENT_SECRET,
              "https://developers.google.com/oauthplayground"
            );
            authClient.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
          } else {
            throw new Error("GDRIVE_NOT_CONFIGURED");
          }

          const drive = google.drive({ version: 'v3', auth: authClient });
          const fileMetadata = {
            name: originalName,
            parents: [folderId]
          };
          const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(mediaPath)
          };

          const res = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            supportsAllDrives: true,
            fields: 'id, webViewLink, webContentLink'
          });
          
          if (!res.data.id) return null;

          // Make public
          await drive.permissions.create({
            fileId: res.data.id,
            supportsAllDrives: true,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            }
          });

          // Schedule deletion if expireHours is set
          let durationText = 'Tergantung Pemilik';
          
          if (expireHoursStr && !isNaN(Number(expireHoursStr))) {
            const expireHours = Number(expireHoursStr);
            if (expireHours > 0) {
               durationText = `Otomatis dihapus dalam ${expireHours} Jam`;
               // Set a timeout to delete the file later. 
               // Note: In a serverless env this is best-effort. For true durability, use a database & cron job.
               setTimeout(async () => {
                 try {
                   console.log(`Auto-deleting scheduled GDrive file: ${res.data.id}`);
                   await drive.files.delete({ fileId: res.data.id!, supportsAllDrives: true });
                 } catch (delError) {
                   console.error(`Failed to auto-delete file ${res.data.id}:`, delError);
                 }
               }, expireHours * 60 * 60 * 1000);
            }
          }

          // Bypass Google Drive Android App Interception & Account Chooser UI
          // 1. We try to use Google's hidden lh3 proxy for direct media access first
          // 2. If it's a video or we want to guarantee streaming, we proxy it through our own server
          const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
          const proxyUrl = `${appUrl.replace(/\/$/, '')}/api/drive/stream/${res.data.id}`;
          
          const myUrl = await shorten(proxyUrl);
          return { name: 'Google Drive', duration: durationText, url: myUrl };
        } catch (e: any) {
          console.error("GDrive Config/API skipped or failed:", e.message);
          return null; // Fail gracefully so it falls back!
        }
      };

      const isImage = file.mimetype.startsWith('image/');
      
      let uploadTasks = [];
      if (durationPref === 'temporary') {
        uploadTasks = [lunaraTask, codeteamTask];
      } else {
        // Private/Permanen storage
        // Only include image-specific tasks if it's an image
        if (isImage) {
          uploadTasks = [catboxTask, imgbbTask, image2urlTask];
        } else {
          // If not an image, only use generic tasks
          uploadTasks = [catboxTask];
        }
      }

      let successResult = null;
      let specificError = null;

      // Primary Try
      for (const task of uploadTasks) {
        try {
          const result = await task();
          if (result) {
            successResult = result;
            break;
          }
        } catch (e: any) {
          console.error("Primary Task failed:", e.message);
        }
      }

      // ULTIMATE FALLBACK: Google Drive (Support all files)
      if (!successResult) {
        try {
          console.log("Using Google Drive as ultimate fallback...");
          successResult = await gdriveTask();
        } catch (e: any) {
          console.error("GDrive Fallback failed:", e.message);
          if (e.message === "GDRIVE_NOT_CONFIGURED") {
             specificError = "Tujuan penyimpanan penuh/error & Google Drive belum dikonfigurasi. Silakan hubungi admin.";
          }
        }
      }

      if (fs.existsSync(mediaPath)) {
        fs.unlinkSync(mediaPath);
      }

      if (specificError) {
        return res.status(400).json({ error: specificError });
      }

      if (successResult) {
        const maskedResult = {
          name: `CDN-NODE-${Math.floor(Math.random() * 9000 + 1000)}`,
          duration: successResult.duration,
          url: successResult.url
        };
        results.push({
          originalName: file.originalname,
          size: file.size,
          type: file.mimetype,
          result: maskedResult
        });
      }
    }

    if (results.length === 0) {
      res.status(500).json({ error: 'Gagal mengunggah semua media. API penyimpanan saat ini menolak atau sedang penuh.' });
      return;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: error?.message || 'Terjadi kesalahan sistem internal.' });
  }
});

app.post('/api/shorten', async (req, res) => {
  try {
    const { url, customCode } = req.body;
    
    if (!url || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'Link target harus diawali dengan http:// atau https://' });
      return;
    }

    const finalCode = customCode ? customCode : makeid(6);
    await axios.post(appConfig.SHORTENER_API_URL, { code: finalCode, url });

    const baseUrl = appConfig.SHORTENER_BASE_URL.replace(/\/$/, '');
    res.json({
      success: true,
      data: {
        originalUrl: url,
        shortUrl: `${baseUrl}/${finalCode}`,
        code: finalCode
      }
    });
  } catch (error) {
    console.error('Shortener error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat shortlink.' });
  }
});

// Internal Short Code Handler
app.get('/:code', (req, res, next) => {
  const code = req.params.code;
  if (localRedirects[code]) {
    const targetUrl = localRedirects[code];
    // Masking check: If it's internal drive proxy, serve viewer instead of redirect
    if (targetUrl.includes('/api/drive/stream/')) {
       // Rewrite internal URL to the stream handler without changing browser URL
       const fileId = targetUrl.split('/').pop()?.split('?')[0];
       if (fileId) {
          req.url = `/api/drive/stream/${fileId}`;
          return app._router.handle(req, res);
       }
    }
    return res.redirect(targetUrl);
  }
  next();
});

// Rich HTML Media Player / Streaming entry route
app.get('/api/drive/stream/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const accept = req.headers.accept || '';
    const dest = req.headers['sec-fetch-dest'] || '';
    const clientId = process.env.GDRIVE_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).send("Google Drive API is not configured properly on the server.");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const meta = await drive.files.get({ fileId, fields: 'mimeType, size, name', supportsAllDrives: true });
    
    const mimeType = meta.data.mimeType || 'application/octet-stream';
    const isVideo = mimeType.startsWith('video/');
    const isImage = mimeType.startsWith('image/');
    
    // Serve HTML Media Player if directly accessed in browser tab (not embedded)
    if (accept.includes('text/html') && dest === 'document') {
       const rawStreamUrl = `/api/drive/raw/${fileId}`;
       const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.data.name} - CDN Viewer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-zinc-950 flex flex-col items-center justify-center min-h-screen m-0 p-4">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black z-[-1]"></div>
    <div class="relative max-w-5xl w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
            <h1 class="text-white/90 font-medium truncate shrink-0 max-w-[70%]">${meta.data.name}</h1>
            <a href="${rawStreamUrl}?download=1" class="text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors px-4 py-1.5 rounded-full">Download File</a>
        </div>
        <div class="flex items-center justify-center bg-black/40 min-h-[50vh] p-4 lg:p-8 relative group">
            ${isVideo ? 
              `<video src="${rawStreamUrl}" controls autoplay class="max-w-full max-h-[70vh] rounded-xl shadow-lg ring-1 ring-white/10 w-full" style="object-fit: contain;"></video>` 
              : isImage ? 
              `<img src="${rawStreamUrl}" alt="${meta.data.name}" class="max-w-full max-h-[75vh] rounded-xl object-contain shadow-lg ring-1 ring-white/10">` 
              : `<div class="text-white border px-6 py-3 rounded-full border-white/20 bg-white/5">Preview Not Supported for ${mimeType}</div>`
            }
        </div>
    </div>
</body>
</html>`;
       return res.send(html);
    }
    
    // Forward to raw stream processor
    req.url = `/api/drive/raw/${fileId}`;
    return app._router.handle(req, res);

  } catch (error: any) {
    console.error('Drive Meta Error:', error.message);
    res.status(404).send('File not found or access denied.');
  }
});

// Raw byte stream endpoint (for <video src> or <img src>)
app.get('/api/drive/raw/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const isDownload = req.query.download === '1';
    
    const clientId = process.env.GDRIVE_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const meta = await drive.files.get({ fileId, fields: 'mimeType, size, name', supportsAllDrives: true });
    
    res.setHeader('Content-Type', meta.data.mimeType || 'application/octet-stream');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${meta.data.name}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${meta.data.name}"`);
    }
    
    if (meta.data.size) {
      res.setHeader('Content-Length', meta.data.size);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const response = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    response.data
      .on('error', (err: any) => {
        console.error('Stream error:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);

  } catch (error: any) {
    console.error('Drive Raw Stream Error:', error.message);
    if (!res.headersSent) res.status(404).send('File not found or access denied.');
  }
});

// Set up production static files synchronously so they are ready for serverless
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // If the shortcode or API didn't match, fallback to index.html for SPA
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function startServer() {
  // Only start Vite inside dev environment, dynamically loaded
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Only listen if not imported as a module (e.g. Vercel Serverless)
  if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Ensure the server starts when run directly
startServer();

export default app;
