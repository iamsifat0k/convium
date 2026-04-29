/**
 * CONVIUM — app.js
 * Universal client-side file converter
 * by Osmium
 *
 * Architecture:
 *  - FFmpeg.wasm (UMD) for video/audio
 *  - Canvas API + browser-image-compression for images
 *  - JSZip for archive handling
 *  - Pandoc-style text conversion fallback for documents
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   GLOBALS & STATE
═══════════════════════════════════════════════════════════════ */

const state = {
  files: [],          // Array of FileEntry objects
  history: [],        // Conversion history (persisted to localStorage)
  profiles: {},       // Saved profiles (persisted to localStorage)
  ffmpegLoaded: false,
  ffmpegLoading: false,
  converting: false,
  ffmpeg: null,
  counter: 0,         // For %C token
};

// FFmpeg UMD globals — set during initFFmpeg()
// @ffmpeg/ffmpeg  → window.FFmpegWASM  → { FFmpeg }
// @ffmpeg/util    → window.FFmpegUtil  → { fetchFile, toBlobURL }
let FFmpeg, fetchFile, toBlobURL;

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();           // apply saved theme before paint
  loadFromStorage();
  setupDropZone();
  setupControls();
  setupAdvancedPanel();
  setupAdblockDetection();
  applyURLPreset();      // pre-select format from ?to=mkv in URL
  renderHistory();
  renderQueue();

  // Start loading FFmpeg.wasm in the background
  initFFmpeg();

  // Mobile FAB wiring
  const mobileFab = document.getElementById('mobile-convert-btn');
  if (mobileFab) mobileFab.addEventListener('click', convertAll);
});

/* ═══════════════════════════════════════════════════════════════
   THEME MANAGER
   Persists to localStorage. Supports: dark | light | system
═══════════════════════════════════════════════════════════════ */

