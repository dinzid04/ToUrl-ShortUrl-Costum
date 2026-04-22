# 🚀 Smart Shortlink & Media Proxy (Cloudflare Worker)

Script Cloudflare Worker multi-fungsi untuk membuat API *URL Shortener* dan *Media Proxy* secara gratis (Serverless). Sangat cocok diintegrasikan dengan Bot WhatsApp atau *project* API lainnya.

**Fitur Utama:**
* 🔗 **Smart Redirect:** Kalau link berupa URL website biasa (contoh: YouTube, Google), pengunjung akan langsung di- *direct* ke web aslinya.
* 🛡️ **Media Proxy (Hide URL):** Kalau link berupa file media (JPG, MP4, MP3, PDF, JS, dll) atau link dari *image hosting* (Catbox, ImgBB, dll), URL asli akan disembunyikan. Pengunjung murni melihat file tersebut di bawah Custom Domain milikmu.
* 💾 **Database Gratis:** Menggunakan Cloudflare KV sebagai penyimpanan data.

---

## 🛠️ Panduan Instalasi (Setup Cloudflare)

Ikuti langkah-langkah di bawah ini secara berurutan agar API berfungsi dengan normal.

### Langkah 1: Buat Database (KV Namespace)
Ini adalah tempat untuk menyimpan data *shortlink* yang kamu buat.
1. Login ke dashboard [Cloudflare](https://dash.cloudflare.com).
2. Pergi ke menu **Storage & Databases** (atau **Workers & Pages**) di sebelah kiri, lalu klik **KV**.
3. Klik tombol biru **Create a namespace** (atau Create).
4. Masukkan nama persis seperti ini (harus huruf besar): `DB_SHORTLINK`
5. Klik **Add**.

### Langkah 2: Buat Cloudflare Worker
1. Di menu kiri, klik **Workers & Pages** -> **Overview**.
2. Klik tombol biru **Create application**, lalu pilih **Create Worker**.
3. Saat muncul pilihan *template* (seperti dari GitHub, dll), pilih saja template dasar **"Hello World"**.
4. Beri nama Worker sesukamu di kolom yang tersedia (contoh: `api-shortlink`).
5. Klik tombol **Deploy** di bagian bawah.
6. Setelah berhasil, klik tombol **Edit code** untuk mengedit kodenya.

### Langkah 3: Masukkan Kodingan (Script)
1. Di halaman editor, **hapus semua** kode bawaan "Hello World" yang ada di layar.
2. *Paste* kodingan di bawah ini ke dalam editor yang sudah kosong:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname.split('/')[1]
    
    if (request.method === 'POST' && path === 'add') {
      const data = await request.json()
      await env.DB_SHORTLINK.put(data.code, data.url)
      return new Response('Sukses simpan', { status: 200 })
    }
    
    if (path) {
      const targetUrl = await env.DB_SHORTLINK.get(path)
      
      if (targetUrl) {
        const isMedia = targetUrl.match(/\.(jpeg|jpg|gif|png|webp|mp4|mp3|m4a|wav|avi|mkv|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|apk|bin|iso|js|html|css|py|cpp|c|cs|java|json|xml|sh|php|ts|go|rs|sql|md|csv)$/i) || 
                        targetUrl.includes('catbox') || 
                        targetUrl.includes('imgbb') || 
                        targetUrl.includes('image2url') || 
                        targetUrl.includes('cloud.codeteam') || 
                        targetUrl.includes('lunara')
        
        if (isMedia) {
          try {
            const fetchResponse = await fetch(targetUrl)
            return new Response(fetchResponse.body, {
              status: fetchResponse.status,
              headers: fetchResponse.headers
            })
          } catch (e) {
            return new Response('Gagal memuat file', { status: 500 })
          }
        } else {
          return Response.redirect(targetUrl, 302)
        }
      }
      return new Response('Link tidak ditemukan', { status: 404 })
    }
    
    return new Response('API Shortlink Aktif', { status: 200 })
  }
}
```
3. Klik tombol biru **Deploy** di pojok kanan atas untuk menyimpan.

### Langkah 4: Sambungkan Database ke Worker (Binding) - ⚠️ WAJIB
Jika langkah ini dilewati, Worker akan mengalami *Error 500* saat digunakan.
1. Kembali ke halaman utama Worker kamu (tab **Overview**).
2. Klik tab **Settings** (deretan menu di atas).
3. Cari dan klik menu **Bindings** di sebelah kiri.
4. Klik tombol **Add** -> pilih **KV Namespace**.
5. Isi kotak **Variable name** dengan: `DB_SHORTLINK`
6. Pada kotak **KV namespace**, pilih nama database yang sudah dibuat pada Langkah 1.
7. Scroll ke bawah dan klik **Deploy** atau **Save**.

### Langkah 5: Pasang Custom Domain (Opsional, agar link lebih keren)
1. Di halaman **Overview** Worker kamu, cari bagian *Next steps* di paling bawah.
2. Klik opsi **🌐 Connect a custom domain**.
3. Ketik domain atau subdomain milikmu (contoh: `link.domainkamu.com`).
4. Klik **Add domain** dan tunggu Cloudflare mengatur DNS secara otomatis.

---

## 📁 Panduan Setup Google Drive (Penyimpanan & Fallback)

Bagian ini sangat penting jika kamu ingin menggunakan Google Drive sebagai tempat penyimpanan file permanen atau sebagai cadangan otomatis (*fallback*) jika server lain penuh.

### Langkah 1: Buat Project di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Klik nama project di pojok kiri atas, lalu klik **New Project**. Beri nama bebas (contoh: `DCDN-Storage`).
3. Setelah project terbuat, pastikan project tersebut terpilih.
4. Pergi ke menu **APIs & Services** > **Library**.
5. Cari **"Google Drive API"**, klik hasilnya, lalu klik tombol biru **Enable**.

### Langkah 2: Konfigurasi OAuth Consent Screen
Ini wajib diisi agar Google mengizinkan aplikasi kamu mengakses Drive.
1. Pergi ke menu **APIs & Services** > **OAuth consent screen**.
2. Pilih **External**, lalu klik **Create**.
3. Isi kolom yang wajib saja:
   - **App name**: DCDN
   - **User support email**: Email kamu.
   - **Developer contact info**: Email kamu.
4. Klik **Save and Continue** sampai selesai (tidak perlu tambah scope).
5. Pada bagian akhir, klik tombol **Back to Dashboard**.
6. **PENTING**: Di bawah status "Testing", klik tombol **Publish App** agar token tidak kedaluwarsa dalam 7 hari.

### Langkah 3: Buat Credentials (Client ID & Secret)
1. Pergi ke menu **APIs & Services** > **Credentials**.
2. Klik **+ Create Credentials** > **OAuth client ID**.
3. Pilih **Application type**: `Web application`.
4. Beri nama bebas (contoh: `DCDN Web`).
5. Di bagian **Authorized redirect URIs**, masukkan: `https://developers.google.com/oauthplayground`
6. Klik **Create**. 
7. **SIMPAN** (Copy) nilai `Client ID` dan `Client Secret` yang muncul. Kamu akan membutuhkannya di langkah berikutnya.

