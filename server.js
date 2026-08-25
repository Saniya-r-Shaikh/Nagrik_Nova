const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. LOCAL DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/nagrik_nova')
  .then(() => console.log('✅ Clean Database Connected!'))
  .catch(err => console.log('❌ DB Error:', err.message));


// --- 2. HACKATHON MODELS ---
const Ticket = mongoose.model('Ticket', new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
}));

const Challenge = mongoose.model('Challenge', new mongoose.Schema({
  title: String,
  description: String,
  department: String,
  status: { type: String, default: 'open' }
}));


// --- 3. API ROUTES ---
// Test Route
app.get('/', (req, res) => res.send('🚀 Nagrik Nova API is Live!'));

// Get all tickets
app.get('/api/tickets', async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
});

// Create a new ticket
app.post('/api/tickets', async (req, res) => {
  const newTicket = new Ticket(req.body);
  await newTicket.save();
  res.json({ message: 'Ticket created successfully', ticket: newTicket });
});


// --- 4. START SERVER ---
app.listen(5000, () => console.log('Server live on port 5000'));