function initTheme() {
  const saved = localStorage.getItem('convium_theme') || 'system';
  applyTheme(saved);
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark')  root.setAttribute('data-theme', 'dark');
  else if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme'); // let system CSS media query decide

  localStorage.setItem('convium_theme', theme);

  // Sync all theme buttons on page
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Called by inline onclick on theme buttons
function setTheme(theme) { applyTheme(theme); }
window.setTheme = setTheme;

/* ═══════════════════════════════════════════════════════════════
   URL PRESET LOADER
   Reads ?from=mp4&to=mkv from URL and pre-selects the format.
   Used by sub-pages to embed the full converter with a preset.
═══════════════════════════════════════════════════════════════ */

function applyURLPreset() {
  const params = new URLSearchParams(location.search);
  const to = params.get('to');
  if (!to) return;

  const sel = document.getElementById('format-select');
  if (!sel) return;

  // Try to find exact match or closest option
  const option = [...sel.options].find(o => o.value.toLowerCase() === to.toLowerCase());
  if (option) {
    sel.value = option.value;
    console.log(`[Convium] URL preset: output format set to ${option.value}`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FFMPEG INITIALIZATION
   Uses UMD build to avoid Worker CORS issues on any host.
   Loads the core from unpkg CDN with crossOriginIsolated support.
═══════════════════════════════════════════════════════════════ */

async function initFFmpeg() {
  if (state.ffmpegLoaded || state.ffmpegLoading) return;
  state.ffmpegLoading = true;

  // ── Warn if opened as file:// (SharedArrayBuffer is blocked by browsers) ──
  if (location.protocol === 'file:') {
    showFileProtocolWarning();
    state.ffmpegLoading = false;
    showApp();
    return;
  }

  try {
    // ── Extract FFmpeg constructor from UMD global ──────────────────────────
    // @ffmpeg/ffmpeg UMD exposes window.FFmpegWASM = { FFmpeg }
    const ffmpegLib = window.FFmpegWASM;
    if (!ffmpegLib || !ffmpegLib.FFmpeg) {
      throw new Error('@ffmpeg/ffmpeg UMD script not loaded — check CDN connection');
    }
    FFmpeg = ffmpegLib.FFmpeg;

    // ── Extract fetchFile + toBlobURL from @ffmpeg/util UMD ────────────────
    // @ffmpeg/util UMD exposes window.FFmpegUtil = { fetchFile, toBlobURL, ... }
    const utilLib = window.FFmpegUtil;
    if (!utilLib || !utilLib.fetchFile) {
      throw new Error('@ffmpeg/util UMD script not loaded — check CDN connection');
    }
    fetchFile = utilLib.fetchFile;
    toBlobURL = utilLib.toBlobURL; // may be undefined in some builds — handled below

    // ── Create FFmpeg instance ──────────────────────────────────────────────
    state.ffmpeg = new FFmpeg();

    state.ffmpeg.on('log', ({ message }) => {
      console.debug('[ffmpeg]', message);
    });

    state.ffmpeg.on('progress', ({ progress }) => {
      updateCurrentFileProgress(progress);
    });

    // ── Load FFmpeg core ────────────────────────────────────────────────────
    // With COOP/COEP headers → multithreading enabled via SharedArrayBuffer
    // Without headers → single-threaded fallback
    const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/umd';
    const WORKER_BASE = '/ffmpeg'; // Local path

    const loadConfig = {
      coreURL:   await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`,       'text/javascript'),
      wasmURL:   await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`,     'application/wasm'),
      workerURL: await toBlobURL(`${WORKER_BASE}/ffmpeg-core.worker.js`, 'text/javascript'),
    };

await state.ffmpeg.load(loadConfig);
    // If multithreading available, try to add worker URL (falls back gracefully if unavailable)
    if (isMultiThreadingAvailable && typeof toBlobURL === 'function') {
      try {
        loadConfig.workerURL = await toBlobURL(`${BASE}/ffmpeg-core.worker.js`, 'text/javascript');
      } catch (e) {
        console.debug('[Convium] Worker not found at CDN, using single-threaded core');
      }
    }

    await state.ffmpeg.load(loadConfig);

    state.ffmpegLoaded = true;
    console.log('%c[Convium] FFmpeg.wasm ready ✓', 'color:#7c6af7;font-weight:bold');

  } catch (err) {
    console.warn('[Convium] FFmpeg failed to load:', err.message);
    // Images + Documents still work without FFmpeg.
    // Video/Audio will show a friendly error if attempted.
  } finally {
    state.ffmpegLoading = false;
    showApp();
  }

}

/**
 * Show a warning banner when the page is opened via file:// protocol.
 * file:// treats every page as a unique origin — SharedArrayBuffer and
 * dynamic module imports are blocked by browsers for security reasons.
 * The fix is dead simple: run a local dev server (one command below).
 */
function showFileProtocolWarning() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:9999;
    background:#f76a7c;color:#fff;padding:14px 20px;
    font-family:'DM Sans',sans-serif;font-size:14px;
    display:flex;align-items:center;gap:16px;
  `;
  banner.innerHTML = `
    <strong>⚠️ file:// protocol detected</strong>
    <span>Video/Audio conversion requires a local server. Run:</span>
    <code style="background:rgba(0,0,0,0.25);padding:4px 10px;border-radius:6px;font-size:13px;">
      npx serve . &nbsp;|&nbsp; python -m http.server &nbsp;|&nbsp; VS Code Live Server
    </code>
    <span style="margin-left:auto;cursor:pointer;font-size:18px" onclick="this.parentElement.remove()">×</span>
  `;
  document.body.prepend(banner);
}

function showApp() {
  document.getElementById('wasm-loader')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
}

/* ═══════════════════════════════════════════════════════════════
   DROP ZONE
═══════════════════════════════════════════════════════════════ */

function setupDropZone() {
  const zone  = document.getElementById('drop-zone');
  const input = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');

  if (!zone) return;

  // Click to browse
  zone.addEventListener('click', () => input?.click());
  browseBtn?.addEventListener('click', e => { e.stopPropagation(); input?.click(); });

  // Keyboard accessibility
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input?.click(); }
  });

  // Drag events
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragging');
  });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('dragging');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragging');
    handleDropItems(e.dataTransfer.items);
  });

  // File input change
  input?.addEventListener('change', () => {
    if (input.files) addFiles([...input.files]);
    input.value = '';
  });
}

async function handleDropItems(items) {
  const files = [];
  const traversals = [];

  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      traversals.push(traverseDirectory(entry, files));
    } else if (entry?.isFile) {
      traversals.push(new Promise(res => entry.file(f => { files.push(f); res(); })));
    } else {
      const f = item.getAsFile?.();
      if (f) files.push(f);
    }
  }

  await Promise.all(traversals);
  addFiles(files);
}

function traverseDirectory(dirEntry, acc) {
  return new Promise(resolve => {
    const reader = dirEntry.createReader();
    reader.readEntries(entries => {
      const ops = entries.map(e =>
        e.isDirectory
          ? traverseDirectory(e, acc)
          : new Promise(r => e.file(f => { acc.push(f); r(); }))
      );
      Promise.all(ops).then(resolve);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   FILE MANAGEMENT
═══════════════════════════════════════════════════════════════ */

function addFiles(rawFiles) {
  const newEntries = rawFiles.map(f => ({
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    file: f,
    name: f.name,
    size: f.size,
    type: detectType(f),
    status: 'pending',
    progress: 0,
    outputBlob: null,
    outputName: null,
    error: null,
    preview: null,
  }));

  state.files.push(...newEntries);

  // Generate previews for images
  newEntries.forEach(e => {
    if (e.type === 'image') generatePreview(e);
  });

  renderQueue();
  updateConvertButton();
}

function detectType(file) {
  const m = file.type;
  const n = file.name.toLowerCase();
  if (m.startsWith('video/') || /\.(mp4|mkv|mov|avi|flv|webm|ogv|3gp|m4v|ts|wmv)$/.test(n)) return 'video';
  if (m.startsWith('audio/') || /\.(mp3|aac|wav|flac|ogg|m4a|opus|wma)$/.test(n)) return 'audio';
  if (m.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|ico|tiff)$/.test(n)) return 'image';
  if (/\.(zip|rar|7z|tar|gz|bz2)$/.test(n)) return 'archive';
  return 'document';
}

function getFileIcon(type) {
  return { video: '🎬', audio: '🎵', image: '🖼️', document: '📄', archive: '🗜️' }[type] || '📁';
}

function removeFile(id) {
  state.files = state.files.filter(f => f.id !== id);
  renderQueue();
  updateConvertButton();
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER QUEUE
═══════════════════════════════════════════════════════════════ */

function renderQueue() {
  const list  = document.getElementById('file-list');
  const empty = document.getElementById('queue-empty');
  const stats = document.getElementById('queue-stats');
  if (!list) return;

  list.innerHTML = '';

  if (state.files.length === 0) {
    empty?.classList.remove('hidden');
    if (stats) stats.textContent = '';
    return;
  }
  empty?.classList.add('hidden');

  const done = state.files.filter(f => f.status === 'done').length;
  if (stats) stats.textContent = `${done}/${state.files.length} done`;

  state.files.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.id = entry.id;

    const thumbHtml = entry.preview
      ? `<img src="${entry.preview}" alt="preview" />`
      : `<span>${getFileIcon(entry.type)}</span>`;

    li.innerHTML = `
      <div class="file-thumb">${thumbHtml}</div>
      <div class="file-info">
        <div class="file-name" title="${escHtml(entry.name)}">${escHtml(entry.name)}</div>
        <div class="file-meta">${entry.type.toUpperCase()} · ${formatSize(entry.size)}</div>
        ${entry.error ? `<div class="file-meta" style="color:var(--error)">${escHtml(entry.error)}</div>` : ''}
        ${entry.status === 'converting' ? `<div class="file-progress"><div class="file-progress-bar" style="width:${entry.progress * 100}%"></div></div>` : ''}
      </div>
      <div class="file-status">
        <span class="status-badge ${entry.status}">${entry.status}</span>
      </div>
      <div class="file-actions">
        ${entry.status === 'done' && entry.outputBlob ? `<button class="file-action-btn" onclick="downloadFile('${entry.id}')">⬇ Save</button>` : ''}
        <button class="file-action-btn danger" onclick="removeFile('${entry.id}')">✕</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}
/* ═══════════════════════════════════════════════════════════════
   PREVIEW GENERATION
═══════════════════════════════════════════════════════════════ */

function generatePreview(entry) {
  const reader = new FileReader();
  reader.onload = e => {
    entry.preview = e.target.result;
    // Update just the thumb
    const el = document.querySelector(`[data-id="${entry.id}"] .file-thumb`);
    if (el) el.innerHTML = `<img src="${entry.preview}" alt="preview" />`;
  };
  reader.readAsDataURL(entry.file);
}

/* ═══════════════════════════════════════════════════════════════
   CONTROLS SETUP
═══════════════════════════════════════════════════════════════ */

function setupControls() {
  document.getElementById('convert-all-btn')?.addEventListener('click', convertAll);
  document.getElementById('clear-all-btn')?.addEventListener('click', clearAll);
  document.getElementById('clear-history-btn')?.addEventListener('click', clearHistory);
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);

  document.getElementById('profile-select')?.addEventListener('change', e => {
    if (e.target.value) applyProfile(e.target.value);
  });

  const qlSlider = document.getElementById('img-quality');
  const qlOut    = document.getElementById('img-quality-val');
  qlSlider?.addEventListener('input', () => { if (qlOut) qlOut.textContent = qlSlider.value; });

  const pdfPass  = document.getElementById('doc-pdf-pass');
  const passWrap = document.getElementById('doc-pass-wrap');
  pdfPass?.addEventListener('change', () => {
    if (passWrap) passWrap.style.display = pdfPass.checked ? 'flex' : 'none';
  });
}

function updateConvertButton() {
  const n = state.files.filter(f => f.status === 'pending' || f.status === 'failed').length;
  const btn      = document.getElementById('convert-all-btn');
  const mobileBtn = document.getElementById('mobile-convert-btn');
  const badge    = document.getElementById('file-count-badge');

  if (badge) badge.textContent = n;
  if (btn)   btn.disabled = n === 0 || state.converting;
  if (mobileBtn) mobileBtn.disabled = n === 0 || state.converting;
}

function clearAll() {
  state.files = [];
  renderQueue();
  updateConvertButton();
}

/* ═══════════════════════════════════════════════════════════════
   ADVANCED PANEL
═══════════════════════════════════════════════════════════════ */

function setupAdvancedPanel() {
  const toggle = document.getElementById('advanced-toggle');
  const body   = document.getElementById('advanced-body');
  if (!toggle || !body) return;

  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });
}

