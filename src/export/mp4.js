// MP4-Export (Konzept 7): VideoEncoder (WebCodecs) + mp4-muxer, gespeist aus dem
// Canvas. Jeder Frame wird per paint(slide, t) exakt reproduziert -> deterministisch.
// mp4-muxer wird bei Bedarf dynamisch von esm.sh geladen (rein Browser, kein Build).

import { withOffscreen } from './offscreen.js';
import { getFormat } from '../model/formats.js';
import { getPreset } from '../render/motion.js';

const CODECS = ['avc1.640033', 'avc1.640028', 'avc1.4d0032', 'avc1.42e028', 'avc1.42001f'];

export function mp4Supported() {
  return typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';
}

async function pickCodec(width, height, fps) {
  for (const codec of CODECS) {
    try {
      const { supported } = await window.VideoEncoder.isConfigSupported({
        codec, width, height, bitrate: 8_000_000, framerate: fps,
      });
      if (supported) return codec;
    } catch {}
  }
  return null;
}

export async function exportMP4(store, { fps = 30, onProgress } = {}) {
  if (!mp4Supported()) {
    throw new Error('MP4-Export benötigt WebCodecs (Chrome/Edge). Nutze solange PNG/PDF.');
  }
  const fmt = getFormat(store.format);
  const { Muxer, ArrayBufferTarget } = await import('../../vendor/mp4-muxer.mjs');

  const codec = await pickCodec(fmt.w, fmt.h, fps);
  if (!codec) throw new Error('Kein passender H.264-Codec vom Browser unterstützt.');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: fmt.w, height: fmt.h },
    fastStart: 'in-memory',
  });
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder', e),
  });
  encoder.configure({ codec, width: fmt.w, height: fmt.h, bitrate: 8_000_000, framerate: fps });

  const r = await withOffscreen(store.deck);
  const slides = store.deck.slides;

  // Gesamt-Framecount für Fortschritt
  const durations = slides.map((s) => getPreset(s.motion || store.deck.theme.motion || 'calm').slideDuration);
  const frameCounts = durations.map((d) => Math.max(1, Math.round(d * fps)));
  const totalFrames = frameCounts.reduce((a, b) => a + b, 0);

  let globalFrame = 0;
  const frameDur = 1e6 / fps; // µs

  for (let si = 0; si < slides.length; si++) {
    const nFrames = frameCounts[si];
    for (let f = 0; f < nFrames; f++) {
      const tLocal = f / fps;
      const canvas = r.paint(slides[si], store.deck, store.format, tLocal);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(globalFrame * frameDur),
        duration: Math.round(frameDur),
      });
      encoder.encode(frame, { keyFrame: f === 0 });
      frame.close();
      globalFrame++;

      if (globalFrame % 4 === 0) {
        onProgress?.(globalFrame / totalFrames);
        // Encoder-Queue nicht überlaufen lassen
        if (encoder.encodeQueueSize > 12) await new Promise((res) => setTimeout(res, 0));
      }
    }
  }

  await encoder.flush();
  muxer.finalize();
  r.destroy();

  const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `deck_${store.format}.mp4`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  onProgress?.(1);
}
