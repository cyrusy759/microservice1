const express = require('express');
const multer = require('multer');
const { getDocument } = require('pdfjs-dist/legacy/build/pdf.js');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Configuration
const JWT_SECRET = '77e68f621172a7bb026908a01eb9588e245ee759b554f31a98d06258a587699e';
const TOKEN_EXPIRY = '1h';
const USERS_FILE = path.join(__dirname, 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fsSync.existsSync(UPLOADS_DIR)) {
  fsSync.mkdirSync(UPLOADS_DIR);
}

// Initialize users.json if it doesn't exist
if (!fsSync.existsSync(USERS_FILE)) {
  fsSync.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    req.user = users.find(user => user.id === decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper functions for file operations
const readUsers = async () => {
  const data = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(data);
};

const writeUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readUsers();
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      files: []
    };

    users.push(user);
    await writeUsers(users);

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.status(201).json({ 
      user: { 
        id: user.id, 
        email: user.email,
        createdAt: user.createdAt,
        fileCount: user.files.length
      }, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readUsers();
    const user = users.find(user => user.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        createdAt: user.createdAt,
        fileCount: user.files.length
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PDF to CSV Conversion
app.post('/convert', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdf = await getDocument(req.file.buffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    const lines = fullText.split('\n').filter(line => line.trim() !== '');
    const csvContent = lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');

    // Generate file info
    const fileId = uuidv4();
    const fileName = req.file.originalname.replace('.pdf', '') + '.csv';
    const filePath = path.join(UPLOADS_DIR, `${fileId}.csv`);
    
    // Save CSV file
    await fs.writeFile(filePath, csvContent);

    // Update user's files
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileInfo = {
      id: fileId,
      originalName: req.file.originalname,
      csvName: fileName,
      createdAt: new Date().toISOString(),
      size: csvContent.length
    };

    users[userIndex].files.push(fileInfo);
    await writeUsers(users);

    res.json({
      ...fileInfo,
      downloadUrl: `/files/${fileId}/download`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message 
    });
  }
});

// Download CSV File
app.get('/files/:fileId/download', authenticate, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.id);
    const file = user?.files.find(f => f.id === req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(UPLOADS_DIR, `${file.id}.csv`);
    const fileContent = await fs.readFile(filePath, 'utf8');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${file.csvName}`);
    res.send(fileContent);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Get File Info
app.get('/files/:fileId', authenticate, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.id);
    const file = user?.files.find(f => f.id === req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      ...file,
      downloadUrl: `/files/${file.id}/download`
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Get User's Files
app.get('/files', authenticate, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.files.map(file => ({
      ...file,
      downloadUrl: `/files/${file.id}/download`
    })));
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete File
app.delete('/files/:fileId', authenticate, async (req, res) => {
  try {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileIndex = users[userIndex].files.findIndex(f => f.id === req.params.fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Remove file from disk
    const filePath = path.join(UPLOADS_DIR, `${req.params.fileId}.csv`);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('File not found on disk, continuing with deletion');
    }

    // Remove file from user's files
    users[userIndex].files.splice(fileIndex, 1);
    await writeUsers(users);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});