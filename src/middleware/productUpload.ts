import type { RequestHandler } from 'express';
import multer from 'multer';
import { HttpError } from '../errors/httpError';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGE_TYPES,
} from '../services/productImages';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_BYTES,
    files: MAX_PRODUCT_IMAGES,
    fields: 9,
    fieldSize: 1024 * 1024,
    parts: 14,
  },
  fileFilter(_req, file, callback) {
    if (!PRODUCT_IMAGE_TYPES.includes(file.mimetype)) {
      callback(new HttpError(400, 'Upload JPEG, PNG or WebP images only.'));
      return;
    }
    callback(null, true);
  },
}).array('images', MAX_PRODUCT_IMAGES);

export const parseProductUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError || error instanceof HttpError) {
      const message =
        error instanceof HttpError
          ? error.message
          : 'Upload no more than 5 JPEG, PNG or WebP images, no larger than 5 MiB each.';
      res.status(400).json({
        error: message,
        details: { fieldErrors: { images: [message] } },
      });
      return;
    }
    if (error) {
      console.error('Product multipart parsing failed', error);
      const message = 'The image upload could not be read. Select the files again and retry.';
      res.status(400).json({ error: message, details: { fieldErrors: { images: [message] } } });
      return;
    }
    next();
  });
};
