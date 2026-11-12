/**
 * Default high-resolution payment QR code generator with luxury emerald styling.
 * Used when no custom image has been uploaded by the admin.
 */
export const DEFAULT_PAYMENT_QR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#041a12"/>
      <stop offset="100%" stop-color="#020d09"/>
    </linearGradient>
    <linearGradient id="neonEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#16c784"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4dc"/>
      <stop offset="50%" stop-color="#e5c98b"/>
      <stop offset="100%" stop-color="#b38738"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="320" height="320" rx="20" fill="url(#bgGrad)" stroke="#16c784" stroke-width="2.5" stroke-opacity="0.5"/>
  <rect x="12" y="12" width="296" height="296" rx="14" fill="none" stroke="#e5c98b" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.3"/>

  <!-- Top-left Position Detection Square -->
  <rect x="36" y="36" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="48" y="48" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>

  <!-- Top-right Position Detection Square -->
  <rect x="220" y="36" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="232" y="48" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>

  <!-- Bottom-left Position Detection Square -->
  <rect x="36" y="220" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="48" y="232" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>

  <!-- Grid modules simulation (Authentic QR Pattern) -->
  <g fill="#16c784" opacity="0.95">
    <!-- Row segments -->
    <rect x="116" y="38" width="14" height="14" rx="2"/>
    <rect x="142" y="38" width="28" height="14" rx="2"/>
    <rect x="184" y="38" width="14" height="14" rx="2"/>

    <rect x="116" y="60" width="28" height="14" rx="2"/>
    <rect x="158" y="60" width="14" height="14" rx="2"/>
    <rect x="184" y="60" width="24" height="14" rx="2"/>

    <rect x="116" y="82" width="14" height="14" rx="2"/>
    <rect x="142" y="82" width="14" height="14" rx="2"/>
    <rect x="170" y="82" width="38" height="14" rx="2"/>

    <rect x="38" y="116" width="14" height="14" rx="2"/>
    <rect x="64" y="116" width="36" height="14" rx="2"/>
    <rect x="116" y="116" width="14" height="14" rx="2"/>
    <rect x="194" y="116" width="28" height="14" rx="2"/>
    <rect x="236" y="116" width="48" height="14" rx="2"/>

    <rect x="38" y="138" width="36" height="14" rx="2"/>
    <rect x="86" y="138" width="14" height="14" rx="2"/>
    <rect x="220" y="138" width="14" height="14" rx="2"/>
    <rect x="248" y="138" width="36" height="14" rx="2"/>

    <rect x="38" y="160" width="14" height="14" rx="2"/>
    <rect x="64" y="160" width="22" height="14" rx="2"/>
    <rect x="236" y="160" width="48" height="14" rx="2"/>

    <rect x="38" y="184" width="28" height="14" rx="2"/>
    <rect x="80" y="184" width="20" height="14" rx="2"/>
    <rect x="116" y="184" width="14" height="14" rx="2"/>
    <rect x="194" y="184" width="42" height="14" rx="2"/>
    <rect x="250" y="184" width="34" height="14" rx="2"/>

    <!-- Bottom segments -->
    <rect x="116" y="210" width="30" height="14" rx="2"/>
    <rect x="160" y="210" width="48" height="14" rx="2"/>
    <rect x="222" y="210" width="24" height="14" rx="2"/>
    <rect x="260" y="210" width="24" height="14" rx="2"/>

    <rect x="116" y="234" width="14" height="14" rx="2"/>
    <rect x="144" y="234" width="42" height="14" rx="2"/>
    <rect x="200" y="234" width="20" height="14" rx="2"/>
    <rect x="234" y="234" width="50" height="14" rx="2"/>

    <rect x="116" y="258" width="42" height="14" rx="2"/>
    <rect x="172" y="258" width="26" height="14" rx="2"/>
    <rect x="212" y="258" width="32" height="14" rx="2"/>
    <rect x="258" y="258" width="26" height="14" rx="2"/>
  </g>

  <!-- Center Luxury F1 Store Badge -->
  <rect x="120" y="120" width="80" height="80" rx="14" fill="#03140e" stroke="url(#goldGrad)" stroke-width="2.5" filter="url(#glow)"/>
  <text x="160" y="154" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="22" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="1">F1</text>
  <text x="160" y="176" font-family="sans-serif" font-weight="700" font-size="9" fill="#16c784" text-anchor="middle" letter-spacing="2">PAY VIP</text>
</svg>
`)}`;
