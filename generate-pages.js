#!/usr/bin/env node
/**
 * CONVIUM — generate-pages.js (Dynamic All-Combinations)
 * Generates every possible within-category conversion pair in one run.
 * Run: node generate-pages.js
 */
const fs = require('fs');
const path = require('path');

/* ── 1. CATEGORY DEFINITIONS & FORMATS ────────────────────── */
const categories = {
  video: { formats: ['MP4','MKV','MOV','AVI','WebM','FLV','OGV','3GP','TS','WMV','M4V','3G2','MTS','M2TS','VOB'], icon: '🎬' },
  audio: { formats: ['MP3','WAV','FLAC','AAC','OGG','OPUS','WMA','AIFF','M4A','AIF','AU','AMR','AC3','DTS','MKA'], icon: '🎵' },
  image: { formats: ['PNG','JPG','WebP','GIF','BMP','AVIF','TIFF','ICO','SVG','PPM','PGM','TGA'], icon: '🖼️' },
  docs:  { formats: ['PDF','DOCX','ODT','RTF','TXT','MD','HTML','EPUB','CSV','JSON','XML','YAML'], icon: '📄' },
  archives: { formats: ['ZIP','RAR','7Z','TAR','GZ','BZ2','XZ'], icon: '📦' }
};

/* ── 2. DYNAMIC COMBINATION GENERATOR ─────────────────────── */
const pages = [];
for (const [catKey, cat] of Object.entries(categories)) {
  for (const from of cat.formats) {
    for (const to of cat.formats) {
      if (from.toLowerCase() === to.toLowerCase()) continue;
      const slug = `${from.toLowerCase()}-to-${to.toLowerCase()}`;
      pages.push({
        dir: catKey,
        from,
        to,
        slug,
        icon: cat.icon,
        type: catKey === 'docs' ? 'document' : catKey,
        desc: generateDesc(from, to, catKey)
      });
    }
  }
}

function generateDesc(from, to, type) {
  const ctx = {
    video: `Convert ${from} to ${to} container or codec. Optimized for playback, editing, or web streaming.`,
    audio: `Convert ${from} audio to ${to}. ${['WAV','FLAC'].includes(to) ? 'Lossless quality preserved.' : 'Compressed for portable devices & streaming.'}`,
    image: `Convert ${from} images to ${to}. ${['WebP','AVIF'].includes(to) ? 'Next-gen compression with smaller file sizes.' : 'Standard format conversion.'}`,
    docs: `Convert ${from} documents to ${to}. Formatting, metadata, and structure preserved where possible.`,
    archives: `Extract, browse, and repackage ${from} archives into ${to}. Selective extraction supported.`
  };
  return ctx[type] || `Convert ${from} to ${to} efficiently in-browser.`;
}

/* ── 3. STATIC UI COMPONENTS (From your template) ─────────── */
const FORMAT_SELECT = `<select id="format-select" class="control-select">
<optgroup label="Video">
<option value="mp4">MP4</option><option value="mkv">MKV</option><option value="webm">WebM</option>
<option value="mov">MOV</option><option value="avi">AVI</option><option value="flv">FLV</option>
<option value="ogv">OGV</option><option value="3gp">3GP</option><option value="ts">TS</option>
<option value="wmv">WMV</option><option value="m4v">M4V</option><option value="vob">VOB</option>
</optgroup>
<optgroup label="Audio">
<option value="mp3">MP3</option><option value="aac">AAC</option><option value="wav">WAV</option>
<option value="flac">FLAC</option><option value="ogg">OGG</option><option value="m4a">M4A</option>
<option value="opus">OPUS</option><option value="wma">WMA</option><option value="aiff">AIFF</option>
</optgroup>
<optgroup label="Image">
<option value="jpg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option>
<option value="gif">GIF</option><option value="bmp">BMP</option><option value="avif">AVIF</option>
<option value="tiff">TIFF</option><option value="ico">ICO</option><option value="svg">SVG</option>
</optgroup>
<optgroup label="Document">
<option value="pdf">PDF</option><option value="docx">DOCX</option><option value="odt">ODT</option>
<option value="rtf">RTF</option><option value="txt">TXT</option><option value="md">Markdown</option>
<option value="html">HTML</option><option value="csv">CSV</option><option value="json">JSON</option>
<option value="xml">XML</option><option value="yaml">YAML</option>
</optgroup>
<optgroup label="Archive">
<option value="zip">ZIP</option><option value="tar">TAR</option><option value="gz">GZ</option>
</optgroup>
</select>`;

