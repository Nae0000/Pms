// Turns whatever someone pastes into the sheet's image column into a usable <img> src.
// Google Drive "share" links are converted to a direct thumbnail URL (file must be shared
// as "Anyone with the link").
export function roomImageSrc(url, width = 800) {
  if (!url) return "";
  const u = String(url).trim();
  if (u.startsWith("data:image")) return u;
  const m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ||
            u.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?[^#]*\bid=([\w-]+)/) ||
            u.match(/docs\.google\.com\/uc\?[^#]*\bid=([\w-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${width}`;
  return u;
}

export const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
