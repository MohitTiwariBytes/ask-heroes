// ---------------------------------------------------------------------------
// Shared system for loading third-party images without hitting the browser's
// CORS policy.
//
// A plain <img src="https://other-site.com/x.jpg"> always displays fine —
// CORS only enters the picture the moment something tries to read the pixels
// back out: canvas 2D (drawImage + getImageData/toDataURL), a WebGL texture
// upload, or html-to-image's DOM capture (which fetches the image to inline
// it as a data URI). Without an `Access-Control-Allow-Origin` header from the
// image's own host, the browser blocks that read and logs a CORS error, or
// silently taints the canvas.
//
// The fix is never something we can do from this side alone (the response
// header has to come from the image's server), so the system here is:
//   1. Try the URL directly, with crossOrigin="anonymous" so a CORS-enabled
//      host works with no extra hop.
//   2. If that fails, retry through images.weserv.nl, a public proxy that
//      re-serves any publicly reachable image with permissive CORS headers
//      attached — for the (common) case where the original host sends none.
// ---------------------------------------------------------------------------

export function isCrossOrigin(url) {
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

// images.weserv.nl wants the URL without its scheme, and always answers with
// `Access-Control-Allow-Origin: *`.
export function toCorsProxyUrl(url, { width } = {}) {
  const stripped = url.replace(/^https?:\/\//, "");
  const w = width ? `&w=${width}` : "";
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}${w}`;
}

export function loadImageElement(url, { crossOrigin = "anonymous" } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Loads an image, transparently retrying through the CORS proxy if the
// direct attempt fails (wrong host CORS setup, hotlink protection, etc).
// Resolves with whichever HTMLImageElement actually loaded; rejects only if
// both attempts fail.
export function loadImageWithCorsFallback(
  url,
  { proxy = toCorsProxyUrl, crossOrigin = "anonymous" } = {},
) {
  return loadImageElement(url, { crossOrigin }).catch((err) => {
    if (!proxy) throw err;
    return loadImageElement(proxy(url), { crossOrigin });
  });
}

// Props to spread onto a plain JSX <img>, for cases that don't go through
// canvas/WebGL directly but still need to survive DOM capture (html-to-image
// fetches the image to embed it, which is itself subject to CORS). Routes
// cross-origin sources through the proxy up front and falls back to the raw
// URL — un-embeddable but still visible — if the proxy itself fails.
export function corsImgProps(url, { crossOrigin = "anonymous", proxy = toCorsProxyUrl } = {}) {
  if (!url || !isCrossOrigin(url)) return { src: url };
  return {
    src: proxy(url),
    crossOrigin,
    onError: (e) => {
      const img = e.currentTarget;
      if (img.dataset.corsFallback) return;
      img.dataset.corsFallback = "1";
      img.removeAttribute("crossorigin");
      img.src = url;
    },
  };
}
