import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { httpError } from '../utils.js';

export const uploadsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');

// The stored extension comes from the checked image type, never from the uploaded file name,
// so a file called "x.html" can never be saved or served as a web page.
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function make(folder) {
  return multer({
    storage: multer.diskStorage({
      destination: path.join(uploadsRoot, folder),
      filename: (_req, file, cb) =>
        cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: 6 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) =>
      EXT[file.mimetype]
        ? cb(null, true)
        : cb(httpError(400, 'Only JPG, PNG or WEBP images are allowed')),
  });
}

export const productUpload = make('products');
export const paymentUpload = make('payments');

// Runs after the upload: confirm the file's first bytes really are a JPEG, PNG or WEBP.
export async function checkImages(req, _res, next) {
  const files = [...(req.file ? [req.file] : []), ...(Array.isArray(req.files) ? req.files : [])];
  for (const f of files) {
    const fh = await fs.open(f.path, 'r');
    const b = Buffer.alloc(12);
    await fh.read(b, 0, 12, 0);
    await fh.close();
    const real =
      (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
      b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) ||
      (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP');
    if (!real) {
      await Promise.all(files.map((x) => fs.unlink(x.path).catch(() => {})));
      throw httpError(400, 'That file is not a real JPG, PNG or WEBP image');
    }
  }
  next();
}