function header(page, rel) {
  const tabs = [
    { label:'All', href:`${rel}index.html`, active: false },
    { label:'Video', href:`${rel}video/index.html`, active: page.dir==='video' },
    { label:'Audio', href:`${rel}audio/index.html`, active: page.dir==='audio' },
    { label:'Image', href:`${rel}image/index.html`, active: page.dir==='image' },
    { label:'Docs',  href:`${rel}docs/index.html`,  active: page.dir==='docs'  },
    { label:'Archives', href:`${rel}archives/index.html`, active: page.dir==='archives' }
  ];
  return `<header class="site-header"><div class="header-inner">
<div class="brand"><a href="${rel}index.html" class="logo-link"><span class="logo-word">convium</span><span class="logo-tag">by Osmium</span></a></div>
<div class="header-center"><nav class="type-nav">${tabs.map(t=>`<a href="${t.href}" class="type-link${t.active?' active':''}">${t.label}</a>`).join('')}</nav></div>
<div class="header-right">
<div class="theme-switcher">
<button class="theme-btn" data-theme="light" onclick="setTheme('light')" title="Light">☀️</button>
<button class="theme-btn" data-theme="dark" onclick="setTheme('dark')" title="Dark">🌙</button>
<button class="theme-btn" data-theme="system" onclick="setTheme('system')" title="System">⚙️</button>
</div>
<div class="privacy-badge" data-tooltip="Your files never leave your device. All processing is local via WebAssembly.">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
On&#8209;Device&nbsp;·&nbsp;Secure
</div>
</div>
</div></header>`;
}

function converter(page) {
  return `
<div id="wasm-loader" class="wasm-loader">
<div class="skeleton-bar" style="width:60%"></div><div class="skeleton-bar" style="width:40%"></div>
<p class="loader-text">Initializing WebAssembly engines<span class="dots"></span></p>
</div>
<div id="app" class="app hidden" style="max-width:900px;margin:0 auto;padding:0 20px 80px;">
<section class="drop-section">
<div id="drop-zone" class="drop-zone" tabindex="0" role="button">
<div class="drop-content">
<div class="drop-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
<p class="drop-main">Drop ${page.from} files here</p>
<p class="drop-sub">or <button class="link-btn" id="browse-btn">browse</button> to select</p>
<p class="drop-hint">Output: <strong>${page.to}</strong> · Any size · No upload</p>
</div>
<div class="drop-overlay"><span>Release to add files</span></div>
</div>
<input type="file" id="file-input" multiple hidden />
</section>
<section class="controls-bar" id="controls-bar">
<div class="controls-left">
<div class="control-group"><label class="control-label">Convert to</label>${FORMAT_SELECT}</div>
<div class="control-group">
<label class="control-label" title="%N=name %D=date %C=counter">Rename pattern</label>
<input type="text" id="rename-pattern" class="control-input" value="%N" placeholder="%N_%D" />
</div>
<div class="control-group">
<label class="control-label">Profile</label>
<select id="profile-select" class="control-select">
<option value="">None</option><option value="instagram">Instagram</option>
<option value="youtube">YouTube</option><option value="twitter">Twitter/X</option>
<option value="print">Print PDF</option><option value="web">Web Optimized</option>
</select>
<button class="icon-btn" id="save-profile-btn" title="Save profile">💾</button>
</div>
</div>
<div class="controls-right">
<button class="btn btn--ghost" id="clear-all-btn">Clear All</button>
<button class="btn btn--primary" id="convert-all-btn" disabled>
<span class="btn-text">Convert All</span><span class="btn-count" id="file-count-badge">0</span>
</button>
</div>
</section>
<section class="advanced-panel">
<button class="advanced-toggle" id="advanced-toggle">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12H4M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg>
Advanced Settings
<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
</button>
<div class="advanced-body" id="advanced-body">
<div class="settings-group" id="settings-video"><h4 class="settings-group-title">Video</h4>
<div class="settings-grid">
<div class="setting-item"><label>Codec</label><select id="v-codec"><option value="libx264">H.264</option><option value="libx265">H.265/HEVC</option><option value="libvpx-vp9">VP9</option><option value="copy">Copy (lossless)</option></select></div>
<div class="setting-item"><label>Bitrate (kbps)</label><input type="number" id="v-bitrate" placeholder="auto" min="100" max="50000"></div>
<div class="setting-item"><label>Frame Rate (fps)</label><input type="number" id="v-fps" placeholder="auto" min="1" max="120"></div>
<div class="setting-item"><label>Resolution</label><select id="v-res"><option value="">Original</option><option value="scale=1920:-2">1080p</option><option value="scale=1280:-2">720p</option><option value="scale=854:-2">480p</option></select></div>
<div class="setting-item"><label>Trim Start (s)</label><input type="number" id="v-trim-start" placeholder="0" min="0"></div>
<div class="setting-item"><label>Trim End (s)</label><input type="number" id="v-trim-end" placeholder="full" min="0"></div>
</div>
</div>
<div class="settings-group" id="settings-audio"><h4 class="settings-group-title">Audio</h4>
<div class="settings-grid">
<div class="setting-item"><label>Codec</label><select id="a-codec"><option value="libmp3lame">MP3</option><option value="aac">AAC</option><option value="libvorbis">Vorbis</option><option value="flac">FLAC</option><option value="copy">Copy</option></select></div>
<div class="setting-item"><label>Bitrate</label><select id="a-bitrate"><option value="128k">128k</option><option value="192k" selected>192k</option><option value="256k">256k</option><option value="320k">320k</option></select></div>
<div class="setting-item"><label>Sample Rate</label><select id="a-samplerate"><option value="44100">44100 Hz</option><option value="48000">48000 Hz</option></select></div>
</div>
</div>
<div class="settings-group" id="settings-image"><h4 class="settings-group-title">Image</h4>
<div class="settings-grid">
<div class="setting-item"><label>Width (px)</label><input type="number" id="img-width" placeholder="auto" min="1"></div>
<div class="setting-item"><label>Quality (0-100)</label><input type="range" id="img-quality" min="1" max="100" value="85"><output id="img-quality-val">85</output></div>
<div class="setting-item checkbox-item"><label><input type="checkbox" id="img-aspect" checked> Maintain Aspect Ratio</label></div>
</div>
</div>
</div>
</section>
<section class="queue-section" id="queue-section">
<div class="queue-header"><h3 class="queue-title">File Queue</h3><span id="queue-stats" class="queue-stats"></span></div>
<div class="batch-progress" id="batch-progress" style="display:none">
<div class="progress-bar-wrap"><div class="progress-bar" id="batch-bar"></div></div>
<span class="progress-label" id="batch-label">0%</span>
</div>
<ul class="file-list" id="file-list"></ul>
<div class="queue-empty" id="queue-empty"><p>No files yet — drop some above ☝️</p></div>
</section>
</div>
<div class="mobile-fab" id="mobile-fab" style="display:none">
<button class="btn btn--primary btn--fab" id="mobile-convert-btn" disabled>Convert All</button>
</div>`;
}

