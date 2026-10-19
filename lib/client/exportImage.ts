// lib/client/exportImage.ts — ubah elemen DOM menjadi gambar JPG di browser (tanpa library): salin gaya komputasi ke
// salinan elemen, bungkus dalam SVG <foreignObject>, gambar ke canvas.
//   data-export-skip  : elemen dibuang dari gambar (tombol, petunjuk)
//   data-export-only  : elemen tersembunyi di layar, tampil di gambar (judul bagian)
// Font situs (Geist) disematkan ke gambar: gambar SVG tidak bisa memakai font halaman, tanpa ini hasilnya jatuh ke Arial/serif yang kaku.
export type ExportFont = { css: string; stack: string };
let fontPromise: Promise<ExportFont | null> | null = null;
const b64 = (buf: ArrayBuffer) => {
  let bin = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(bin);
};
export function loadExportFont(): Promise<ExportFont | null> {
  fontPromise ??= (async () => {
    try {
      const faces: { url: string; range: string; weight: string }[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const r of Array.from(rules)) {
          if (!(r instanceof CSSFontFaceRule)) continue;
          const st = r.style;
          const fam = st.getPropertyValue('font-family').replace(/["']/g, '');
          if (!/geist/i.test(fam) || /mono|fallback/i.test(fam)) continue;
          const m = /url\(["']?([^"')]+?\.woff2[^"')]*)["']?\)/.exec(st.getPropertyValue('src'));
          if (m) faces.push({ url: new URL(m[1], sheet.href ?? location.href).href, range: st.getPropertyValue('unicode-range'), weight: st.getPropertyValue('font-weight') || '100 900' });
        }
      }
      if (!faces.length) return null;
      const bufs = await Promise.all(faces.map((f) => fetch(f.url).then((x) => x.arrayBuffer())));
      let registered = false;
      const css = faces.map((f, i) => {
        if (!registered && (!f.range || /U\+0000-00FF/i.test(f.range))) { // untuk canvas (judul gambar)
          registered = true;
          const ff = new FontFace('GeistExport', bufs[i], { weight: '100 900' });
          document.fonts.add(ff);
          void ff.load();
        }
        return `@font-face{font-family:'GeistExport';src:url(data:font/woff2;base64,${b64(bufs[i])}) format('woff2');font-weight:${f.weight};font-style:normal;${f.range ? `unicode-range:${f.range};` : ''}}`;
      }).join('');
      await document.fonts.ready;
      return { css, stack: "'GeistExport', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" };
    } catch {
      return null;
    }
  })();
  return fontPromise;
}

const SKIP = new Set(['animation', 'animation-name', 'transition', 'transition-property', 'pointer-events', 'cursor']);

const measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
function measure(font: string, text: string) {
  if (!measureCtx) return 0;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

export async function elementToCanvas(node: HTMLElement, opts: { background?: string; scale?: number } = {}): Promise<HTMLCanvasElement> {
  const font = await loadExportFont();
  const root = node.getBoundingClientRect();
  let width = Math.ceil(node.scrollWidth);

  // Salin gaya; wadah yang bisa digeser (overflow-x) dibuka penuh agar seluruh isinya ikut tergambar.
  const walk = (src: Element, dst: Element) => {
    const cs = getComputedStyle(src);
    let css = '';
    for (const name of Array.from(cs)) if (!SKIP.has(name)) css += `${name}:${cs.getPropertyValue(name)};`;
    if (font && !/mono/i.test(cs.fontFamily)) css += `font-family:${font.stack};-webkit-font-smoothing:antialiased;`; // angka/skor monospace tetap
    dst.setAttribute('style', css);
    const h = src as HTMLElement;
    if (cs.textOverflow === 'ellipsis') {
      // Jangan potong dengan "…" dan jangan pecah baris ("RT" / "010"): satu baris, huruf diperkecil seperlunya agar muat.
      const d = dst as HTMLElement;
      d.style.textOverflow = 'clip'; d.style.overflow = 'visible'; d.style.whiteSpace = 'nowrap'; d.style.minWidth = '0';
      if (font) {
        const px = parseFloat(cs.fontSize) || 14;
        const m = measure(`${cs.fontWeight} ${px}px GeistExport`, h.textContent ?? '');
        const avail = h.clientWidth;
        if (m > avail && avail > 0) d.style.fontSize = `${Math.max(px * 0.62, (px * avail) / m - 0.3).toFixed(2)}px`;
      }
    }
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && h.scrollWidth > h.clientWidth + 1) {
      (dst as HTMLElement).style.overflow = 'visible';
      (dst as HTMLElement).style.width = `${h.scrollWidth}px`;
      width = Math.max(width, Math.ceil(h.getBoundingClientRect().left - root.left + h.scrollWidth));
    }
    const sc = src.children, dc = dst.children;
    for (let i = 0; i < sc.length; i++) if (dc[i]) walk(sc[i], dc[i]);
  };
  // lebar/tinggi sebenarnya = tepi terjauh semua turunan (termasuk kartu yang digeser/ditransform)
  let height = Math.ceil(node.scrollHeight);
  node.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width || r.height) { width = Math.max(width, Math.ceil(r.right - root.left) + 8); height = Math.max(height, Math.ceil(r.bottom - root.top) + 8); }
  });
  height += 24; // cadangan bila teks membungkus lebih tinggi
  const clone = node.cloneNode(true) as HTMLElement;
  walk(node, clone);
  clone.querySelectorAll('[data-export-skip]').forEach((e) => e.remove());
  clone.querySelectorAll<HTMLElement>('[data-export-only]').forEach((e) => { e.style.display = 'block'; });
  if (clone.hasAttribute('data-export-only')) clone.style.display = 'block';

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.width = `${width}px`;
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${font ? `<defs><style>${font.css}</style></defs>` : ''}<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const load = () => new Promise<HTMLImageElement>((ok, bad) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => bad(new Error('Gagal merender gambar'));
    i.src = url;
  });
  let img = await load();
  if (font) { await new Promise((r) => setTimeout(r, 120)); img = await load(); } // putaran kedua: font tersemat sudah siap
  // batasi ukuran canvas (±16 juta piksel) agar tidak gagal di HP
  const scale = Math.max(0.5, Math.min(opts.scale ?? 2, Math.sqrt(16_000_000 / (width * height))));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');
  ctx.fillStyle = opts.background ?? '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Susun beberapa canvas ke bawah dengan kepala (label, judul, subjudul) dan kaki gambar. Minimalis, tanpa elemen yang saling menimpa.