### Langkah 4: Dapatkan Refresh Token (Google OAuth Playground)
Karena kita ingin aplikasi login otomatis tanpa campur tangan kamu setiap saat, kita butuh *Refresh Token*.
1. Buka [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2. Klik ikon gir (Settings) di pojok kanan atas.
3. Centang kotak **Use your own OAuth credentials**.
4. Masukkan `OAuth Client ID` dan `OAuth Client Secret` yang kamu dapatkan di Langkah 3.
5. Pada kolom pencarian (Step 1), ketik atau cari: `https://www.googleapis.com/auth/drive`
6. Klik tombol biru **Authorize APIs**. Login dengan akun Google kamu.
7. Klik **Allow** jika muncul peringatan.
8. Kamu akan kembali ke Playground (Step 2). Klik tombol biru **Exchange authorization code for tokens**.
9. Lihat di kolom sebelah kanan, cari baris `refresh_token`. **SIMPAN** (Copy) kode tersebut.

### Langkah 5: Dapatkan Folder ID
Google Drive butuh ID folder spesifik tempat file akan disimpan.
1. Buka Google Drive kamu.
2. Buat folder baru (contoh: `Upload-DCDN`).
3. Masuk ke folder tersebut.
4. Lihat URL di browser kamu. Contoh: `https://drive.google.com/drive/u/0/folders/1abcde1234567890xyz`
5. Kode yang ada di akhir URL (`1abcde1234567890xyz`) adalah **GDRIVE_FOLDER_ID** kamu.

---

## ⚙️ Konfigurasi Environment Variables (PENTING)

Agar fitur Google Drive berfungsi, kamu harus memasukkan data yang sudah didapatkan di atas ke dalam pengaturan website (Environment Variables). 

**Daftar Variabel Nama & Isinya:**
- `GDRIVE_CLIENT_ID`: (Dari Langkah 3)
- `GDRIVE_CLIENT_SECRET`: (Dari Langkah 3)
- `GDRIVE_REFRESH_TOKEN`: (Dari Langkah 4)
- `GDRIVE_FOLDER_ID`: (Dari Langkah 5)
- `APP_URL`: Masukkan URL website utama kamu (contoh: `https://cdn.dinzid.my.id`). Ini digunakan untuk membuat link masking otomatis.

---

## 📡 Cara Penggunaan API (Endpoint)

Untuk membuat *shortlink* atau *custom link*, kamu hanya perlu melakukan HTTP POST *request* ke *endpoint* `/add` di domain Worker kamu.

**Endpoint:** `POST https://domain-worker-kamu.com/add`

**Body JSON:**
```json
{
  "code": "nama-custom-atau-random",
  "url": "https://link-asli-tujuan.com"
}
```

---

## ⚙️ Cara Setting Frontend (Web UI)

Setelah API Cloudflare Worker kamu aktif, kamu perlu menghubungkannya dengan website ini agar form URL Shortener berfungsi menggunakan domain milikmu sendiri.

1. Buka file `config.json` yang ada di folder utama project.
2. Ubah URL bawaan menjadi URL Cloudflare Worker atau Custom Domain yang sudah kamu buat di Langkah 5.

**Contoh isi `config.json`:**
```json
{
  "SHORTENER_API_URL": "https://link.domainkamu.com/add",
  "SHORTENER_BASE_URL": "https://link.domainkamu.com/"
}
```
*   `SHORTENER_API_URL`: Endpoint untuk menambahkan link baru (wajib diakhiri dengan `/add`).
*   `SHORTENER_BASE_URL`: Base URL untuk link yang sudah dipendekkan (diakhiri dengan `/`).

Setelah disimpan, website akan otomatis menggunakan API dan domain milikmu untuk setiap link yang dipendekkan!
