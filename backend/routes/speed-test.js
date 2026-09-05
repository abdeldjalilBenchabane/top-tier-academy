import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for speed tests
  }
});

// Original speed test endpoint (JSON data)
router.post('/', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided for speed test' });
    }
    
    // Calculate the size of the received data
    const dataSize = Buffer.byteLength(data, 'utf8');
    const dataSizeMB = dataSize / (1024 * 1024);
    
    // Send back the data size for calculation
    res.json({
      received: true,
      dataSize: dataSize,
      dataSizeMB: dataSizeMB,
      message: 'Speed test completed'
    });
    
  } catch (error) {
    console.error('Speed test error:', error);
    res.status(500).json({ error: 'Speed test failed' });
  }
});

// New dynamic speed test endpoint (file upload)
router.post('/upload', upload.single('speedTest'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided for speed test' });
    }
    
    const fileSize = req.file.size;
    const fileSizeMB = fileSize / (1024 * 1024);
    
    // Send back the file size for calculation
    res.json({
      received: true,
      fileSize: fileSize,
      fileSizeMB: fileSizeMB,
      filename: req.file.originalname,
      message: 'Dynamic speed test completed'
    });
    
  } catch (error) {
    console.error('Dynamic speed test error:', error);
    res.status(500).json({ error: 'Dynamic speed test failed' });
  }
});

// Ping endpoint for latency-based speed estimation
router.get('/ping', async (req, res) => {
  try {
    res.json({
      pong: true,
      timestamp: Date.now(),
      message: 'Ping successful'
    });
  } catch (error) {
    console.error('Ping error:', error);
    res.status(500).json({ error: 'Ping failed' });
  }
});

export default router; 