import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import os from 'os';
import * as url from 'url';
import { uploadFile } from 'cloudsky-storage';

export const app = express();
const PORT = 3000;

app.use(express.json());

// Heartbeat route to check if backend is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Netlify Functions' });
});

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

  // Use external shortener for ALL URLs including Google Drive proxy, because serverless
  // platforms (Vercel/Netlify) do not persist local JS objects or local files.
  try {
    await axios.post(appConfig.SHORTENER_API_URL, { code, url: originalUrl });
    const baseUrl = appConfig.SHORTENER_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/${code}`;
  } catch {
    // If external fails, do NOT use local redirects which vanish on serverless!
    // Return original URL as fallback.
    return originalUrl;
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
          return { name: 'DCDN Node Alpha', duration: 'Permanen', url: myUrl };
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
          return { name: 'DCDN Node Beta', duration: 'Permanen', url: myUrl };
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
            return { name: 'DCDN Temp 1', duration: '7 Jam', url: myUrl };
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
            return { name: 'DCDN Temp 2', duration: '24 Jam', url: myUrl };
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
            return { name: 'DCDN Image Node', duration: 'Permanen', url: myUrl };
          }
          return null;
        } catch {
          return null;
        }
      };

      const telegramTask = async () => {
        try {
          if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
            throw new Error("TELEGRAM_NOT_CONFIGURED");
          }
          if (file.size > 50 * 1024 * 1024) {
             throw new Error("Maksimal ukuran file untuk Node 1 adalah 50MB");
          }
          const form = new FormData();
          form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
          form.append('document', fs.createReadStream(mediaPath), { filename: originalName });

          const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          if (!response.data.ok) {
             throw new Error(response.data.description || "Gagal upload ke Node 1");
          }

          const fileId = response.data.result.document?.file_id || response.data.result.video?.file_id || response.data.result.audio?.file_id || (response.data.result.photo && response.data.result.photo[response.data.result.photo.length - 1]?.file_id);
          const messageId = response.data.result.message_id;
          
          if (!fileId) throw new Error("File ID tidak ditemukan dari response Node 1");

          // Schedule deletion if expireHours is set
          let durationText = 'Tergantung Pemilik';
          
          if (expireHoursStr && !isNaN(Number(expireHoursStr))) {
            const expireHours = Number(expireHoursStr);
            if (expireHours > 0) {
              durationText = `${expireHours} Jam`;
              setTimeout(async () => {
                try {
                  await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`, {
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    message_id: messageId
                  });
                  console.log(`Deleted expired Node 1 message ${messageId}`);
                } catch (e: any) {
                  console.error(`Failed to delete expired Node 1 message ${messageId}`, e.response?.data || e.message);
                }
              }, expireHours * 60 * 60 * 1000);
            }
          }

          const assumedUrl = process.env.URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL || process.env.URL?.replace('https://', '')}` : `http://localhost:${PORT}`;
          const appUrl = process.env.APP_URL || assumedUrl;
          const proxyUrl = `${appUrl.replace(/\/$/, '')}/api/tg/stream/${fileId}`;
          
          const myUrl = await shorten(proxyUrl);
          return { name: 'DinzCL Node Alpha', duration: durationText, url: myUrl };
        } catch (e: any) {
           console.error("Node 1 Task Failed:", e.message);
           if (e.message === "TELEGRAM_NOT_CONFIGURED") throw e;
           throw new Error(e.response?.data?.description || e.message || "Gagal upload ke Node 1");
        }
      };

      const cloudskyTask = async () => {
        try {
          const result = await uploadFile(mediaPath);
          if (result.success) {
            const myUrl = await shorten(result.data.url);
            return { name: 'Cloudsky Node', duration: 'Permanen', url: myUrl };
          }
          return null;
        } catch {
          return null;
        }
      };

      const githubTask = async () => {
        try {
          if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
            throw new Error("GITHUB_NOT_CONFIGURED");
          }
          const fileContent = fs.readFileSync(mediaPath);
          const b64 = fileContent.toString('base64');
          const ext = path.extname(originalName) || '';
          const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
          const gPath = `uploads/${filename}`;
          
          const res = await axios.put(`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${gPath}`, {
            message: `Upload ${filename}`,
            content: b64,
            branch: process.env.GITHUB_BRANCH || "main"
          }, {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "DinzID-Storage",
              "Accept": "application/vnd.github.v3+json"
            }
          });
          
          const downloadUrl = res.data.content.download_url;
          const myUrl = await shorten(downloadUrl);
          return { name: 'GitHub Node', duration: 'Permanen', url: myUrl };
        } catch (e: any) {
          console.error("GitHub Task Failed:", e?.response?.data || e.message);
          if (e.message === "GITHUB_NOT_CONFIGURED") throw e;
          return null;
        }
      };

      const isImage = file.mimetype.startsWith('image/');
      const providerPref = req.body.provider || 'auto';
      
      let uploadTasks: any[] = [];
      
      if (providerPref === 'telegram') {
         uploadTasks = [telegramTask];
      } else if (providerPref === 'cloudsky') {
         uploadTasks = [cloudskyTask];
      } else if (providerPref === 'github') {
         uploadTasks = [githubTask];
      } else if (durationPref === 'temporary') {
        uploadTasks = [lunaraTask, codeteamTask];
      } else if (durationPref === 'telegram') { // fallback legacy mapping
        uploadTasks = [telegramTask];
      } else {
        // Private/Permanen storage AUTO
        // Only include image-specific tasks if it's an image
        if (isImage) {
          uploadTasks = [catboxTask, imgbbTask, image2urlTask, cloudskyTask];
        } else {
          // If not an image, only use generic tasks
          uploadTasks = [catboxTask, cloudskyTask];
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
          if (e.message === "TELEGRAM_NOT_CONFIGURED") {
             specificError = "Node 1 belum dikonfigurasi. Silakan hubungi admin.";
          } else {
             specificError = e.message;
          }
        }
      }

      // Fallback mechanism for standard "Private Server" (Telegram)
      if (!successResult) {
        try {
           console.log("Using primary node fallback (Telegram)...");
           successResult = await telegramTask();
           if(successResult) {
             successResult.name = "DCDN Master Node 1";
             specificError = null;
           }
        } catch(e: any) {
           console.error("Primary node fallback failed:", e.message);
        }
      }

      // Secondary node fallback (Cloudsky)
      if (!successResult) {
        try {
           console.log("Using secondary node fallback (Cloudsky)...");
           successResult = await cloudskyTask();
           if(successResult) {
             successResult.name = "DCDN Master Node 2";
             specificError = null;
           }
        } catch(e: any) {
           console.error("Secondary node fallback failed");
        }
      }

      // Tertiary node fallback (GitHub)
      if (!successResult) {
        try {
           console.log("Using tertiary node fallback (GitHub)...");
           successResult = await githubTask();
           if(successResult) {
             successResult.name = "DCDN Master Node 3";
             specificError = null;
           }
        } catch(e: any) {
           console.error("Tertiary node fallback failed");
        }
      }

      if (fs.existsSync(mediaPath)) {
        fs.unlinkSync(mediaPath);
      }

      if (!successResult && !specificError) {
         specificError = "Semua koneksi Node gagal atau timeout (Batas Netlify 10 Detik)";
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

app.get('/api/tg/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return res.status(500).send("Telegram not configured");

    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const data = response.data;
    if (!data.ok) return res.status(404).send("File not found");

    const filePath = data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    res.redirect(fileUrl);
  } catch(e) {
    res.status(500).send("Error fetching telegram file");
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
  const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL || process.env.NODE_ENV === 'production' && !process.env.START_LOCAL);

  // Only start Vite inside dev environment, dynamically loaded
  if (!isServerless && process.env.NODE_ENV !== 'production') {
    try {
      const viteName = 'vite';
      const vitePkg = await import(viteName);
      const vite = await vitePkg.createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite initialization error', e);
    }
  }

  // Only listen if not imported as a module and NOT running in serverless
  if (!isServerless) {
    try {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (e) {
      console.error('Error starting listener', e);
    }
  }
}

// Ensure the server starts when run directly
startServer();

export default app;
