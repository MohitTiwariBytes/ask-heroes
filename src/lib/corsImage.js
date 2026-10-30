export function isCrossOrigin(url) {
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

// images.weserv.nl wants the url without its scheme, and always answers with
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

export function loadImageWithCorsFallback(
  url,
  { proxy = toCorsProxyUrl, crossOrigin = "anonymous" } = {},
) {
  return loadImageElement(url, { crossOrigin }).catch((err) => {
    if (!proxy) throw err;
    return loadImageElement(proxy(url), { crossOrigin });
  });
}

export function corsImgProps(
  url,
  { crossOrigin = "anonymous", proxy = toCorsProxyUrl } = {},
) {
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
