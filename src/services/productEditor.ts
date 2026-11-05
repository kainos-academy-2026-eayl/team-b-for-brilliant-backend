import { randomUUID } from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HttpError } from '../errors/httpError';
import { saveProductUpdate } from '../repositories/productEditor';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  type ProductImageUpload,
  type ProductUpdate,
} from '../schemas/productUpdate';

export function decodeProductImages(images: ProductImageUpload[]) {
  let total = 0;
  return images.map((image) => {
    const body = Buffer.from(image.data, 'base64');
    total += body.length;
    if (total > MAX_PRODUCT_IMAGE_BYTES) {
      throw new HttpError(400, 'Product images must total 5 MB or less.');
    }
    const valid =
      (image.contentType === 'image/png' &&
        body.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) ||
      (image.contentType === 'image/jpeg' &&
        body.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) ||
      (image.contentType === 'image/gif' &&
        ['GIF87a', 'GIF89a'].includes(body.subarray(0, 6).toString('ascii'))) ||
      (image.contentType === 'image/webp' &&
        body.subarray(0, 4).toString('ascii') === 'RIFF' &&
        body.subarray(8, 12).toString('ascii') === 'WEBP');
    if (!valid) throw new HttpError(400, 'Choose valid PNG, JPEG, GIF or WebP images.');
    const extension = image.contentType === 'image/jpeg' ? 'jpg' : image.contentType.slice(6);
    return { body, fileName: `upload-${randomUUID()}.${extension}` };
  });
}

export async function updateProduct(
  productID: string,
  input: ProductUpdate,
  save = saveProductUpdate,
  imageDirectory = resolve('public/images'),
) {
  const uploads = input.images?.filter(
    (image): image is ProductImageUpload => !('imageID' in image),
  );
  const images = uploads ? decodeProductImages(uploads) : undefined;
  const written: string[] = [];
  try {
    if (images?.length) {
      await mkdir(imageDirectory, { recursive: true });
      for (const image of images) {
        const filePath = resolve(imageDirectory, image.fileName);
        const file = await open(filePath, 'wx');
        written.push(filePath);
        try {
          await file.writeFile(image.body);
        } finally {
          await file.close();
        }
      }
    }
    return await save(
      productID,
      input,
      images?.map((image) => `/images/${image.fileName}`),
    );
  } catch (error) {
    for (const file of written) {
      try {
        await unlink(file);
      } catch (cleanupError) {
        console.error('Failed to remove an uncommitted product image', cleanupError);
      }
    }
    throw error;
  }
}
