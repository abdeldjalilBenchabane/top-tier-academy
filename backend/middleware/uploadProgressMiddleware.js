import { uploadProgressService } from '../services/uploadProgressService.js';
import { v4 as uuidv4 } from 'uuid';

// Middleware to track upload progress
export const trackUploadProgress = (req, res, next) => {
  // Generate upload ID for tracking
  const uploadId = uuidv4();
  req.uploadId = uploadId;
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to track completion
  res.send = function(data) {
    if (req.uploadId) {
      uploadProgressService.completeUpload(req.uploadId, true);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware to handle file upload progress
export const handleFileUploadProgress = (fieldName) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    const uploadPromises = [];

    files.forEach((file, index) => {
      if (!file || !file.buffer) return;

      const uploadId = `${req.uploadId || uuidv4()}_${index}`;
      const totalSize = file.size;
      
      // Start tracking this file upload
      uploadProgressService.startUpload(uploadId, totalSize, file.originalname);
      
      // Create a promise that resolves when upload is complete
      const uploadPromise = new Promise((resolve, reject) => {
        // Monitor the file object for changes
        const originalBuffer = file.buffer;
        let lastSize = 0;
        
        const checkProgress = () => {
          if (file.uploadCompleted) {
            uploadProgressService.completeUpload(uploadId, true);
            resolve();
          } else if (file.uploadFailed) {
            uploadProgressService.completeUpload(uploadId, false, file.error);
            reject(new Error(file.error));
          } else {
            // Estimate progress based on time elapsed
            const elapsed = Date.now() - uploadProgressService.getUploadStatus(uploadId)?.startTime;
            const estimatedProgress = Math.min((elapsed / 1000) * 10, 95); // Rough estimate
            uploadProgressService.updateProgress(uploadId, Math.floor(totalSize * estimatedProgress / 100));
            
            setTimeout(checkProgress, 1000); // Check every second
          }
        };
        
        checkProgress();
      });
      
      uploadPromises.push(uploadPromise);
    });

    // Store upload promises for later use
    req.uploadPromises = uploadPromises;
    next();
  };
};

// Endpoint to get upload progress
export const getUploadProgress = (req, res) => {
  const { uploadId } = req.params;
  
  if (!uploadId) {
    return res.status(400).json({ error: 'Upload ID required' });
  }
  
  const upload = uploadProgressService.getUploadStatus(uploadId);
  if (!upload) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  
  res.json({
    id: upload.id,
    filename: upload.filename,
    progress: upload.progress,
    status: upload.status,
    uploadedSize: upload.uploadedSize,
    totalSize: upload.totalSize,
    estimatedTimeRemaining: upload.estimatedTimeRemaining,
    error: upload.error
  });
};

// Endpoint to get all active uploads
export const getActiveUploads = (req, res) => {
  const activeUploads = uploadProgressService.getActiveUploads();
  res.json(activeUploads);
}; 