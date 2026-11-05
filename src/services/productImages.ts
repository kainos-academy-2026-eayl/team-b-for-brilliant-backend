import { randomUUID } from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { HttpError } from '../errors/httpError';

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ProductImageUpload {
  buffer: Buffer;
  mimetype: string;
}

export interface StoredProductImage {
  imageUrl: string;
  imageOrder: number;
}

export function getProductImageDirectory(): string {
  return path.resolve(process.env.PRODUCT_IMAGE_DIR || 'public/product-images');
}

async function normalizeImage(file: ProductImageUpload): Promise<Buffer> {
  if (
    !PRODUCT_IMAGE_TYPES.includes(file.mimetype) ||
    file.buffer.length > MAX_PRODUCT_IMAGE_BYTES
  ) {
    throw new HttpError(400, 'Upload JPEG, PNG or WebP images no larger than 5 MiB each.');
  }
  const isPng = file.buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  const isJpeg = file.buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  const isWebp =
    file.buffer.toString('ascii', 0, 4) === 'RIFF' &&
    file.buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!isPng && !isJpeg && !isWebp) {
    throw new HttpError(400, 'An image could not be read. Upload valid JPEG, PNG or WebP images.');
  }
  try {
    const image = sharp(file.buffer, { limitInputPixels: 40_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (
      !metadata.format ||
      !['jpeg', 'png', 'webp'].includes(metadata.format) ||
      (metadata.pages ?? 1) > 1
    ) {
      throw new HttpError(400, 'Upload static JPEG, PNG or WebP images.');
    }
    const normalized = await image.rotate().webp({ quality: 90 }).toBuffer();
    if (normalized.length > MAX_PRODUCT_IMAGE_BYTES) {
      throw new HttpError(400, 'An image is too large after processing. Choose a smaller image.');
    }
    return normalized;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.warn('Product image decoding failed', error);
    throw new HttpError(
      400,
      'An image could not be read. Upload valid JPEG, PNG or WebP images, up to 40 megapixels each.',
    );
  }
}

export async function withStoredProductImages<T>(
  files: readonly ProductImageUpload[],
  save: (images: StoredProductImage[]) => Promise<T>,
): Promise<T> {
  if (files.length > MAX_PRODUCT_IMAGES) {
    throw new HttpError(400, 'Upload no more than 5 images.');
  }
  const normalized: Buffer[] = [];
  for (const file of files) normalized.push(await normalizeImage(file));
  const directory = getProductImageDirectory();
  const written: string[] = [];
  const images: StoredProductImage[] = [];
  try {
    if (normalized.length) await mkdir(directory, { recursive: true });
    for (const [imageOrder, buffer] of normalized.entries()) {
      const fileName = `product-${randomUUID()}.webp`;
      const filePath = path.join(directory, fileName);
      const file = await open(filePath, 'wx');
      written.push(filePath);
      try {
        await file.writeFile(buffer);
      } finally {
        await file.close();
      }
      images.push({ imageUrl: `/images/${fileName}`, imageOrder });
    }
    return await save(images);
  } catch (error) {
    const cleanup = await Promise.allSettled(written.map((filePath) => unlink(filePath)));
    const failures = cleanup.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : [],
    );
    if (failures.length) {
      console.error('Product image cleanup failed', ...failures);
      throw new AggregateError([error, ...failures], 'Product creation and image cleanup failed');
    }
    throw error;
  }
}
