// PDF-Export (Konzept 7): PNGs in seitengroße PDF-Seiten setzen via jsPDF.
import { withOffscreen } from './offscreen.js';
import { getFormat } from '../model/formats.js';

export async function exportPDF(store, onProgress) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error('jsPDF nicht geladen');
  const fmt = getFormat(store.format);
  const r = await withOffscreen(store.deck);
  const slides = store.deck.slides;

  const pdf = new jsPDF({ orientation: fmt.h >= fmt.w ? 'portrait' : 'landscape',
    unit: 'px', format: [fmt.w, fmt.h], compress: true });

  for (let i = 0; i < slides.length; i++) {
    const url = r.dataURL(slides[i], store.deck, store.format, null);
    if (i > 0) pdf.addPage([fmt.w, fmt.h], fmt.h >= fmt.w ? 'portrait' : 'landscape');
    pdf.addImage(url, 'PNG', 0, 0, fmt.w, fmt.h);
    onProgress?.((i + 1) / slides.length);
    await new Promise((res) => setTimeout(res, 0));
  }
  pdf.save(`deck_${store.format}.pdf`);
  r.destroy();
}