/* ═══════════════════════════════════════════════════════════════
   PROFILES
═══════════════════════════════════════════════════════════════ */

const BUILT_IN_PROFILES = {
  instagram: { format: 'mp4', 'v-codec': 'libx264', 'v-res': 'scale=1080:-2', 'v-fps': '30', 'a-bitrate': '128k' },
  youtube:   { format: 'mp4', 'v-codec': 'libx264', 'v-res': 'scale=1920:-2', 'v-bitrate': '8000', 'a-bitrate': '192k' },
  twitter:   { format: 'mp4', 'v-codec': 'libx264', 'v-res': 'scale=1280:-2', 'v-fps': '30', 'a-bitrate': '128k' },
  print:     { format: 'pdf', 'doc-pagesize': 'A4', 'doc-margin': 'normal' },
  web:       { format: 'webp', 'img-quality': '75', 'img-exif': true },
};

function applyProfile(key) {
  const profile = BUILT_IN_PROFILES[key] || state.profiles[key];
  if (!profile) return;

  if (profile.format) {
    const sel = document.getElementById('format-select');
    if (sel) sel.value = profile.format;
  }

  Object.entries(profile).forEach(([k, v]) => {
    const el = document.getElementById(k);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
  });
}

function saveProfile() {
  const name = prompt('Profile name:');
  if (!name) return;
  state.profiles[name] = gatherSettings();
  localStorage.setItem('convium_profiles', JSON.stringify(state.profiles));

  const sel = document.getElementById('profile-select');
  if (sel && !sel.querySelector(`option[value="${name}"]`)) {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  }
}

