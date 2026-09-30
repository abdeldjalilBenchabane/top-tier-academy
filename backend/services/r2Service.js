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
  // The SDK adds a CRC32 checksum to PutObject by default, and computing one
  // over a stream means reading the whole stream first — which put the entire
  // file back in memory and undid the point of streaming it. R2 does not
  // require these checksums; the transfer is already protected by TLS and by
  // the Content-Length the request declares.
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

// For streamed bodies. A retry inside the SDK would re-send a read stream that
// has already been consumed — an empty request that looks like a success — so
// this client does not retry, and uploadToR2 retries by opening a fresh stream.
const r2StreamClient = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 1,
  // The SDK adds a CRC32 checksum to PutObject by default, and computing one
  // over a stream means reading the whole stream first — which put the entire
  // file back in memory and undid the point of streaming it. R2 does not
  // require these checksums; the transfer is already protected by TLS and by
  // the Content-Length the request declares.
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

// Bucket name
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Upload a file to R2.
 *
 * Accepts either a Buffer or a multer file whose bytes are already on disk.
 * The second form is the one that matters: it streams the file straight from
 * disk to R2 instead of holding it in memory, so a one-gigabyte video costs a
 * few megabytes of RAM rather than two gigabytes. Uploads used to arrive
 * through multer.memoryStorage(), which buffered the whole thing and then
 * concatenated it — two full copies alive at once — and the memory was never
 * returned to the system afterwards.
 *
 * @param {Buffer|{path: string, size?: number}} source - buffer, or a file on disk
 * @param {string} key - File key/path in R2
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
export const uploadToR2 = async (source, key, contentType) => {
  const publicBase = () => {
    const base = process.env.R2_PUBLIC_URL || '';
    return base.endsWith('/') ? base.slice(0, -1) : base;
  };

  // Work out what we were handed, and how many bytes it is. R2 needs the
  // length up front to sign a streamed body, which is why a bare stream with
  // no known size is not accepted.
  let fromDisk = null;
  let buffer = null;
  let contentLength;

  if (Buffer.isBuffer(source)) {
    buffer = source;
    contentLength = source.length;
  } else if (source && typeof (source.spooledPath || source.path) === 'string'
             && (source.spooledPath || source.path).length > 0) {
    // spooledPath is preferred: a few handlers overwrite path with the public
    // URL once they are done, and this may run before or after that.
    fromDisk = source.spooledPath || source.path;
    contentLength = typeof source.size === 'number' ? source.size : fs.statSync(fromDisk).size;
  } else if (source && Buffer.isBuffer(source.buffer)) {
    buffer = source.buffer;
    contentLength = source.buffer.length;
  } else {
    throw new Error('Invalid upload source: expected a Buffer or a file on disk');
  }

  console.log(`📤 Uploading to R2: ${key} (${contentLength} bytes, ${fromDisk ? 'streamed from disk' : 'from memory'})`);

  // A consumed read stream cannot be replayed, so the SDK's own retries are
  // useless for a streamed body — the retry would send an empty request. One
  // attempt per call, and a fresh stream for each of our own retries instead.
  const attempts = fromDisk ? 2 : 1;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fromDisk ? fs.createReadStream(fromDisk) : buffer,
        ContentLength: contentLength,
        ContentType: contentType,
        ACL: 'public-read', // Make file publicly accessible
      });

      // Still capped, so a stalled connection cannot hold a request open for
      // ever, but generous: a large video on a slow line is not a failure.
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 30 minutes')), 1800000);
      });

      const client = fromDisk ? r2StreamClient : r2Client;
      await Promise.race([
        client.send(command, { requestTimeout: 0 }),
        timeoutPromise,
      ]);

      const publicUrl = `${publicBase()}/${key}`;
      console.log(`✅ File uploaded to R2: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(`⚠️ R2 upload attempt ${attempt} failed (${error.message}); retrying from the start of the file`);
      }
    }
  }

  console.error('❌ Error uploading to R2:', lastError);
  if (String(lastError?.message || '').includes('timeout')) {
    throw new Error('Upload timed out. Please try again or check your internet connection. Large files may take longer to upload.');
  }
  throw new Error(`Failed to upload file to R2: ${lastError?.message}`);
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