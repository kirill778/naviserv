import express from 'express';
import jwt from 'jsonwebtoken';
import { CsvFile, User } from '../models/index.js'; // Assuming models are exported from index.js
import { Sequelize } from 'sequelize';
import multer from 'multer';
import { parse } from 'csv-parse'; // Using a promise-based version might be cleaner if available or write a wrapper
import streamifier from 'streamifier';

const router = express.Router();
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-for-jwt-tokens', (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403); // invalid token
    }
    req.user = user; // Add user payload to request
    next();
  });
};

// Add a test route at the very top to diagnose JSON handling
router.post('/debug-save', (req, res) => {
  console.log("DEBUG ROUTE - REQUEST BODY:", req.body);
  res.status(200).json({ 
    message: "Debug route hit successfully",
    receivedData: req.body
  });
});

// Add a simple save route without authentication for testing
router.post('/save-test', async (req, res) => {
  console.log("TEST SAVE ROUTE - NO AUTH");
  console.log("Request body:", req.body);
  res.status(200).json({
    message: "Test save endpoint hit",
    receivedData: req.body
  });
});

// GROUP 1: Static routes that don't use URL parameters
// ==============================================================

// GET /api/csv-files - Get list of user's CSV files
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const files = await CsvFile.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['data'] } // Exclude data field for list view
    });
    res.json(files);
  } catch (error) {
    console.error('Error fetching CSV files:', error);
    res.status(500).json({ message: 'Error fetching CSV files', detail: error.message });
  }
});

// POST /api/csv-files/upload - Upload and process CSV file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  const userId = req.user.user_id;
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
    return res.status(400).json({ message: 'Only CSV files are allowed' });
  }

  try {
    const fileContent = req.file.buffer.toString('utf-8'); // Or detect encoding
    
    // Use a Promise to handle the csv-parse callback
    const records = await new Promise((resolve, reject) => {
      parse(fileContent, { columns: false, skip_empty_lines: true }, (err, records) => {
        if (err) {
          return reject(err);
        }
        resolve(records);
      });
    });

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or could not be parsed.'});
    }

    const columnHeaders = records[0] || [];
    const fileData = records.slice(1);
    const rowCount = fileData.length;
    const fileSize = req.file.size;

    const newCsvFile = await CsvFile.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      size: fileSize,
      mimeType: req.file.mimetype || 'text/csv',
      userId: userId,
      columnHeaders: columnHeaders,
      rowCount: rowCount,
      data: fileData,
      processedAt: new Date(),
    });

    res.status(201).json(newCsvFile);
  } catch (error) {
    console.error('Error processing uploaded CSV file:', error);
    if (error.message.includes('Invalid Record Length')) {
        return res.status(400).json({ message: 'CSV parsing error: Invalid record length. Check for consistent column counts or quoting issues.', detail: error.message });
    }
    res.status(500).json({ message: 'Error processing uploaded CSV file', detail: error.message });
  }
});

// POST /api/csv-files/save - Save spreadsheet data
router.post('/save', authenticateToken, async (req, res) => {
  console.log("POST /save route hit");
  const { headers, data, name } = req.body;
  const userId = req.user.user_id; // Get userId from authenticated user

  if (!headers || !data || !name) {
    return res.status(400).json({ message: 'Missing required fields: headers, data, name' });
  }

  try {
    // Estimate size (similar to Python version)
    let sizeEstimate = 0;
    if (data) {
      data.forEach(row => {
        if (row) {
          row.forEach(cell => {
            if (cell !== null && cell !== undefined) {
              sizeEstimate += String(cell).length + 1;
            }
          });
        }
      });
    }
    if (headers) {
      headers.forEach(header => {
        if (header) {
          sizeEstimate += String(header).length + 1;
        }
      });
    }
    
    const filteredData = data.filter(row => row && row.some(cell => cell !== null && cell !== '' && cell !== undefined));
    const rowCount = filteredData.length;

    console.log("Creating new CSV file record with data");
    const newCsvFile = await CsvFile.create({
      name: name,
      originalName: name,
      size: sizeEstimate,
      mimeType: 'text/csv',
      userId: userId,
      columnHeaders: headers,
      rowCount: rowCount,
      data: filteredData, // Store data as JSON
      processedAt: new Date(),
      // path will be null as we are not saving to disk
    });

    console.log("CSV file created successfully:", newCsvFile.id);
    res.status(201).json(newCsvFile);
  } catch (error) {
    console.error('Error saving CSV file:', error);
    res.status(500).json({ message: 'Error saving CSV file', detail: error.message });
  }
});

// GROUP 2: Routes with file_id parameter in the URL path
// ==============================================================

// GET /api/csv-files/content/:file_id - Get CSV file content
router.get('/content/:file_id', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { file_id } = req.params;
  try {
    const file = await CsvFile.findOne({
      where: { id: file_id, userId }
    });
    if (!file) {
      return res.status(404).json({ message: 'CSV file not found' });
    }
    // Data is already stored as JSON in the 'data' field
    res.json({ headers: file.columnHeaders, data: file.data || [] });
  } catch (error) {
    console.error('Error fetching CSV file content:', error);
    res.status(500).json({ message: 'Error fetching CSV file content', detail: error.message });
  }
});

// GET /api/csv-files/:file_id - Get specific CSV file details
router.get('/:file_id', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { file_id } = req.params;
  try {
    const file = await CsvFile.findOne({
      where: { id: file_id, userId },
      attributes: { exclude: ['data'] } // Exclude data field for details view initially
    });
    if (!file) {
      return res.status(404).json({ message: 'CSV file not found' });
    }
    res.json(file);
  } catch (error) {
    console.error('Error fetching CSV file details:', error);
    res.status(500).json({ message: 'Error fetching CSV file details', detail: error.message });
  }
});

// PUT /api/csv-files/:file_id - Update an existing CSV file
router.put('/:file_id', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { file_id } = req.params;
  const { headers, data, name } = req.body;

  if (!headers || !data) {
    return res.status(400).json({ message: 'Missing required fields: headers, data' });
  }

  try {
    const file = await CsvFile.findOne({
      where: { id: file_id, userId }
    });

    if (!file) {
      return res.status(404).json({ message: 'CSV file not found' });
    }

    // Estimate size
    let sizeEstimate = 0;
    if (data) {
      data.forEach(row => {
        if (row) {
          row.forEach(cell => {
            if (cell !== null && cell !== undefined) {
              sizeEstimate += String(cell).length + 1;
            }
          });
        }
      });
    }
    if (headers) {
      headers.forEach(header => {
        if (header) {
          sizeEstimate += String(header).length + 1;
        }
      });
    }
    
    const filteredData = data.filter(row => row && row.some(cell => cell !== null && cell !== '' && cell !== undefined));
    const rowCount = filteredData.length;

    file.columnHeaders = headers;
    file.data = filteredData;
    file.rowCount = rowCount;
    file.size = sizeEstimate;
    if (name) { // Update name if provided
      file.name = name;
      // file.originalName could also be updated if that's desired behavior
    }
    file.processedAt = new Date();

    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error updating CSV file:', error);
    res.status(500).json({ message: 'Error updating CSV file', detail: error.message });
  }
});

// DELETE /api/csv-files/:file_id - Delete a CSV file
router.delete('/:file_id', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { file_id } = req.params;

  try {
    const file = await CsvFile.findOne({
      where: { id: file_id, userId }
    });

    if (!file) {
      return res.status(404).json({ message: 'CSV file not found' });
    }

    await file.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting CSV file:', error);
    res.status(500).json({ message: 'Error deleting CSV file', detail: error.message });
  }
});

export default router; 