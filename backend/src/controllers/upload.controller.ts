import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { sendSuccess, sendError } from '../utils/response';

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `img_${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
  }
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

export class UploadController {
  /**
   * Multipart Form-Data upload: POST /api/admin/upload or POST /api/upload
   * Expected field name: 'file' or 'image'
   */
  async uploadFile(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return sendError(res, 'No image file uploaded', 400);
      }

      const relativeUrl = `/uploads/${file.filename}`;
      return sendSuccess(
        res,
        {
          url: relativeUrl,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        },
        'Image uploaded successfully',
        201
      );
    } catch (err: any) {
      return sendError(res, err.message || 'Image upload failed', 400);
    }
  }

  /**
   * Base64 Direct upload: POST /api/admin/upload-base64 or POST /api/upload-base64
   * Payload: { base64: "...", filename?: "..." }
   */
  async uploadBase64(req: Request, res: Response) {
    try {
      const { base64, filename } = req.body;
      if (!base64 || typeof base64 !== 'string') {
        return sendError(res, 'base64 image data is required', 400);
      }

      // Check for data URI prefix: data:image/png;base64,...
      let rawBase64 = base64;
      let ext = '.jpg';

      const match = base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
      if (match) {
        const mimeSubtype = match[1].toLowerCase();
        if (mimeSubtype === 'png') ext = '.png';
        else if (mimeSubtype === 'webp') ext = '.webp';
        else if (mimeSubtype === 'gif') ext = '.gif';
        else ext = '.jpg';
        rawBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      } else if (filename) {
        ext = path.extname(filename).toLowerCase() || '.jpg';
      }

      const buffer = Buffer.from(rawBase64, 'base64');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const outFilename = `img_${uniqueSuffix}${ext}`;
      const destPath = path.join(uploadsDir, outFilename);

      await fs.promises.writeFile(destPath, buffer);

      const relativeUrl = `/uploads/${outFilename}`;
      return sendSuccess(
        res,
        {
          url: relativeUrl,
          filename: outFilename,
          size: buffer.length,
        },
        'Image uploaded successfully',
        201
      );
    } catch (err: any) {
      return sendError(res, err.message || 'Base64 image upload failed', 400);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
