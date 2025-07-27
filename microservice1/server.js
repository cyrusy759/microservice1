const express = require('express');
const Tesseract = require('tesseract.js');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = path.join(__dirname, req.file.path);
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng', 
      { 
        logger: m => console.log(m) 
      }
    );

    res.json({ text });
    
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});