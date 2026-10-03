const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Allowed categories for validation
const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

// Helper function to validate ID parameter
const isValidId = (id) => {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
};

// Helper function to validate expense body input
const validateExpenseInput = (title, amount, category, date) => {
  if (!title || amount === undefined || !category || !date) {
    return 'All fields (title, amount, category, date) are required';
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return 'Amount must be a number greater than zero';
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`;
  }
  return null;
};

// GET /api/expenses - Return all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const query = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date 
      FROM expenses 
      ORDER BY date DESC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/expenses/:id - Return one expense
app.get('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID format before querying database
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const query = `
      SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date 
      FROM expenses 
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/expenses - Add an expense
app.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;

  const validationError = validateExpenseInput(title, amount, category, date);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const query = `
      INSERT INTO expenses (title, amount, category, date) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date;
    `;
    const { rows } = await pool.query(query, [title, amount, category, date]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/expenses/:id - Update an expense
app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  // Validate ID format first
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  const validationError = validateExpenseInput(title, amount, category, date);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const query = `
      UPDATE expenses 
      SET title = $1, amount = $2, category = $3, date = $4 
      WHERE id = $5 
      RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date;
    `;
    const { rows } = await pool.query(query, [title, amount, category, date, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID format first
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const query = 'DELETE FROM expenses WHERE id = $1 RETURNING id;';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});