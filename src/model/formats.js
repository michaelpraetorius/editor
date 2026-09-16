// Format-Definitionen (Seitenverhältnisse) aus dem Formatkatalog.
// w×h in px; Safe-Zonen normalisiert 0..1, damit sie mit dem Canvas skalieren.
// Reihenfolge = Anzeige-Reihenfolge; `group` bündelt die Formate im Dropdown.

// Gleichmäßiger Rand (Anteil der kürzeren Kante) als Standard-Safe-Zone.
function uni(w, h, pct = 0.06) {
  const m = Math.round(Math.min(w, h) * pct);
  return { top: m / h, bottom: m / h, left: m / w, right: m / w };
}
function F(id, group, label, w, h, safe) {
  return { id, group, label, w, h, safe: safe || uni(w, h) };
}

export const FORMATS = {
  // Social – Hochformat
  '9-16':        F('9-16', 'Social · Hochformat', 'Story / Reel · 1080×1920 (9:16)', 1080, 1920, { top: 220 / 1920, bottom: 500 / 1920, left: 80 / 1080, right: 180 / 1080 }),
  '4-5':         F('4-5', 'Social · Hochformat', 'Feed / Karussell · 1080×1350 (4:5)', 1080, 1350, { top: 80 / 1350, bottom: 80 / 1350, left: 80 / 1080, right: 80 / 1080 }),
  '3-4':         F('3-4', 'Social · Hochformat', 'Feed 3:4 · 1080×1440', 1080, 1440),
  'pin-2-3':     F('pin-2-3', 'Social · Hochformat', 'Pinterest Pin · 1000×1500 (2:3)', 1000, 1500),

  // Social – Quadrat & Querformat
  '1-1':         F('1-1', 'Social · Quadrat & Quer', 'Quadrat · 1080×1080 (1:1)', 1080, 1080, { top: 80 / 1080, bottom: 80 / 1080, left: 80 / 1080, right: 80 / 1080 }),
  '1-91':        F('1-91', 'Social · Quadrat & Quer', 'Feed Querformat · 1080×566 (1,91:1)', 1080, 566),

  // Web & Video (quer)
  '16-9':        F('16-9', 'Web & Video', 'Video / Präsentation · 1920×1080 (16:9)', 1920, 1080),
  'x-post':      F('x-post', 'Web & Video', 'X Post · 1600×900 (16:9)', 1600, 900),
  'yt-thumb':    F('yt-thumb', 'Web & Video', 'YouTube Thumbnail · 1280×720 (16:9)', 1280, 720),
  'blog-16-9':   F('blog-16-9', 'Web & Video', 'Blog-Bild · 1200×675 (16:9)', 1200, 675),
  'og':          F('og', 'Web & Video', 'Open Graph / Link · 1200×630 (1,91:1)', 1200, 630),

  // Display – Rectangle & Hochformat
  'rect':        F('rect', 'Display · Rectangle', 'Medium Rectangle · 300×250 (6:5)', 300, 250, uni(300, 250, 0.04)),
  'rect-l':      F('rect-l', 'Display · Rectangle', 'Large Rectangle · 336×280 (6:5)', 336, 280, uni(336, 280, 0.04)),
  'halfpage':    F('halfpage', 'Display · Rectangle', 'Halfpage · 300×600 (1:2)', 300, 600, uni(300, 600, 0.04)),
  'portrait-ad': F('portrait-ad', 'Display · Rectangle', 'Portrait · 300×1050 (2:7)', 300, 1050, uni(300, 1050, 0.04)),
  'interstitial':F('interstitial', 'Display · Rectangle', 'Interstitial · 320×480 (2:3)', 320, 480, uni(320, 480, 0.04)),

  // Display – Banner & Skyscraper
  'leaderboard': F('leaderboard', 'Display · Banner', 'Leaderboard · 728×90', 728, 90, uni(728, 90, 0.06)),
  'super-lb':    F('super-lb', 'Display · Banner', 'Super Leaderboard · 970×90', 970, 90, uni(970, 90, 0.06)),
  'billboard':   F('billboard', 'Display · Banner', 'Billboard · 970×250', 970, 250, uni(970, 250, 0.05)),
  'skyscraper':  F('skyscraper', 'Display · Banner', 'Skyscraper · 120×600 (1:5)', 120, 600, uni(120, 600, 0.05)),
  'wide-sky':    F('wide-sky', 'Display · Banner', 'Wide Skyscraper · 160×600 (4:15)', 160, 600, uni(160, 600, 0.05)),
  'mobile-lb':   F('mobile-lb', 'Display · Banner', 'Mobile Leaderboard · 320×50', 320, 50, uni(320, 50, 0.06)),
  'mobile-banner':F('mobile-banner', 'Display · Banner', 'Mobile Banner · 300×50', 300, 50, uni(300, 50, 0.06)),
  'large-mobile':F('large-mobile', 'Display · Banner', 'Large Mobile Banner · 320×100', 320, 100, uni(320, 100, 0.06)),

  // Header & Banner
  'x-header':    F('x-header', 'Header & Banner', 'X Header · 1500×500 (3:1)', 1500, 500),
  'li-banner':   F('li-banner', 'Header & Banner', 'LinkedIn Profil-Banner · 1584×396 (4:1)', 1584, 396),
  'fb-cover':    F('fb-cover', 'Header & Banner', 'Facebook Titelbild · 851×315', 851, 315),
  'li-company':  F('li-company', 'Header & Banner', 'LinkedIn Seiten-Titelbild · 1128×191', 1128, 191),
  'yt-channel':  F('yt-channel', 'Header & Banner', 'YouTube Kanalbanner · 2560×1440 (16:9)', 2560, 1440),

  // Newsletter & E-Mail
  'nl-hero':     F('nl-hero', 'Newsletter', 'Header / Hero · 600×300 (2:1)', 600, 300, uni(600, 300, 0.04)),
  'nl-content':  F('nl-content', 'Newsletter', 'Content-Bild · 600×338 (16:9)', 600, 338, uni(600, 338, 0.04)),
  'nl-signature':F('nl-signature', 'Newsletter', 'Signatur-Banner · 600×150', 600, 150, uni(600, 150, 0.05)),
};

export const DEFAULT_FORMAT = '9-16';

export function getFormat(id) {
  return FORMATS[id] || FORMATS[DEFAULT_FORMAT];
}

// Safe-Rect in Pixeln für ein konkretes Format (x, y, w, h).
export function safeRect(fmt) {
  const x = fmt.safe.left * fmt.w;
  const y = fmt.safe.top * fmt.h;
  const w = fmt.w - (fmt.safe.left + fmt.safe.right) * fmt.w;
  const h = fmt.h - (fmt.safe.top + fmt.safe.bottom) * fmt.h;
  return { x, y, w, h };
}
