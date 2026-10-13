import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

/**
 * Static file serving middleware for uploads with Smart WebP auto-negotiation.
 * Seamlessly transparent: requests for .jpg or .png serve the matching .webp if on disk.
 */
export function createUploadsStaticRouter(uploadsDir: string) {
  // Ensure the directory exists
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {}
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    try {
      const decodedPath = decodeURIComponent(req.path);
      // Clean leading slash and avoid path traversal
      const safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
      const filePath = path.join(uploadsDir, safePath);

      // Security check: must reside inside uploadsDir
      if (!filePath.startsWith(uploadsDir)) {
        return res.status(403).send('Forbidden');
      }

      const ext = path.extname(filePath).toLowerCase();

      // Check if client supports or we can auto-serve webp for jpg/png
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        const webpPath = filePath.slice(0, -ext.length) + '.webp';
        if (fs.existsSync(webpPath)) {
          const stat = fs.statSync(webpPath);
          if (stat.isFile()) {
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Vary', 'Accept');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.sendFile(path.resolve(webpPath));
          }
        }
      }

      // Check if original file exists
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.sendFile(path.resolve(filePath));
        }
      }
    } catch (err) {
      console.error('Error serving upload static file:', err);
    }

    next();
  };
}
