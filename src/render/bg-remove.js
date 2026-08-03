// Einfacher Background-Eraser für Cliparts: Flood-Fill von den Bildrändern.
// Entfernt nur den zusammenhängenden Hintergrund (Ränder), Innen-Flächen bleiben.
// Hintergrundfarbe = Mittel der vier Ecken; Toleranz per Kanal.

export function removeBackground(img, tol = 42) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  // Hintergrundfarbe aus den vier Ecken mitteln
  const cIdx = [0, (w - 1), (h - 1) * w, (h - 1) * w + (w - 1)];
  let br = 0, bg = 0, bb = 0;
  cIdx.forEach((p) => { const o = p * 4; br += d[o]; bg += d[o + 1]; bb += d[o + 2]; });
  br /= 4; bg /= 4; bb /= 4;

  const isBg = (p) => {
    const o = p * 4;
    return Math.abs(d[o] - br) <= tol && Math.abs(d[o + 1] - bg) <= tol && Math.abs(d[o + 2] - bb) <= tol;
  };

  const visited = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + (w - 1)); }

  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    if (!isBg(p)) continue;
    d[p * 4 + 3] = 0;                       // transparent
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  ctx.putImageData(id, 0, 0);
  return { src: cv.toDataURL('image/png'), w, h };
}
