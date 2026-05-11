<div align="center">

<br/>

```
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗██╗██╗   ██╗███╗   ███╗
██╔════╝██╔═══██╗████╗  ██║██║   ██║██║██║   ██║████╗ ████║
██║     ██║   ██║██╔██╗ ██║██║   ██║██║██║   ██║██╔████╔██║
██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║██║   ██║██║╚██╔╝██║
╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ██║╚██████╔╝██║ ╚═╝ ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝
```

### **Convert anything. Upload nothing. Trust no one.**

*Video · Audio · Images · Documents · Archives*
*— all converted in your browser via WebAssembly. Zero server contact. Zero leaks.*

<br/>

[![Live](https://img.shields.io/badge/🚀_Live_App-convium.pages.dev-6366f1?style=for-the-badge)](https://convium.pages.dev)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Made With](https://img.shields.io/badge/Powered_By-WebAssembly-654ff0?style=for-the-badge&logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Hosted On](https://img.shields.io/badge/Hosted_On-Cloudflare_Pages-f97316?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![HTML](https://img.shields.io/badge/Stack-HTML_99%25-e34c26?style=for-the-badge&logo=html5&logoColor=white)](https://github.com/iamsifat0k/convium)

<br/>

> 🔒 **Your files never leave your device.**
> No server. No account. No watermark. No BS.
> Runs 100% locally using FFmpeg compiled to WebAssembly.

<br/>

---

</div>

## 🤔 Wait, Another File Converter?

Yeah, except those other ones? They upload your files to a server in god-knows-where, pinky promise to delete it, then serve you ads while your private files sit on their S3 bucket. 🙄

**Convium is architecturally different:**

```
Other converters:   YOU → Upload → Their Server → Convert → Download → 😬
Convium:            YOU → Browser → WebAssembly (FFmpeg) → Done → 😎
```

Your file never leaves your RAM. Not even a single byte hits a network request during conversion. That's not a feature — that's the entire philosophy.

---

## ✨ Feature Breakdown

<table>
<tr>
<td width="50%">

### 🔒 Privacy-First Architecture
Conversion runs entirely via **FFmpeg.wasm** in your browser sandbox. Zero server involvement. Your files exist only in your device's memory.

### ⚡ WebAssembly Powered
FFmpeg compiled to WASM = near-native conversion speed directly in the tab. No plugin. No install.

### 🎛️ Pro-Level Controls
Not just "convert and pray" — full control over codecs, bitrates, frame rates, resolution, trim points, watermarks, and more.

</td>
<td width="50%">

### 📦 500+ Format Combinations
Video, Audio, Image, Document, Archive — all in one place, hundreds of conversion routes covered.

### 🎨 Conversion Profiles
Built-in presets for **Instagram, YouTube, Twitter/X, Print PDF, Web Optimized** — one click, perfect output.

### 🌐 Universal Compatibility
Works on Windows, Mac, Linux, Android, iOS — any device with a modern browser. No installs ever.

</td>
</tr>
</table>

---

## 🗂️ Supported Formats

### 🎬 Video — 25+ formats

<details>
<summary>Click to expand all video formats</summary>

<br/>

| Format | Description |
|--------|-------------|
| `MP4` | MPEG-4 — universal standard |
| `MKV` | Matroska — best for quality |
| `WebM` | VP9/AV1 — web optimized |
| `MOV` | QuickTime — Apple standard |
| `AVI` | Audio Video Interleave — classic |
| `FLV` | Flash Video |
| `OGV` | Ogg Video |
| `3GP` / `3G2` | Mobile video formats |
| `TS` / `M2TS` / `MTS` | Broadcast/Blu-ray streams |
| `VOB` | DVD video |
| `WMV` / `ASF` | Windows Media |
| `RM` / `RMVB` | RealMedia |
| `DIVX` | DivX video |
| `M4V` | iTunes video |
| `GIF` / `APNG` | Animated image formats |
| `MXF` | Material Exchange Format |
| `DV` | Digital Video |
| `SWF` | Flash (audio/video extract) |

</details>

---

### 🎵 Audio — 27+ formats

<details>
<summary>Click to expand all audio formats</summary>

<br/>

| Format | Description |
|--------|-------------|
| `MP3` | MPEG Layer 3 — universal |
| `AAC` | Advanced Audio Coding |
| `WAV` | Waveform — lossless raw |
| `FLAC` | Free Lossless Audio Codec |
| `OGG` / `OGA` | Ogg Vorbis |
| `M4A` | MPEG-4 Audio |
| `OPUS` | Modern efficient codec |
| `WMA` | Windows Media Audio |
| `AIFF` / `AIF` | Apple lossless |
| `AU` | Sun Audio |
| `RA` | RealAudio |
| `AMR` | Adaptive Multi-Rate (mobile) |
| `AC3` / `EAC3` | Dolby Digital |
| `DTS` | DTS surround |
| `MKA` | Matroska Audio |
| `SPX` | Speex |
| `CAF` | Core Audio Format |
| `TTA` / `WV` / `MPC` | Lossless/audiophile formats |
| `MP2` / `MP1` | Legacy MPEG audio |
| `MIDI` | Musical Instrument Digital |

</details>

---

### 🖼️ Image — 15+ formats

<details>
<summary>Click to expand all image formats</summary>

<br/>

| Format | Description |
|--------|-------------|
| `JPEG` / `PNG` | Universal standards |
| `WebP` | Google's modern format |
| `GIF` | Animated/static |
| `BMP` | Windows Bitmap |
| `AVIF` | AV1 Image — next-gen |
| `TIFF` | High quality print |
| `ICO` | Windows icon |
| `SVG` | Scalable vector |
| `PPM` / `PGM` / `PBM` | Portable image formats |
| `TGA` | Truevision TARGA |
| `XBM` / `WBMP` | X Bitmap / Wireless BMP |

</details>

---

### 📄 Document — 20+ formats

<details>
<summary>Click to expand all document formats</summary>

<br/>

`PDF` `DOCX` `DOC` `ODT` `RTF` `TXT` `MD` `HTML` `HTM` `EPUB` `TEX` `RST` `ORG` `ADOC` `WIKI` `CSV` `TSV` `JSON` `XML` `YAML`

</details>

---

### 🗜️ Archive

`ZIP` `TAR` `GZ`

---

## 🎛️ Advanced Controls

Convium isn't your average "select format and pray" converter. Here's what you actually control:

```
🎬 VIDEO
├── Codec: H.264 / H.265/HEVC / VP9 / Copy (no re-encode)
├── Bitrate (kbps) — custom input
├── Frame Rate (fps) — custom input
├── Resolution: Original / 1080p / 720p / 480p / 360p
├── Trim: Start & End timestamps (seconds)
├── Watermark text overlay
├── Strip Metadata
└── Extract Audio Only

🎵 AUDIO
├── Codec: MP3 / AAC / Vorbis / FLAC / Copy
├── Bitrate: 128k / 192k / 256k / 320k
├── Sample Rate: 22050 / 44100 / 48000 Hz
└── Channels: Stereo / Mono

🖼️ IMAGE
├── Custom Width & Height (px)
├── Quality (0–100)
├── Maintain Aspect Ratio
└── Remove EXIF data

📄 DOCUMENT
├── Page Size: A4 / Letter / A3 / Legal
├── Margin: Normal / Narrow / Wide / None
├── Password-protect PDF
└── Custom PDF Password
```

---

## 🎨 Conversion Profiles

One-click presets for common use cases:

| Profile | Use Case |
|---------|----------|
| 🟣 **Instagram** | Optimal format & resolution for IG uploads |
| 🔴 **YouTube** | YouTube recommended encoding settings |
| 🐦 **Twitter/X** | Twitter-compatible video specs |
| 🖨️ **Print PDF** | High-res document output |
| 🌐 **Web Optimized** | Smallest file, best browser compatibility |

---

## 🏗️ Project Structure

```
convium/
│
├── index.html              # Main app — drag & drop converter UI
├── app.js                  # Core conversion logic (FFmpeg.wasm)
├── style.css               # UI styles & theming
├── generate-pages.js       # SEO landing page generator
│
├── video/                  # Video converter landing pages
│   └── [format]-to-[format].html     (200+ pages)
│
├── audio/                  # Audio converter landing pages
│   └── [format]-to-[format].html     (150+ pages)
│
├── image/                  # Image converter landing pages
│   └── [format]-to-[format].html     (100+ pages)
│
├── docs/                   # Document converter pages
├── archives/               # Archive converter pages
│
├── ffmpeg/                 # FFmpeg.wasm binary & workers
├── .tmp-ffmpeg/            # FFmpeg temp working directory
│
├── sitemap.xml             # Sitemap index
├── sitemap-video.xml       # Video pages sitemap
├── sitemap-audio.xml       # Audio pages sitemap
├── sitemap-image.xml       # Image pages sitemap
├── sitemap-docs.xml        # Docs pages sitemap
├── sitemap-archives.xml    # Archives pages sitemap
├── sitemap-main.xml        # Main pages sitemap
├── robots.txt              # Crawler rules
└── .htaccess               # Server headers config
```

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CONVIUM STACK                          │
├─────────────────┬───────────────────────────────────────────┤
│  Frontend       │  HTML5, CSS3, Vanilla JavaScript          │
│  Conversion     │  FFmpeg compiled to WebAssembly           │
│  Image engine   │  Browser Canvas API                       │
│  Hosting        │  Cloudflare Pages (global edge CDN)       │
│  CI/CD          │  GitHub → Cloudflare auto-deploy          │
│  License        │  MIT                                      │
└─────────────────┴───────────────────────────────────────────┘
```

**Zero backend. Zero database. Zero cost to scale. Maximum privacy.**

---

## 🚀 Run Locally

No build step. No npm install. No ceremony:

```bash
# Clone
git clone https://github.com/iamsifat0k/convium.git
cd convium

# Serve locally (required for WASM CORS headers)
npx serve .
# or
python -m http.server 8080
```

> ⚠️ **Important:** FFmpeg.wasm requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers to enable `SharedArrayBuffer`. Use a local server — don't just open `index.html` via `file://`.

---

## 🤝 Contributing

PRs are welcome! Some areas where help would be awesome:

- 🐛 Bug fixes & edge cases
- ✨ New format support
- 🎨 UI/UX improvements
- 📝 Better docs & examples
- 🌍 Internationalization (i18n)

```bash
# Fork → Clone → Branch
git checkout -b feature/your-idea

# Make your changes
git commit -m "feat: describe your change"
git push origin feature/your-idea

# Open a PR — describe what & why
```

---

## 🗺️ Roadmap

- [x] Video conversion (25+ formats)
- [x] Audio conversion (27+ formats)
- [x] Image conversion (15+ formats)
- [x] Document conversion (20+ formats)
- [x] Archive support
- [x] Advanced codec & bitrate controls
- [x] Conversion profiles (Instagram, YouTube, Twitter/X, etc.)
- [x] Batch file queue
- [x] Conversion history
- [x] Dark / Light theme
- [ ] PWA support — install as offline app
- [ ] More archive formats (7z, RAR, BZIP2)
- [ ] Subtitle conversion (SRT, VTT, ASS)
- [ ] Mobile-optimized UI overhaul

---

## ⚖️ License

**MIT License** — use it, fork it, ship it, build on it.
See [`LICENSE`](LICENSE) for full terms.

---

<div align="center">

**Built with 🔥 by [Osmium](https://github.com/iamsifat0k)**

*If Convium saved you from uploading your private files to some random server —*
*the least you can do is drop a ⭐*

<br/>

[![Star on GitHub](https://img.shields.io/github/stars/iamsifat0k/convium?style=social)](https://github.com/iamsifat0k/convium/stargazers)
[![Follow](https://img.shields.io/github/followers/iamsifat0k?style=social)](https://github.com/iamsifat0k)

<br/>

`100% client-side` · `No uploads` · `No tracking` · `No nonsense`

</div>