import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// R2 Client Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Bucket name
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Upload file to R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - File key/path in R2
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
export const uploadToR2 = async (fileBuffer, key, contentType) => {
  try {
    console.log('📤 Uploading to R2:', key);
    
    // Check if fileBuffer is valid
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Invalid file buffer provided');
    }
    
    console.log('📊 File size:', fileBuffer.length, 'bytes');
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make file publicly accessible
    });
    
    // Add timeout to prevent hanging (increased to 30 minutes for very large files)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 30 minutes')), 1800000);
    });
    
    const uploadPromise = r2Client.send(command);
    
    // Race between upload and timeout
    await Promise.race([uploadPromise, timeoutPromise]);
    
    // Return public URL (handle trailing slash properly)
    const baseUrl = process.env.R2_PUBLIC_URL.endsWith('/') 
      ? process.env.R2_PUBLIC_URL.slice(0, -1) 
      : process.env.R2_PUBLIC_URL;
    const publicUrl = `${baseUrl}/${key}`;
    console.log(`✅ File uploaded to R2: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to R2:', error);
    if (error.message.includes('timeout')) {
      throw new Error('Upload timed out. Please try again or check your internet connection. Large files may take longer to upload.');
    }
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
};

/**
 * Delete file from R2
 * @param {string} key - File key/path in R2
 * @returns {Promise<void>}
 */
export const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ File deleted from R2: ${key}`);
  } catch (error) {
    console.error('❌ Error deleting from R2:', error);
    throw new Error(`Failed to delete file from R2: ${error.message}`);
  }
};

/**
 * Generate presigned URL for private files (if needed)
 * @param {string} key - File key/path in R2
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
export const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Generate R2 key based on file type and original name with proper folder organization
 * @param {string} fileType - Type of file (courses, slides, live-sessions, etc.)
 * @param {string} subType - Subtype (covers, content, etc.)
 * @param {string} originalName - Original filename
 * @param {string} fieldName - Form field name
 * @returns {string} - R2 key
 */
export const generateR2Key = (fileType, subType, originalName, fieldName) => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  
  let key;
  
  // For courses, organize into content/ and covers/ folders
  if (fileType === 'courses') {
    if (fieldName === 'cover') {
      key = `${fileType}/covers/${fieldName}-${timestamp}-${randomSuffix}${extension}`;
    } else {
      key = `${fileType}/content/${fieldName}-${timestamp}-${randomSuffix}${extension}`;
    }
  } else if (subType) {
    // For other file types with subType
    key = `${fileType}/${subType}/${fieldName}-${timestamp}-${randomSuffix}${extension}`;
  } else {
    // Fallback for other file types
    key = `${fileType}/${fieldName}-${timestamp}-${randomSuffix}${extension}`;
  }
  
  return key;
};

/**
 * Extract key from R2 URL
 * @param {string} url - R2 public URL
 * @returns {string} - R2 key
 */
export const extractKeyFromUrl = (url) => {
  try {
    const baseUrl = process.env.R2_PUBLIC_URL.endsWith('/') 
      ? process.env.R2_PUBLIC_URL.slice(0, -1) 
      : process.env.R2_PUBLIC_URL;
    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl + '/', '');
    }
    return url;
  } catch (error) {
    console.error('❌ Error extracting key from URL:', error);
    return url;
  }
};

/**
 * Check if URL is from R2
 * @param {string} url - URL to check
 * @returns {boolean} - True if R2 URL
 */
export const isR2Url = (url) => {
  return url && url.includes(process.env.R2_PUBLIC_URL);
};

/**
 * Migrate local file to R2
 * @param {string} localPath - Local file path
 * @param {string} r2Key - R2 key
 * @returns {Promise<string>} - R2 public URL
 */
export const migrateLocalFileToR2 = async (localPath, r2Key) => {
  try {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }

    const fileBuffer = fs.readFileSync(localPath);
    const contentType = getContentTypeFromExtension(path.extname(localPath));
    
    const publicUrl = await uploadToR2(fileBuffer, r2Key, contentType);
    
    // Delete local file after successful upload
    fs.unlinkSync(localPath);
    console.log(`✅ Migrated local file to R2: ${localPath} -> ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Error migrating file to R2:', error);
    throw error;
  }
};

/**
 * Get content type from file extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
const getContentTypeFromExtension = (extension) => {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/x-m4v',
    '.3gp': 'video/3gpp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

export default {
  uploadToR2,
  deleteFromR2,
  generatePresignedUrl,
  generateR2Key,
  extractKeyFromUrl,
  isR2Url,
  migrateLocalFileToR2
}; 