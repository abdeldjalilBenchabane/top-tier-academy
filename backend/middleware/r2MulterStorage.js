import multer from 'multer';
import { uploadToR2, generateR2Key } from '../services/r2Service.js';

/**
 * Custom multer storage for R2 uploads
 * @param {string} fileType - Type of file (courses, slides, live-sessions, etc.)
 * @param {string} subType - Subtype (covers, content, etc.)
 * @returns {multer.StorageEngine} - Multer storage engine
 */
export const createR2Storage = (fileType, subType = null) => {
  return {
    _handleFile: async (req, file, cb) => {
      try {
        console.log('📁 Processing file:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
        console.log('📦 File buffer available:', !!file.buffer);
        console.log('📦 File buffer size:', file.buffer?.length || 'undefined');
        
        // Check if buffer is available
        if (!file.buffer) {
          throw new Error('File buffer is not available. Please ensure the file is properly uploaded.');
        }
        
        // Generate R2 key
        const r2Key = generateR2Key(fileType, subType, file.originalname, file.fieldname);
        console.log('🔑 Generated R2 key:', r2Key);
        
        // Upload to R2
        console.log('📤 Starting R2 upload...');
        const publicUrl = await uploadToR2(file.buffer, r2Key, file.mimetype);
        console.log('✅ R2 upload completed:', publicUrl);
        
        // Create file info object similar to disk storage
        const fileInfo = {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          destination: `r2://${fileType}/${subType || ''}`,
          filename: r2Key,
          path: publicUrl,
          buffer: file.buffer
        };
        
        console.log('📋 File info created successfully');
        cb(null, fileInfo);
      } catch (error) {
        console.error('❌ R2 storage error:', error);
        console.error('Stack trace:', error.stack);
        cb(error);
      }
    },
    
    _removeFile: async (req, file, cb) => {
      try {
        // If we need to remove a file from R2, we can do it here
        // For now, just call the callback
        cb(null);
      } catch (error) {
        console.error('❌ Error removing file from R2:', error);
        cb(error);
      }
    }
  };
};

/**
 * Create multer instance with R2 storage
 * @param {string} fileType - Type of file
 * @param {string} subType - Subtype
 * @param {Object} options - Additional multer options
 * @returns {multer.Multer} - Configured multer instance
 */
export const createR2Multer = (fileType, subType = null, options = {}) => {
  return multer({
    limits: {
      fileSize: 100 * 1024 * 1024 * 1024, // 100GB limit for large files
      files: 20, // Max 20 files
    },
    fileFilter: (req, file, cb) => {
      console.log('🔍 File filter called for:', file.originalname);
      console.log('📊 File size in filter:', file.size);
      
      // Check file size before processing
      if (file.size > 100 * 1024 * 1024 * 1024) {
        return cb(new Error('File too large. Maximum size is 100GB.'));
      }
      
      // Check file type for images
      if (file.fieldname === 'cover') {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'));
        }
      }
      
      cb(null, true);
    },
    // Use memory storage to ensure buffer is available, then process with R2
    storage: multer.memoryStorage(),
    ...options
  });
};

export default {
  createR2Storage,
  createR2Multer
}; 