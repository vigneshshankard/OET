/**
 * Media Processing Service
 * Handles file uploads, image processing, and media management
 */

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { MediaFile } from '../types/content';
import { logger } from '../utils/logger';
import { environment } from '../config/environment';

export class MediaService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = environment.MEDIA_UPLOAD_PATH || '/tmp/uploads';
    this.maxFileSize = environment.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'application/pdf'
    ];
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Created upload directory', { path: this.uploadDir });
    }
  }

  /**
   * Configure multer middleware for file uploads
   */
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        await this.ensureUploadDir();
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
      }
    });

    return multer({
      storage,
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
      },
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Maximum 5 files per request
      }
    });
  }

  /**
   * Process uploaded image files
   */
  async processImage(
    filePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<{ path: string; size: number }> {
    try {
      const {
        width = 800,
        height = 600,
        quality = 85,
        format = 'webp'
      } = options;

      const ext = `.${format}`;
      const processedPath = filePath.replace(path.extname(filePath), `_processed${ext}`);

      await sharp(filePath)
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .toFormat(format, { quality })
        .toFile(processedPath);

      const stats = await fs.stat(processedPath);
      
      logger.info('Image processed successfully', {
        originalPath: filePath,
        processedPath,
        size: stats.size,
        dimensions: `${width}x${height}`
      });

      return {
        path: processedPath,
        size: stats.size
      };

    } catch (error) {
      logger.error('Failed to process image', { error, filePath });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image processing failed: ${errorMessage}`);
    }
  }

  /**
   * Generate thumbnails for images
   */
  async generateThumbnail(
    filePath: string,
    size = 150
  ): Promise<{ path: string; size: number }> {
    try {
      const ext = path.extname(filePath);
      const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);

      await sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat('webp', { quality: 80 })
        .toFile(thumbnailPath);

      const stats = await fs.stat(thumbnailPath);

      logger.info('Thumbnail generated', {
        originalPath: filePath,
        thumbnailPath,
        size: stats.size
      });

      return {
        path: thumbnailPath,
        size: stats.size
      };

    } catch (error) {
      logger.error('Failed to generate thumbnail', { error, filePath });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Thumbnail generation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate file before processing
   */
  async validateFile(file: Express.Multer.File): Promise<boolean> {
    try {
      // Check file size
      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds limit: ${file.size} > ${this.maxFileSize}`);
      }

      // Check mime type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }

      // Additional validation for images
      if (file.mimetype.startsWith('image/')) {
        const metadata = await sharp(file.path).metadata();
        
        if (!metadata.width || !metadata.height) {
          throw new Error('Invalid image file');
        }

        // Check image dimensions (max 4K)
        if (metadata.width > 4096 || metadata.height > 4096) {
          throw new Error('Image dimensions too large');
        }
      }

      return true;

    } catch (error) {
      logger.error('File validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      });
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<Record<string, any>> {
    try {
      const stats = await fs.stat(filePath);
      const metadata: Record<string, any> = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };

      const ext = path.extname(filePath).toLowerCase();

      // Add image-specific metadata
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        const imageMetadata = await sharp(filePath).metadata();
        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height
        };
        metadata.format = imageMetadata.format;
        metadata.channels = imageMetadata.channels;
        metadata.hasAlpha = imageMetadata.hasAlpha;
      }

      return metadata;

    } catch (error) {
      logger.error('Failed to get file metadata', { error, filePath });
      return {};
    }
  }

  /**
   * Generate file URL
   */
  generateFileUrl(filename: string): string {
    const baseUrl = environment.MEDIA_BASE_URL || 'http://localhost:3003';
    return `${baseUrl}/api/media/files/${filename}`;
  }

  /**
   * Delete file from filesystem
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted from filesystem', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', { error, filePath });
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(maxAgeHours = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.birthtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          logger.info('Cleaned up old temp file', { filePath });
        }
      }

    } catch (error) {
      logger.error('Failed to cleanup temp files', { error });
    }
  }

  /**
   * Get file stream for serving
   */
  async getFileStream(filePath: string): Promise<NodeJS.ReadableStream> {
    try {
      await fs.access(filePath);
      const { createReadStream } = await import('fs');
      return createReadStream(filePath);
    } catch (error) {
      logger.error('Failed to get file stream', { error, filePath });
      throw new Error('File not found');
    }
  }

  /**
   * Validate and prepare file data for database storage
   */
  async prepareFileData(
    file: Express.Multer.File,
    uploadedBy: string,
    scenarioId?: string,
    dialogueId?: string
  ): Promise<Omit<MediaFile, 'id' | 'createdAt'>> {
    await this.validateFile(file);
    
    const metadata = await this.getFileMetadata(file.path);
    const url = this.generateFileUrl(file.filename);

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url,
      uploadedBy,
      scenarioId,
      dialogueId,
      metadata
    };
  }
}