function gatherSettings() {
  return {
    format:        getVal('format-select'),
    'v-codec':     getVal('v-codec'),
    'v-bitrate':   getVal('v-bitrate'),
    'v-fps':       getVal('v-fps'),
    'v-res':       getVal('v-res'),
    'v-trim-start':getVal('v-trim-start'),
    'v-trim-end':  getVal('v-trim-end'),
    'v-watermark': getVal('v-watermark'),
    'v-strip-meta':getChecked('v-strip-meta'),
    'v-extract-audio':getChecked('v-extract-audio'),
    'a-codec':     getVal('a-codec'),
    'a-bitrate':   getVal('a-bitrate'),
    'a-samplerate':getVal('a-samplerate'),
    'a-channels':  getVal('a-channels'),
    'img-width':   getVal('img-width'),
    'img-height':  getVal('img-height'),
    'img-quality': getVal('img-quality'),
    'img-aspect':  getChecked('img-aspect'),
    'img-exif':    getChecked('img-exif'),
    'doc-pagesize':getVal('doc-pagesize'),
    'doc-margin':  getVal('doc-margin'),
  };
}

const getVal     = id => document.getElementById(id)?.value || '';
const getChecked = id => document.getElementById(id)?.checked || false;

/* ═══════════════════════════════════════════════════════════════
   RENAME PATTERN
═══════════════════════════════════════════════════════════════ */

