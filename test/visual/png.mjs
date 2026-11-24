// Reads the pixels of a PNG as Chrome and Playwright write one: 8 bits a channel, RGB or RGBA, not interlaced.
// The tests use it to measure what a committed screenshot shows, with no image library.
import { inflateSync } from "node:zlib";

const SIGNATURE = "89504e470d0a1a0a";

export function readPng(buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== SIGNATURE) throw new Error("not a PNG file");
  let header = null;
  const data = [];
  for (let at = 8; at < buffer.length; ) {
    const length = buffer.readUInt32BE(at);
    const type = buffer.toString("latin1", at + 4, at + 8);
    const body = buffer.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], colour: body[9], interlace: body[12] };
    if (type === "IDAT") data.push(body);
    at += 12 + length;
  }
  const channels = { 2: 3, 6: 4 }[header?.colour];
  if (!header || header.depth !== 8 || !channels || header.interlace !== 0) throw new Error(`a PNG this reader does not handle: ${JSON.stringify(header)}`);
  const { width, height } = header;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(data));
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const estimate = left + up - upLeft;
        const [toLeft, toUp, toUpLeft] = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - upLeft)];
        predicted = toLeft <= toUp && toLeft <= toUpLeft ? left : toUp <= toUpLeft ? up : upLeft;
      }
      pixels[y * stride + x] = (line[x] + predicted) & 255;
    }
  }
  // The colour at a point, as "#RRGGBB".
  const at = (x, y) => `#${pixels.subarray(y * stride + x * channels, y * stride + x * channels + 3).toString("hex").toUpperCase()}`;
  return { width, height, at };
}

// How many pixels of one colour run up and down from a point: the height of a filled shape there.
export function runHeight(image, x, y) {
  const colour = image.at(x, y);
  let top = y;
  let bottom = y;
  while (top > 0 && image.at(x, top - 1) === colour) top -= 1;
  while (bottom < image.height - 1 && image.at(x, bottom + 1) === colour) bottom += 1;
  return bottom - top + 1;
}
