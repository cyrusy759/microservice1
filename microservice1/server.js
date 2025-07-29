const express = require('express');
const Tesseract = require('tesseract.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure uploads directory relative to your microservice1 folder
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer to store files in your microservice1/uploads directory
const upload = multer({
  dest: UPLOADS_DIR,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('OCR Microservice is running. Use POST /api/ocr to process images.');
});

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = path.join(__dirname, req.file.path);
    console.log(`Processing image at: ${imagePath}`);
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng', 
      { 
        logger: m => console.log(m),
        cachePath: path.join(__dirname, 'tesseract-cache') // Cache OCR data
      }
    );

    // Delete the file after processing
    fs.unlinkSync(imagePath);
    console.log(`Deleted temporary file: ${imagePath}`);

    res.json({ text });
    
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Clean up the uploaded file if something went wrong
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, req.file.path));
    }
    
    res.status(500).json({ 
      error: 'OCR processing failed',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});