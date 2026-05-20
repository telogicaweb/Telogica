// Client-side image compression. Resizes large images and re-encodes them
// so the resulting file stays under `maxBytes`. Returns the original file
// untouched when it already fits or when compression isn't possible (e.g.
// SVG / GIF).

export interface CompressImageOptions {
  maxBytes?: number;       // upper bound on output size (default 20 MB)
  maxDimension?: number;   // longest edge in px after first resize (default 2400)
  minDimension?: number;   // never shrink below this longest-edge (default 800)
  initialQuality?: number; // starting JPEG/WebP quality (default 0.85)
  minQuality?: number;     // lowest JPEG/WebP quality to try (default 0.5)
  mimeType?: string;       // output mime type (default 'image/jpeg')
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxBytes: 20 * 1024 * 1024,
  maxDimension: 2400,
  minDimension: 800,
  initialQuality: 0.85,
  minQuality: 0.5,
  mimeType: 'image/jpeg',
};

const loadImageBitmap = async (file: File): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality));

export async function compressImage(file: File, opts: CompressImageOptions = {}): Promise<File> {
  const cfg = { ...DEFAULTS, ...opts };

  if (!file.type.startsWith('image/')) return file;
  // Animated / vector formats: leave alone.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size <= cfg.maxBytes) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImageBitmap(file);
  } catch {
    return file;
  }

  let longestEdge = Math.max(img.width, img.height);
  let dimensionCap = Math.min(cfg.maxDimension, longestEdge);

  const outName = file.name.replace(/\.(png|webp|bmp|tiff?|heic|heif|jpg|jpeg)$/i, '') + '.jpg';

  while (dimensionCap >= cfg.minDimension) {
    const scale = dimensionCap / longestEdge;
    const targetW = Math.round(img.width * scale);
    const targetH = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    let quality = cfg.initialQuality;
    while (quality >= cfg.minQuality) {
      const blob = await canvasToBlob(canvas, cfg.mimeType, quality);
      if (blob && blob.size <= cfg.maxBytes) {
        return new File([blob], outName, { type: cfg.mimeType, lastModified: Date.now() });
      }
      quality -= 0.1;
    }

    // Still too big — shrink dimensions and try again.
    dimensionCap = Math.round(dimensionCap * 0.8);
  }

  // Give up gracefully — the caller can decide whether to reject the file.
  return file;
}