/* ── 4. MAIN PAGE TEMPLATE ───────────────────────────────── */
function pageTemplate(p) {
  
  const rel = '../';
  const related = pages.filter(x => x.dir===p.dir && x.slug!==p.slug && (x.from===p.from||x.to===p.to)).slice(0,6);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.from} to ${p.to} Converter – Free & Private | Convium</title>
<meta name="description" content="Convert ${p.from} to ${p.to} instantly in your browser. No uploads, no servers, 100% private. Free online ${p.from.toLowerCase()} to ${p.to.toLowerCase()} converter.">
<link rel="canonical" href="https://convium.pages.dev/${p.dir}/${p.slug}.html">
<meta property="og:url" content="https://convium.pages.dev/${p.dir}/${p.slug}.html">
<meta property="og:title" content="${p.from} to ${p.to} – Convium">
<meta property="og:description" content="${p.desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${p.from} to ${p.to} Converter","description":"${p.desc}","applicationCategory":"UtilitiesApplication","offers":{"@type":"Offer","price":"0"}}</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": `How do I convert ${p.from} to ${p.to}?`, 
      "acceptedAnswer": { "@type": "Answer", "text": `Drop your ${p.from} file into the converter above. Select "${p.to}" and click Convert All. Downloads instantly.` } },
    { "@type": "Question", "name": "Are my files private?", 
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Convium runs 100% in your browser via WebAssembly. Nothing is uploaded to any server." } },
    { "@type": "Question", "name": "Is it free?", 
      "acceptedAnswer": { "@type": "Answer", "text": "Completely free. No accounts, no limits, no watermarks." } }
  ]
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://convium.osmium.app/index.html` },
    { "@type": "ListItem", "position": 2, "name": `${p.dir.charAt(0).toUpperCase() + p.dir.slice(1)}`, "item": `https://convium.osmium.app/${p.dir}/index.html` },
    { "@type": "ListItem", "position": 3, "name": `${p.from} to ${p.to}` }
  ]
})}
</script>
<!-- Preconnect to critical origins -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>

