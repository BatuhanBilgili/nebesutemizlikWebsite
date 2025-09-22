const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test database connection
pool.on('connect', () => {
  console.log('Connected to Neon Tech database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

let isDbInitialized = false;

// Initialize database tables (run once per process)
async function initializeDatabase() {
  if (isDbInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        service VARCHAR(50) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        service VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_processed BOOLEAN DEFAULT false
      )
    `);

    isDbInitialized = true;
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Helper to normalize boolean flags to 1/0 for API responses
function serializeContact(row) {
  return {
    ...row,
    is_processed: row.is_processed ? 1 : 0
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, email, service, rating, text } = req.body;

    if (!name || !service || !rating || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (name, email, service, rating, text) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, service, rating, text]
    );

    res.status(201).json({
      message: 'Yorumunuz başarıyla eklendi!',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
  }
});

// Submit contact request
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, service, message } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO contact_requests (name, phone, service, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, service, message]
    );

    res.status(201).json({
      message: 'Contact request submitted successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting contact request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin credentials / token (env ile yönetilebilir)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nebesu2024';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'nebesu_static_token_2024';

// Simple admin auth middleware (Bearer token)
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Admin login - returns token if password matches
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// Admin routes (for managing reviews) - protected with adminAuth
app.get('/api/admin/reviews', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete review
app.delete('/api/admin/reviews/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: get contact requests
app.get('/api/admin/contact-requests', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contact_requests ORDER BY created_at DESC'
    );
    const mapped = result.rows.map(serializeContact);
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark contact request processed
app.patch('/api/admin/contact-requests/:id/process', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE contact_requests SET is_processed = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request marked processed', request: result.rows[0] });
  } catch (error) {
    console.error('Error processing contact request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark contact request unprocessed
app.patch('/api/admin/contact-requests/:id/unprocess', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE contact_requests SET is_processed = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request marked unprocessed', request: result.rows[0] });
  } catch (error) {
    console.error('Error unprocessing contact request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact request
app.delete('/api/admin/contact-requests/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM contact_requests WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Contact request deleted' });
  } catch (error) {
    console.error('Error deleting contact request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function prepare() {
  await initializeDatabase();
}

module.exports = { app, prepare };


