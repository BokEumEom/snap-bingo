// Downscale + re-encode an uploaded photo before it's persisted.
//
// Cell photos are stored as base64 data URLs (Toss `Storage` / localStorage
// fallback). Full-resolution phone photos are several MB each, so a 9-cell
// board quickly exhausts the ~5MB quota and slows grid/card rendering. We fit
// the longest edge to `maxEdge` and re-encode as JPEG so each photo stays
// small. Immutable: returns a new data URL; the input `File` is never mutated.
// Any failure (decode/canvas) falls back to the original upload so the user is
// never blocked.

interface ResizeOptions {
  /** Longest edge in px. Larger images are scaled down to fit. @default 1080 */
  maxEdge?: number;
  /** JPEG quality, 0..1. @default 0.8 */
  quality?: number;
  /** Output MIME type. @default 'image/jpeg' */
  mimeType?: string;
}

export async function resizeImageDataUrl(
  file: File,
  { maxEdge = 1080, quality = 0.8, mimeType = 'image/jpeg' }: ResizeOptions = {},
): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);

  try {
    const img = await loadImage(originalDataUrl);
    const longestEdge = Math.max(img.width, img.height);
    const scale = Math.min(1, maxEdge / longestEdge);

    // Already within budget — keep the original bytes untouched.
    if (scale >= 1) {
      return originalDataUrl;
    }

    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (context == null) {
      return originalDataUrl;
    }
    context.drawImage(img, 0, 0, targetWidth, targetHeight);

    const resized = canvas.toDataURL(mimeType, quality);
    // Guard: if re-encoding grew the payload (rare, e.g. tiny PNGs), keep original.
    return resized.length < originalDataUrl.length ? resized : originalDataUrl;
  } catch (error) {
    console.error('사진 리사이즈 실패, 원본을 사용해요:', error);
    return originalDataUrl;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader가 파일을 읽지 못했어요.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 디코딩하지 못했어요.'));
    img.src = src;
  });
}