function applyRenamePattern(originalName, format, counter) {
  const pattern = getVal('rename-pattern') || '%N';
  const base = originalName.replace(/\.[^.]+$/, '');
  const today = new Date().toISOString().slice(0,10);
  return pattern
    .replace(/%N/g, base)
    .replace(/%D/g, today)
    .replace(/%C/g, String(counter).padStart(3, '0'))
    + '.' + format;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CONVERSION ORCHESTRATOR
═══════════════════════════════════════════════════════════════ */

async function convertAll() {
  if (state.converting) return;
  state.converting = true;
  updateConvertButton();

  const targetFormat = getVal('format-select');
  const settings     = gatherSettings();
  const pending      = state.files.filter(f => f.status === 'pending' || f.status === 'failed');

  // Show batch progress
  const batchProg = document.getElementById('batch-progress');
  const batchBar  = document.getElementById('batch-bar');
  const batchLbl  = document.getElementById('batch-label');
  if (batchProg) batchProg.style.display = 'flex';

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    entry.status = 'converting';
    entry.error  = null;
    entry.progress = 0;
    renderQueue();

    const batchPct = Math.round((i / pending.length) * 100);
    if (batchBar) batchBar.style.width = batchPct + '%';
    if (batchLbl) batchLbl.textContent = batchPct + '%';

    try {
      const result = await dispatchConversion(entry, targetFormat, settings);
      entry.status    = 'done';
      entry.outputBlob = result.blob;
      entry.outputName = applyRenamePattern(entry.name, targetFormat, ++state.counter);
      addToHistory(entry, targetFormat);
    } catch (err) {
      entry.status = 'failed';
      entry.error  = err.message || 'Conversion failed';
      console.error('[Convium] conversion error:', err);
    }

    renderQueue();
  }

  if (batchBar) batchBar.style.width = '100%';
  if (batchLbl) batchLbl.textContent = '100%';
  setTimeout(() => { if (batchProg) batchProg.style.display = 'none'; }, 2000);

  state.converting = false;
  updateConvertButton();
  renderHistory();
}

async function dispatchConversion(entry, format, settings) {
  const type = entry.type;

  if (type === 'image') return convertImage(entry, format, settings);
  if (type === 'video' || type === 'audio') return convertMedia(entry, format, settings);
  if (type === 'document') return convertDocument(entry, format, settings);
  if (type === 'archive') return convertArchive(entry, format, settings);

  throw new Error(`Unsupported file type: ${type}`);
}

/* ═══════════════════════════════════════════════════════════════
   MEDIA CONVERSION (FFmpeg.wasm)
═══════════════════════════════════════════════════════════════ */