export function stitchCanvases(parts: HTMLCanvasElement[], head: { title: string; subtitle?: string; label?: string; footer?: string }, background = '#020617'): HTMLCanvasElement {
  const pad = 56, gap = 44;
  const inner = Math.max(900, ...parts.map((p) => p.width));
  const width = inner + pad * 2;
  const fam = document.fonts.check("700 20px GeistExport") ? "GeistExport, system-ui, sans-serif" : "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  // ukur judul agar muat satu baris (mengecil bila panjang)
  const probe = document.createElement('canvas').getContext('2d');
  let tSize = 56;
  if (probe) { for (; tSize > 30; tSize -= 2) { probe.font = `800 ${tSize}px ${fam}`; if (probe.measureText(head.title).width <= inner) break; } }

  const yLabel = pad + 16;
  const yTitle = yLabel + 22 + tSize;
  const ySub = yTitle + 18 + 26;
  const headH = (head.subtitle ? ySub : yTitle) + 56;
  const footH = 84;
  const height = headH + parts.reduce((s, p, i) => s + p.height + (i ? gap : 0), 0) + footH;

  let out = document.createElement('canvas');
  out.width = width; out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'alphabetic';

  const spaced = (txt: string, x: number, y: number, ls: number) => { // teks huruf kapital berjarak
    const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ('letterSpacing' in c) { c.letterSpacing = `${ls}px`; ctx.fillText(txt, x, y); c.letterSpacing = '0px'; }
    else ctx.fillText(txt, x, y);
  };
  ctx.fillStyle = '#ff2bd6';
  ctx.font = `700 18px ${fam}`;
  spaced((head.label ?? 'AGENDA 17AN · RW 012').toUpperCase(), pad, yLabel, 4);
  ctx.fillStyle = '#f8fafc';
  ctx.font = `800 ${tSize}px ${fam}`;
  ctx.fillText(head.title, pad, yTitle);
  if (head.subtitle) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 26px ${fam}`;
    ctx.fillText(head.subtitle, pad, ySub, inner);
  }
  let y = headH;
  parts.forEach((p, i) => { if (i) y += gap; ctx.drawImage(p, pad, y); y += p.height; });

  ctx.fillStyle = '#475569';
  ctx.font = `500 20px ${fam}`;
  ctx.fillText(head.footer ?? `Portal RW 012 · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pad, height - 38);

  const area = width * height, MAX = 36_000_000; // batasi ukuran akhir
  if (area > MAX) {
    const k = Math.sqrt(MAX / area);
    const small = document.createElement('canvas');
    small.width = Math.round(width * k); small.height = Math.round(height * k);
    small.getContext('2d')?.drawImage(out, 0, 0, small.width, small.height);
    out = small;
  }
  return out;
}

export const canvasToJpg = (c: HTMLCanvasElement) =>
  new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('Gagal membuat JPG'))), 'image/jpeg', 0.92));

export async function elementToJpgBlob(node: HTMLElement, opts: { background?: string; scale?: number } = {}): Promise<Blob> {
  return canvasToJpg(await elementToCanvas(node, opts));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
