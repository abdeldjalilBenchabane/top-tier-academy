import { EventEmitter } from 'events';

class UploadProgressService extends EventEmitter {
  constructor() {
    super();
    this.uploads = new Map();
  }

  // Start tracking an upload
  startUpload(uploadId, totalSize, filename) {
    const upload = {
      id: uploadId,
      filename,
      totalSize,
      uploadedSize: 0,
      progress: 0,
      status: 'uploading',
      startTime: Date.now(),
      estimatedTimeRemaining: null
    };
    
    this.uploads.set(uploadId, upload);
    this.emit('uploadStarted', upload);
    return upload;
  }

  // Update upload progress
  updateProgress(uploadId, uploadedSize) {
    const upload = this.uploads.get(uploadId);
    if (!upload) return;

    upload.uploadedSize = uploadedSize;
    upload.progress = Math.round((uploadedSize / upload.totalSize) * 100);
    
    // Calculate estimated time remaining
    const elapsed = Date.now() - upload.startTime;
    if (uploadedSize > 0) {
      const bytesPerMs = uploadedSize / elapsed;
      const remainingBytes = upload.totalSize - uploadedSize;
      upload.estimatedTimeRemaining = Math.round(remainingBytes / bytesPerMs);
    }

    this.emit('progressUpdated', upload);
    return upload;
  }

  // Complete an upload
  completeUpload(uploadId, success = true, error = null) {
    const upload = this.uploads.get(uploadId);
    if (!upload) return;

    upload.status = success ? 'completed' : 'failed';
    upload.endTime = Date.now();
    upload.duration = upload.endTime - upload.startTime;
    upload.error = error;

    this.emit('uploadCompleted', upload);
    return upload;
  }

  // Get upload status
  getUploadStatus(uploadId) {
    return this.uploads.get(uploadId);
  }

  // Clean up old uploads (older than 1 hour)
  cleanupOldUploads() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [uploadId, upload] of this.uploads.entries()) {
      if (upload.endTime && upload.endTime < oneHourAgo) {
        this.uploads.delete(uploadId);
      }
    }
  }

  // Get all active uploads
  getActiveUploads() {
    return Array.from(this.uploads.values()).filter(upload => upload.status === 'uploading');
  }
}

export const uploadProgressService = new UploadProgressService();

// Clean up old uploads every 10 minutes
setInterval(() => {
  uploadProgressService.cleanupOldUploads();
}, 10 * 60 * 1000); 