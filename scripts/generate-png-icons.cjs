const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Function to generate an uncompressed or zlib-compressed PNG buffer
function createPng(width, height, drawFn) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: standard
  ihdr[12] = 0; // Interlace: none

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc >>> 0, len + 8);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Drawing function for Hisabi app icon (emerald gradient with stylish financial symbol)
function drawHisabiIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Rich Deep Emerald / Slate gradient
  const grad = y / h;
  let bgR = Math.round(15 + grad * 10);
  let bgG = Math.round(23 + grad * 40);
  let bgB = Math.round(42 + grad * 30);

  // Rounded squircle badge
  const radius = isMaskable ? w * 0.5 : w * 0.22;
  const cornerDist = Math.max(Math.abs(dx) - (cx - radius), 0);
  const cornerDistY = Math.max(Math.abs(dy) - (cy - radius), 0);
  const isOutside = !isMaskable && Math.sqrt(cornerDist * cornerDist + cornerDistY * cornerDistY) > radius;

  if (isOutside) {
    return [0, 0, 0, 0]; // Transparent outside corner
  }

  // Emerald Inner Glow ring
  const ringDist = Math.abs(dist - w * 0.32);
  let isRing = ringDist < w * 0.02;

  // Central symbol: Modern stylized Arabic 'ح' / Wallet / Vault node
  // Draw two intersecting rounded bars / coins
  const inCenterBox = Math.abs(dx) < w * 0.24 && Math.abs(dy) < w * 0.24;
  const inBar1 = Math.abs(dy + w * 0.08) < w * 0.04 && Math.abs(dx) < w * 0.18;
  const inBar2 = Math.abs(dx) < w * 0.04 && dy > -w * 0.08 && dy < w * 0.12;
  const inBar3 = Math.abs(dy - w * 0.12) < w * 0.04 && dx > -w * 0.18 && dx < w * 0.04;
  const inDot = Math.hypot(dx - w * 0.1, dy) < w * 0.035;

  if (inBar1 || inBar2 || inBar3 || inDot) {
    // Crisp Emerald / Gold gradient for the emblem
    const emblemGrad = (x + y) / (w + h);
    const r = Math.round(52 + emblemGrad * 50);
    const g = Math.round(211 + emblemGrad * 40);
    const b = Math.round(153 + emblemGrad * 20);
    return [r, g, b, 255];
  }

  if (isRing) {
    return [16, 185, 129, 120]; // Emerald subtle ring
  }

  // Rich luxury dark slate background
  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawHisabiIcon(x, y, w, h, false)));
console.log('Created pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHisabiIcon(x, y, w, h, false)));
console.log('Created pwa-512x512.png');

// 3. pwa-maskable-512x512.png (full bleed with safe zone)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHisabiIcon(x, y, w, h, true)));
console.log('Created pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180 PNG required for iOS Safari)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawHisabiIcon(x, y, w, h, false)));
console.log('Created apple-touch-icon.png');