<!-- Preload critical font & defer non-critical scripts -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap" as="style">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap"></noscript>
</head>
<body>
${header(p, rel)}
<div class="ad-slot" style="max-width:900px;margin:0 auto"><div class="ad-placeholder"><span class="ad-label">Advertisement</span></div></div>
<div style="max-width:900px;margin:0 auto;padding:16px 20px 0">
<p class="breadcrumb"><a href="${rel}index.html">Home</a> › <a href="index.html">${p.dir.charAt(0).toUpperCase()+p.dir.slice(1)}</a> › ${p.from} to ${p.to}</p>
</div>
<section style="max-width:900px;margin:0 auto;padding:16px 20px 20px">
<h1 style="font-family:var(--font-display);font-size:clamp(24px,4vw,40px);margin-bottom:8px">
${p.icon} Convert <em style="color:var(--accent);font-style:italic">${p.from}</em> to ${p.to}
</h1>
<p style="color:var(--text-2);font-size:15px;max-width:600px">${p.desc}</p>
</section>
${converter(p)}
<div class="ad-slot" style="max-width:900px;margin:0 auto"><div class="ad-placeholder"><span class="ad-label">Advertisement</span></div></div>
${related.length ? `
<section style="max-width:900px;margin:0 auto;padding:0 20px 40px">
<h2 style="font-family:var(--font-display);font-size:20px;margin-bottom:16px">Related Converters</h2>
<div class="converter-grid" style="padding:0;margin:0">
${related.map(r=>`<a href="${r.slug}.html" class="converter-card"><div class="converter-card-icon">${r.icon}</div><div class="converter-card-title">${r.from} to ${r.to}</div><div class="converter-card-desc">${r.desc.split('.')[0]}</div></a>`).join('')}
</div>
</section>` : ''}
<section style="max-width:900px;margin:0 auto;padding:0 20px 60px">
<h2 class="faq-title">FAQ</h2>
<div class="faq-item"><p class="faq-question">How do I convert ${p.from} to ${p.to}?</p><p class="faq-answer">Drop your ${p.from} file into the converter above. Make sure "${p.to}" is selected in the format dropdown. Click "Convert All" and then download your converted file.</p></div>
<div class="faq-item"><p class="faq-question">Is it really free?</p><p class="faq-answer">Yes — completely free. Convium is ad-supported. No account, no file limits.</p></div>
<div class="faq-item"><p class="faq-question">Are my files private?</p><p class="faq-answer">100% private. Files never leave your device. Everything runs locally in WebAssembly — we have no servers that touch your files.</p></div>
<div class="faq-item"><p class="faq-question">File size limit?</p><p class="faq-answer">No server-side limit. Your browser RAM is the only constraint — modern desktops handle multi-GB files. On mobile, keep it under ~500MB.</p></div>
<div class="faq-item"><p class="faq-question">Why do I need a local server for video/audio?</p><p class="faq-answer">Opening HTML via file:// blocks SharedArrayBuffer. Run: <code style="background:var(--bg-3);padding:2px 6px;border-radius:4px;font-family:var(--font-mono)">npx serve .</code> or use VS Code Live Server.</p></div>
</section>
<footer class="site-footer"><div class="footer-inner">
<p class="footer-badge">100% client&#8209;side · No uploads · <strong>Convium by Osmium</strong></p>
<nav class="footer-links">
<a href="${rel}index.html">Home</a><a href="${rel}video/index.html">Video</a>
<a href="${rel}audio/index.html">Audio</a><a href="${rel}image/index.html">Image</a><a href="${rel}docs/index.html">Docs</a><a href="${rel}archives/index.html">Archives</a>
</nav>
<p class="footer-legal">© 2025 Osmium · MIT License</p>
</div></footer>
<script src="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js" defer></script>
<script src="${rel}app.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
setTimeout(() => {
const sel = document.getElementById('format-select');
if (sel) {
const t = '${p.to.toLowerCase()}';
const opt = [...sel.options].find(o => o.value.toLowerCase() === t);
if (opt) sel.value = opt.value;
}
}, 50);
});
</script>
</body>
</html>`;
}

/* ── 5. GENERATE & WRITE ─────────────────────────────────── */
console.log(`⏳ Generating ${pages.length} converter pages...\n`);
pages.forEach(p => {
  const dir = path.join(__dirname, p.dir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${p.slug}.html`);
  fs.writeFileSync(filePath, pageTemplate(p));
  console.log(`✓ ${p.dir}/${p.slug}.html`);
});

console.log(`\n✅ Successfully generated ${pages.length} pages across ${Object.keys(categories).length} categories.`);
// ── 6. GENERATE SITEMAP ───────────────────────────────────
const baseUrl = 'https://convium.pages.dev';
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(p => `  <url><loc>${baseUrl}/${p.dir}/${p.slug}.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
  `  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  '</urlset>'
].join('\n');
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log('✅ sitemap.xml generated');