async function convertMedia(entry, format, settings) {
  if (!state.ffmpegLoaded) throw new Error('FFmpeg not ready. Please wait and try again.');

  const ff = state.ffmpeg;
  const inputName  = `input_${entry.id}.${entry.name.split('.').pop()}`;
  const outputName = `output_${entry.id}.${format}`;

  // Write file into FFmpeg FS
  await ff.writeFile(inputName, await fetchFile(entry.file));

  // Build FFmpeg args
  const args = ['-i', inputName];

  // Trim
  const trimStart = parseFloat(settings['v-trim-start']);
  const trimEnd   = parseFloat(settings['v-trim-end']);
  if (!isNaN(trimStart) && trimStart > 0) args.push('-ss', String(trimStart));
  if (!isNaN(trimEnd)   && trimEnd   > 0) args.push('-to', String(trimEnd));

  // Extract audio only
  if (settings['v-extract-audio'] && entry.type === 'video') {
    args.push('-vn');
  }

  // Video codec & settings (skip for audio-only output)
  const audioFormats = ['mp3','aac','wav','flac','ogg','m4a','opus'];
  const isAudioOut = audioFormats.includes(format);

  if (!isAudioOut && entry.type === 'video') {
    const vcodec = settings['v-codec'] || 'libx264';
    if (vcodec !== 'copy') {
      args.push('-c:v', vcodec);
      const vbr = parseInt(settings['v-bitrate']);
      if (!isNaN(vbr) && vbr > 0) args.push('-b:v', `${vbr}k`);
      const fps = parseInt(settings['v-fps']);
      if (!isNaN(fps) && fps > 0) args.push('-r', String(fps));
      const res = settings['v-res'];
      if (res) args.push('-vf', res);
    } else {
      args.push('-c:v', 'copy');
    }

    // Watermark via drawtext filter
    const wm = settings['v-watermark'];
    if (wm) {
      const vfIdx = args.indexOf('-vf');
      const drawtext = `drawtext=text='${wm}':fontcolor=white:fontsize=24:x=10:y=10`;
      if (vfIdx !== -1) {
        args[vfIdx + 1] += `,${drawtext}`;
      } else {
        args.push('-vf', drawtext);
      }
    }
  }

  // Audio codec & settings
  const acodec = isAudioOut ? (settings['a-codec'] || 'libmp3lame') : 'aac';
  args.push('-c:a', acodec);
  if (settings['a-bitrate']) args.push('-b:a', settings['a-bitrate']);
  if (settings['a-samplerate']) args.push('-ar', settings['a-samplerate']);
  if (settings['a-channels']) args.push('-ac', settings['a-channels']);

  // Strip metadata
  if (settings['v-strip-meta']) args.push('-map_metadata', '-1');

  // libx264 needs this for wide compatibility
  if (format === 'mp4' && settings['v-codec'] !== 'copy') {
    args.push('-movflags', '+faststart');
  }

  args.push(outputName);

  await ff.exec(args);

  const data = await ff.readFile(outputName);

  // Cleanup FS
  try { await ff.deleteFile(inputName); } catch(_) {}
  try { await ff.deleteFile(outputName); } catch(_) {}

  const mimeMap = {
    mp4:'video/mp4', webm:'video/webm', mkv:'video/x-matroska',
    mov:'video/quicktime', avi:'video/x-msvideo', flv:'video/x-flv',
    ogv:'video/ogg', '3gp':'video/3gpp',
    mp3:'audio/mpeg', aac:'audio/aac', wav:'audio/wav',
    flac:'audio/flac', ogg:'audio/ogg', m4a:'audio/mp4',
  };
  const mime = mimeMap[format] || 'application/octet-stream';

  return { blob: new Blob([data.buffer], { type: mime }) };
}

function updateCurrentFileProgress(progress) {
  const converting = state.files.find(f => f.status === 'converting');
  if (!converting) return;
  converting.progress = progress;
  const bar = document.querySelector(`[data-id="${converting.id}"] .file-progress-bar`);
  if (bar) bar.style.width = `${progress * 100}%`;
}

/* ═══════════════════════════════════════════════════════════════
   IMAGE CONVERSION (Canvas API + browser-image-compression)
═══════════════════════════════════════════════════════════════ */

async function convertImage(entry, format, settings) {
  // Special SVG passthrough
  if (format === 'svg') {
    if (entry.name.endsWith('.svg')) {
      return { blob: entry.file };
    }
    throw new Error('Converting to SVG is not supported in browser. Try converting FROM SVG instead.');
  }

  const quality = parseInt(settings['img-quality'] || 85) / 100;
  const targetW = parseInt(settings['img-width'])  || 0;
  const targetH = parseInt(settings['img-height']) || 0;
  const keepAspect = settings['img-aspect'] !== false;

  // Load image
  const url    = URL.createObjectURL(entry.file);
  const img    = await loadImage(url);
  URL.revokeObjectURL(url);

  // Compute output dimensions
  let outW = img.naturalWidth;
  let outH = img.naturalHeight;

  if (targetW && targetH) {
    outW = targetW;
    outH = targetH;
  } else if (targetW) {
    outW = targetW;
    outH = keepAspect ? Math.round(img.naturalHeight * (targetW / img.naturalWidth)) : img.naturalHeight;
  } else if (targetH) {
    outH = targetH;
    outW = keepAspect ? Math.round(img.naturalWidth * (targetH / img.naturalHeight)) : img.naturalWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, outW, outH);

  const mimeMap = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif',   bmp: 'image/bmp',
    avif: 'image/avif',
  };
  const mime = mimeMap[format] || 'image/png';

  // Canvas toBlob quality param only works for jpeg/webp
  const blob = await new Promise((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas conversion failed')), mime, quality);
  });

  return { blob };
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = () => rej(new Error('Failed to load image'));
    img.src = src;
  });
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT CONVERSION
   Uses fetch-based Pandoc WASM where available,
   falls back to client-side text transformations.
