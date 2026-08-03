// PNG-Export (Konzept 7): Endzustand jeder Slide in voller Auflösung abgreifen.
import { withOffscreen } from './offscreen.js';

function download(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

export async function exportCurrentPNG(store) {
  const r = await withOffscreen(store.deck);
  const url = r.dataURL(store.slide, store.deck, store.format, null);
  download(url, `slide_${String(store.slideIndex + 1).padStart(2, '0')}_${store.format}.png`);
  r.destroy();
}

export async function exportAllPNG(store, onProgress) {
  const r = await withOffscreen(store.deck);
  const slides = store.deck.slides;
  for (let i = 0; i < slides.length; i++) {
    const url = r.dataURL(slides[i], store.deck, store.format, null);
    download(url, `slide_${String(i + 1).padStart(2, '0')}_${store.format}.png`);
    onProgress?.((i + 1) / slides.length);
    await new Promise((res) => setTimeout(res, 250)); // Browser-Download-Drossel
  }
  r.destroy();
}
