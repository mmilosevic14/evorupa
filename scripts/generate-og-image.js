const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const publicDir = path.resolve(__dirname, '..', 'public')
const outputPath = path.join(publicDir, 'og-image.png')

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pin(cx, cy, color, label) {
  const safeLabel = escapeXml(label)
  return `
    <g transform="translate(${cx} ${cy})">
      <path d="M0 -34 C23 -34 40 -16 40 5 C40 36 0 72 0 72 C0 72 -40 36 -40 5 C-40 -16 -23 -34 0 -34Z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="0" cy="2" r="17" fill="#fff"/>
      <text x="0" y="9" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${color}">${safeLabel}</text>
    </g>
  `
}

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7F1D1D"/>
      <stop offset="0.52" stop-color="#1E3A8A"/>
      <stop offset="1" stop-color="#0F766E"/>
    </linearGradient>
    <linearGradient id="road" x1="292" y1="92" x2="1020" y2="548" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F8FAFC" stop-opacity="0.94"/>
      <stop offset="1" stop-color="#CBD5E1" stop-opacity="0.88"/>
    </linearGradient>
    <filter id="shadow" x="-80" y="-80" width="180" height="190" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#020617" flood-opacity="0.28"/>
    </filter>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" stroke="#FFFFFF" stroke-opacity="0.09" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <path d="M772 60 C700 138 709 205 784 265 C885 345 827 477 678 568" stroke="#FFFFFF" stroke-opacity="0.24" stroke-width="46" stroke-linecap="round"/>
  <path d="M812 60 C740 138 749 205 824 265 C925 345 867 477 718 568" stroke="#FFFFFF" stroke-opacity="0.17" stroke-width="20" stroke-linecap="round" stroke-dasharray="26 30"/>

  <path d="M309 116 C457 51 614 85 718 202 C811 306 918 338 1058 310 L1092 528 C917 579 744 515 650 404 C558 296 445 263 318 317 Z" fill="url(#road)" opacity="0.96"/>
  <path d="M346 195 C450 150 554 178 633 266 C727 371 833 402 994 375" stroke="#334155" stroke-opacity="0.36" stroke-width="14" stroke-linecap="round" stroke-dasharray="28 24"/>
  <path d="M365 259 C468 226 539 256 606 329 C703 433 811 468 1008 434" stroke="#0F172A" stroke-opacity="0.16" stroke-width="12" stroke-linecap="round"/>

  ${pin(846, 218, '#DC2626', '!')}
  ${pin(976, 410, '#F97316', '!')}
  ${pin(664, 388, '#2563EB', '!')}

  <g transform="translate(92 94)">
    <rect x="0" y="0" width="486" height="438" rx="34" fill="#0F172A" fill-opacity="0.78"/>
    <rect x="24" y="24" width="438" height="390" rx="24" fill="#FFFFFF" fill-opacity="0.08"/>
    <text x="48" y="96" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="#FFFFFF">EvoRupa</text>
    <text x="51" y="148" font-family="Arial, sans-serif" font-size="23" font-weight="700" fill="#BFDBFE">Mapa infrastrukturnih problema</text>
    <text x="48" y="224" font-family="Arial, sans-serif" font-size="38" font-weight="850" fill="#FFFFFF">Prijavi rupe,</text>
    <text x="48" y="270" font-family="Arial, sans-serif" font-size="38" font-weight="850" fill="#FFFFFF">oštećenja puta</text>
    <text x="48" y="316" font-family="Arial, sans-serif" font-size="38" font-weight="850" fill="#FFFFFF">i probleme u gradu</text>
    <rect x="48" y="354" width="308" height="44" rx="22" fill="#FFFFFF"/>
    <text x="202" y="383" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#1E3A8A">Građanska mapa Srbije</text>
  </g>
</svg>
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })

function logoSvg(size) {
  const center = size / 2
  const outerRadius = size * 0.46

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="blue" cx="34%" cy="28%" r="70%">
        <stop stop-color="#38BDF8"/>
        <stop offset="0.55" stop-color="#2563EB"/>
        <stop offset="1" stop-color="#1E3A8A"/>
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${size * 0.025}" stdDeviation="${size * 0.025}" flood-color="#0F172A" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" fill="none"/>
    <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="url(#blue)" filter="url(#softShadow)"/>
    <path
      d="
        M ${size * 0.36} ${size * 0.43}
        C ${size * 0.45} ${size * 0.31}, ${size * 0.63} ${size * 0.34}, ${size * 0.68} ${size * 0.47}
        C ${size * 0.74} ${size * 0.62}, ${size * 0.61} ${size * 0.75}, ${size * 0.47} ${size * 0.71}
        C ${size * 0.34} ${size * 0.67}, ${size * 0.27} ${size * 0.55}, ${size * 0.36} ${size * 0.43}
        Z"
      fill="#FFFFFF"
      stroke="#DC2626"
      stroke-width="${Math.max(5, size * 0.075)}"
      stroke-linejoin="round"
    />
    <path
      d="M ${size * 0.43} ${size * 0.48} C ${size * 0.49} ${size * 0.42}, ${size * 0.58} ${size * 0.44}, ${size * 0.61} ${size * 0.51}"
      fill="none"
      stroke="#FCA5A5"
      stroke-width="${Math.max(2, size * 0.025)}"
      stroke-linecap="round"
      opacity="0.75"
    />
  </svg>
  `
}

async function writePng(svgContent, targetPath, size) {
  await sharp(Buffer.from(svgContent))
    .resize(size, size)
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(targetPath)
  console.log(`Generated ${path.relative(process.cwd(), targetPath)}`)
}

async function main() {
  fs.mkdirSync(publicDir, { recursive: true })

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(outputPath)
  console.log(`Generated ${path.relative(process.cwd(), outputPath)}`)

  const iconTargets = [
    ['logo.png', 512],
    ['icon-512.png', 512],
    ['maskable-512.png', 512],
    ['icon-192.png', 192],
    ['maskable-192.png', 192],
    ['apple-touch-icon.png', 180],
    ['favicon-32x32.png', 32],
  ]

  for (const [fileName, size] of iconTargets) {
    await writePng(logoSvg(size), path.join(publicDir, fileName), size)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