═══════════════════════════════════════════════════════════════ */

async function convertDocument(entry, format, settings) {
  const srcText = await readAsText(entry.file);
  const srcName = entry.name.toLowerCase();

  let outputBlob;

  // ── Markdown → HTML
  if (srcName.endsWith('.md') && format === 'html') {
    const html = markdownToHtml(srcText, settings);
    outputBlob = new Blob([html], { type: 'text/html' });
  }
  // ── HTML → TXT
  else if ((srcName.endsWith('.html') || srcName.endsWith('.htm')) && format === 'txt') {
    const div = document.createElement('div');
    div.innerHTML = srcText;
    outputBlob = new Blob([div.textContent || ''], { type: 'text/plain' });
  }
  // ── HTML → Markdown
  else if ((srcName.endsWith('.html') || srcName.endsWith('.htm')) && format === 'md') {
    const md = htmlToMarkdown(srcText);
    outputBlob = new Blob([md], { type: 'text/markdown' });
  }
  // ── TXT / MD → TXT
  else if (format === 'txt') {
    outputBlob = new Blob([srcText], { type: 'text/plain' });
  }
  // ── Any text → PDF via print API
  else if (format === 'pdf') {
    outputBlob = await textToPdf(srcText, srcName, settings);
  }
  // ── Passthrough for same-format or unsupported
  else {
    outputBlob = new Blob([srcText], { type: entry.file.type || 'application/octet-stream' });
  }

  return { blob: outputBlob };
}

function readAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(new Error('File read failed'));
    r.readAsText(file);
  });
}

/** Minimal Markdown → HTML converter */
function markdownToHtml(md, settings) {
  const pageSize = settings['doc-pagesize'] || 'A4';
  let body = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup])/gm, '<p>$&');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:auto;padding:48px 32px;line-height:1.7}
@page{size:${pageSize};margin:20mm}</style></head><body>${body}</body></html>`;
}

/** Very basic HTML → Markdown */
function htmlToMarkdown(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  function walk(node) {
    if (node.nodeType === 3) return node.textContent;
    const tag = node.tagName?.toLowerCase();
    const kids = [...node.childNodes].map(walk).join('');
    if (tag === 'h1') return `\n# ${kids}\n`;
    if (tag === 'h2') return `\n## ${kids}\n`;
    if (tag === 'h3') return `\n### ${kids}\n`;
    if (tag === 'strong' || tag === 'b') return `**${kids}**`;
    if (tag === 'em' || tag === 'i') return `*${kids}*`;
    if (tag === 'code') return `\`${kids}\``;
    if (tag === 'a') return `[${kids}](${node.href})`;
    if (tag === 'li') return `- ${kids}\n`;
    if (tag === 'p') return `\n${kids}\n`;
    return kids;
  }
  return walk(div);
}

