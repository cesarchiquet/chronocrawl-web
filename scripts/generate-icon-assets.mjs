import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const project = "/Users/cesarchiquet/Desktop/VS code/Projets/SaaS ChronoCrawl";
const tmpDir = "/tmp/chronocrawl-icon-build";

fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2;
  const cy = size / 2;
  const outerCircle = size * 0.4375;
  const cRadius = size * 0.246;
  const cThickness = size * 0.144;
  const gapThreshold = 0.95;

  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const rowOffset = y * (size * 4 + 1) + 1 + x * 4;

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (distance <= outerCircle) {
        r = 0;
        g = 0;
        b = 0;
        a = 255;
      }

      const inArc =
        distance >= cRadius - cThickness / 2 &&
        distance <= cRadius + cThickness / 2 &&
        !(Math.cos(angle) > gapThreshold && Math.abs(Math.sin(angle)) < 0.72);

      if (inArc) {
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }

      raw[rowOffset] = r;
      raw[rowOffset + 1] = g;
      raw[rowOffset + 2] = b;
      raw[rowOffset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  return png;
}

const png512 = makePng(512);
fs.writeFileSync(path.join(project, "public", "brand-mark.png"), png512);
fs.writeFileSync(path.join(tmpDir, "icon-64.png"), makePng(64));
fs.writeFileSync(path.join(tmpDir, "icon-32.png"), makePng(32));
fs.writeFileSync(path.join(tmpDir, "icon-16.png"), makePng(16));

const pngBuffers = [16, 32, 64].map((size) =>
  fs.readFileSync(path.join(tmpDir, `icon-${size}.png`))
);
const header = Buffer.alloc(6 + pngBuffers.length * 16);

header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngBuffers.length, 4);

let offset = 6 + pngBuffers.length * 16;
pngBuffers.forEach((buffer, index) => {
  const size = [16, 32, 64][index];
  const entryOffset = 6 + index * 16;
  header.writeUInt8(size, entryOffset);
  header.writeUInt8(size, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(buffer.length, entryOffset + 8);
  header.writeUInt32LE(offset, entryOffset + 12);
  offset += buffer.length;
});

fs.writeFileSync(
  path.join(project, "app", "favicon.ico"),
  Buffer.concat([header, ...pngBuffers])
);

console.log("Icon assets regenerated.");
