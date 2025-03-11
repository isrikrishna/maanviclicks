const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint (Create)
app.post('/upload', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const fileUrls = req.files.map(
      (file) => `http://localhost:${PORT}/uploads/${file.filename}`
    );
    res.json({ message: 'Files uploaded successfully!', fileUrls });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch images endpoint with pagination (Read)
app.get('/images', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ message: 'Unable to scan files' });
      }

      // Pagination logic
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default to 10 images per page
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedFiles = files.slice(startIndex, endIndex);
      const fileUrls = paginatedFiles.map(
        (file) => `http://localhost:${PORT}/uploads/${file}`
      );

      res.json({
        fileUrls,
        currentPage: page,
        totalPages: Math.ceil(files.length / limit),
        totalImages: files.length,
      });
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch a single image by filename (Read)
app.get('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update image metadata (Update)
app.put('/images/:filename', (req, res) => {
  try {
    const oldFilename = req.params.filename;
    const newFilename = req.body.newFilename; // New filename from the request body

    const oldFilePath = path.join(__dirname, 'uploads', oldFilename);
    const newFilePath = path.join(__dirname, 'uploads', newFilename);

    if (!fs.existsSync(oldFilePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Rename the file
    fs.renameSync(oldFilePath, newFilePath);

    res.json({ message: 'Image updated successfully!', newFilename });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an image (Delete)
app.delete('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({ message: 'Image deleted successfully!' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});