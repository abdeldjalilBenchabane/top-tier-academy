import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for upload tests
  }
});

// Real upload test endpoint that simulates internet upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided for upload test' });
    }
    
    const fileSize = req.file.size;
    const fileSizeMB = fileSize / (1024 * 1024);
    
    // Process the file immediately without artificial delays
    // This measures actual upload time without interference
    
    res.json({
      success: true,
      fileSize: fileSize,
      fileSizeMB: fileSizeMB,
      filename: req.file.originalname,
      message: 'Dynamic upload test completed'
    });
    
  } catch (error) {
    console.error('Upload test error:', error);
    res.status(500).json({ error: 'Upload test failed' });
  }
});

export default router;