/** Text → PDF using browser print — creates a data URI */
async function textToPdf(text, srcName, settings) {
  const isMd   = srcName.endsWith('.md');
  const isHtml = srcName.endsWith('.html') || srcName.endsWith('.htm');
  let body = isHtml ? text : (isMd ? markdownToHtml(text, settings) : `<pre>${escHtml(text)}</pre>`);
  const pageSize = settings['doc-pagesize'] || 'A4';

  // We produce an HTML blob and let the user know to print-to-PDF
  // (true headless PDF generation requires Puppeteer which isn't client-side)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>@page{size:${pageSize}}body{font-family:Georgia,serif;margin:20mm}</style>
<script>window.onload=()=>window.print()<\/script></head><body>${body}</body></html>`;

  return new Blob([html], { type: 'text/html' });
}

/* ═══════════════════════════════════════════════════════════════
   ARCHIVE HANDLING (JSZip)
═══════════════════════════════════════════════════════════════ */

async function convertArchive(entry, format, settings) {
  if (typeof JSZip === 'undefined') throw new Error('JSZip not loaded');

  // Read the zip and re-pack as zip (for format=zip)
  const zip = await JSZip.loadAsync(entry.file);
  const out  = new JSZip();

  // Copy all files from source archive
  const fileNames = Object.keys(zip.files).filter(n => !zip.files[n].dir);
  for (const name of fileNames) {
    const data = await zip.files[name].async('arraybuffer');
    out.file(name, data);
  }

  const blob = await out.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return { blob };
}

/* ═══════════════════════════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════════════════════════ */

function downloadFile(id) {
  const entry = state.files.find(f => f.id === id);
  if (!entry?.outputBlob) return;

  const url = URL.createObjectURL(entry.outputBlob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = entry.outputName || 'converted_file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ═══════════════════════════════════════════════════════════════
   CONVERSION HISTORY
═══════════════════════════════════════════════════════════════ */

function addToHistory(entry, format) {
  const item = {
    id:      entry.id,
    name:    entry.outputName || entry.name,
    size:    entry.outputBlob?.size || 0,
    format,
    type:    entry.type,
    time:    Date.now(),
    blobUrl: URL.createObjectURL(entry.outputBlob),
  };

  state.history.unshift(item);
  if (state.history.length > 30) state.history.pop();
  saveHistory();
}

function renderHistory() {
  const list  = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!list) return;

  list.innerHTML = '';

  if (state.history.length === 0) {
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  state.history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="history-icon">${getFileIcon(item.type)}</span>
      <span class="history-name" title="${escHtml(item.name)}">${escHtml(item.name)}</span>
      <span class="history-size">${formatSize(item.size)}</span>
      <a class="history-dl" href="${item.blobUrl}" download="${escHtml(item.name)}">⬇</a>
    `;
    list.appendChild(li);
  });
}

function clearHistory() {
  // Revoke all blob URLs
  state.history.forEach(h => { try { URL.revokeObjectURL(h.blobUrl); } catch(_){} });
  state.history = [];
  saveHistory();
  renderHistory();
}

/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE PERSISTENCE
═══════════════════════════════════════════════════════════════ */

function saveHistory() {
  // Store without blobUrl (those don't survive page reload)
  const serializable = state.history.map(({ blobUrl, ...rest }) => rest);
  try { localStorage.setItem('convium_history', JSON.stringify(serializable)); } catch(_) {}
}

function loadFromStorage() {
  try {
    const h = localStorage.getItem('convium_history');
    if (h) state.history = JSON.parse(h);
  } catch(_) {}

  try {
    const p = localStorage.getItem('convium_profiles');
    if (p) state.profiles = JSON.parse(p);
    // Inject custom profiles into select
    const sel = document.getElementById('profile-select');
    if (sel) {
      Object.keys(state.profiles).forEach(name => {
        if (!sel.querySelector(`option[value="${name}"]`)) {
          const opt = document.createElement('option');
          opt.value = name; opt.textContent = name;
          sel.appendChild(opt);
        }
      });
    }
  } catch(_) {}
}

/* ═══════════════════════════════════════════════════════════════
   ADBLOCK DETECTION
═══════════════════════════════════════════════════════════════ */

function setupAdblockDetection() {
  // Try to fetch a resource that adblockers typically block
  const decoy = document.createElement('div');
  decoy.className = 'adsbox ad ads ad-banner advertisement';
  decoy.style.cssText = 'width:1px;height:1px;position:absolute;top:-9999px;';
  document.body.appendChild(decoy);

  setTimeout(() => {
    const blocked = decoy.offsetHeight === 0 || decoy.offsetParent === null;
    document.body.removeChild(decoy);
    if (blocked && !localStorage.getItem('convium_adblock_dismissed')) {
      document.getElementById('adblock-notice')?.classList.remove('hidden');
    }
  }, 200);
}

function dismissAdblock() {
  document.getElementById('adblock-notice')?.classList.add('hidden');
  localStorage.setItem('convium_adblock_dismissed', '1');
}

// Expose globally for inline onclick handlers
window.dismissAdblock = dismissAdblock;
window.downloadFile   = downloadFile;
window.removeFile     = removeFile;

/* ═══════════════════════════════════════════════════════════════
   SERVICE WORKER REGISTRATION (offline support)
═══════════════════════════════════════════════════════════════ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW optional — silently fail
    });
  });
}
