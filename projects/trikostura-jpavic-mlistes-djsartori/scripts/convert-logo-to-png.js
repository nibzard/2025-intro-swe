#!/usr/bin/env node

/**
 * Convert Skripta SVG logo to PNG for email templates
 * Run: node scripts/convert-logo-to-png.js
 */

const fs = require('fs');
const path = require('path');

// SVG content from components/branding/skripta-logo.tsx
const svgContent = `
<svg width="128" height="128" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle with Croatian Red -->
  <circle cx="50" cy="50" r="48" fill="#E03131" />

  <!-- White Circle for contrast -->
  <circle cx="50" cy="50" r="42" fill="white" />

  <!-- Stylized "S" with Croatian pleter-inspired curves -->
  <path
    d="M 35 30 Q 28 30 28 37 Q 28 42 33 44 L 55 52 Q 62 54 62 60 Q 62 66 55 66 L 40 66 Q 35 66 35 61"
    stroke="#E03131"
    stroke-width="8"
    stroke-linecap="round"
    fill="none"
  />

  <!-- Top decorative pleter knot -->
  <circle cx="35" cy="30" r="4" fill="#0066CC" />

  <!-- Bottom decorative pleter knot -->
  <circle cx="35" cy="61" r="4" fill="#0066CC" />

  <!-- Small accent dots (pleter pattern) -->
  <circle cx="68" cy="35" r="2.5" fill="#0066CC" opacity="0.6" />
  <circle cx="72" cy="45" r="2.5" fill="#0066CC" opacity="0.6" />
  <circle cx="68" cy="55" r="2.5" fill="#0066CC" opacity="0.6" />
</svg>
`.trim();

// Save SVG file temporarily
const svgPath = path.join(__dirname, '..', 'public', 'logo-email.svg');
const pngPath = path.join(__dirname, '..', 'public', 'logo-email.png');

fs.writeFileSync(svgPath, svgContent);

console.log('✅ SVG file created at:', svgPath);
console.log('\n📝 To convert to PNG, you have two options:\n');

console.log('Option 1 - Use sharp (recommended):');
console.log('  npm install sharp');
console.log('  node -e "const sharp = require(\'sharp\'); sharp(\'public/logo-email.svg\').resize(128, 128).png().toFile(\'public/logo-email.png\').then(() => console.log(\'✅ PNG created!\'));"');

console.log('\nOption 2 - Online converter:');
console.log('  1. Upload public/logo-email.svg to https://cloudconvert.com/svg-to-png');
console.log('  2. Set size to 128x128');
console.log('  3. Download as public/logo-email.png');

console.log('\nOption 3 - Command line (if you have ImageMagick):');
console.log('  convert public/logo-email.svg -resize 128x128 public/logo-email.png');

console.log('\n🎯 Target file: public/logo-email.png (128x128px)\n');
