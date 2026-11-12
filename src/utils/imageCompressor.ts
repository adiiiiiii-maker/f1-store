/**
 * Client-Side Image Compression using HTML5 Canvas
 * Resizes image to max 800x800px (preserving aspect ratio) and exports as image/jpeg at 0.72 quality.
 * Enforces a strict size guard (< 900,000 bytes) with automatic secondary compression passes to prevent
 * Firestore document size limit errors (1,048,576 bytes limit).
 */

export function getBase64ByteSize(dataUrl: string): number {
  if (!dataUrl) return 0;
  if (!dataUrl.startsWith('data:')) return dataUrl.length;
  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index === -1) return dataUrl.length;
  const base64Content = dataUrl.substring(base64Index + 8);
  const padding = base64Content.endsWith('==') ? 2 : base64Content.endsWith('=') ? 1 : 0;
  return Math.round((base64Content.length * 3) / 4) - padding;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image in browser for compression'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      if (!source.type.startsWith('image/')) {
        reject(new Error('Selected file is not a valid image format'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk'));
      reader.readAsDataURL(source);
    }
  });
}

function canvasToJpeg(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): string {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Preserve aspect ratio within maxWidth x maxHeight
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Smooth dark-emerald background fill for transparent images to avoid black artifacts in JPEG
  ctx.fillStyle = '#041a12';
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Compresses an image with automatic multi-pass reduction ensuring result is always under 900KB.
 */
export async function compressImage(
  source: File | string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.72,
  maxBytes: number = 900000
): Promise<string> {
  const img = await loadImage(source);

  // Pass 1: Standard 800px max dimension @ 0.72 quality as requested
  let compressed = canvasToJpeg(img, maxWidth, maxHeight, quality);
  let byteSize = getBase64ByteSize(compressed);

  // Pass 2: If still over 900,000 bytes, automatically re-compress at 0.5 quality
  if (byteSize > maxBytes) {
    console.warn(`[Image Compressor] Pass 1 size (${formatBytes(byteSize)}) exceeds limit. Applying Pass 2 (0.5 quality, 640px max)...`);
    compressed = canvasToJpeg(img, Math.min(maxWidth, 640), Math.min(maxHeight, 640), 0.5);
    byteSize = getBase64ByteSize(compressed);
  }

  // Pass 3: Emergency safeguard if image is massive (e.g. 50+ MP RAW)
  if (byteSize > maxBytes) {
    console.warn(`[Image Compressor] Pass 2 size (${formatBytes(byteSize)}) still exceeds limit. Applying Pass 3 (0.35 quality, 500px max)...`);
    compressed = canvasToJpeg(img, Math.min(maxWidth, 500), Math.min(maxHeight, 500), 0.35);
    byteSize = getBase64ByteSize(compressed);
  }

  if (byteSize > maxBytes) {
    throw new Error(`Image size (${formatBytes(byteSize)}) exceeds Firestore 1MB limit even after compression. Please choose a smaller image.`);
  }

  return compressed;
}

/**
 * Ensures any image URL or Base64 string is verified to be safe for Firestore document storage.
 */
export async function ensureSafeFirestoreImage(
  imageUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('data:image/')) {
    // External HTTP URL - size limit does not apply to URL strings
    return imageUrl;
  }

  const byteSize = getBase64ByteSize(imageUrl);
  // If already under 300 KB, it is guaranteed safe
  if (byteSize < 300000) {
    return imageUrl;
  }

  // Recompress to guarantee it is under 900KB
  return await compressImage(imageUrl, maxWidth, maxHeight, 0.72, 900000);
}
