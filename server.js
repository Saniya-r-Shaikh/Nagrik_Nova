const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/nagrik_nova')
  .then(() => console.log('✅ Clean Database Connected!'))
  .catch(err => console.log('❌ DB Error:', err.message));

// --- MODELS (6 Collections) ---
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String, role: String }));
const Ticket = mongoose.model('Ticket', new mongoose.Schema({ ticketId: String, title: String, description: String, status: { type: String, default: 'open' }, createdAt: { type: Date, default: Date.now } }));
const Challenge = mongoose.model('Challenge', new mongoose.Schema({ title: String, description: String }));
const Proposal = mongoose.model('Proposal', new mongoose.Schema({ challengeId: String, solution: String }));
const SensorData = mongoose.model('SensorData', new mongoose.Schema({ sensorType: String, reading: String, timestamp: { type: Date, default: Date.now } }));
const Message = mongoose.model('Message', new mongoose.Schema({ senderId: String, content: String }));

// --- ESSENTIAL APIs ---

// Users & Auth (Basic Login)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) res.json({ message: 'Login successful', role: user.role });
  else res.status(401).json({ error: 'Invalid credentials' });
});

// Complaints / Tickets
app.post('/complaints', async (req, res) => {
  // Hackathon logic: count existing tickets and format the new ID
  const count = await Ticket.countDocuments();
  const generatedId = `TKT-${(count + 1).toString().padStart(3, '0')}`; // Makes TKT-001, TKT-002, etc.

  // Merge the new ID with the data from the frontend
  const ticketData = { ...req.body, ticketId: generatedId };
  
  const ticket = await new Ticket(ticketData).save();
  res.json({ message: 'Complaint logged', ticket });
});
app.get('/tickets', async (req, res) => res.json(await Ticket.find()));
app.get('/tickets/:id', async (req, res) => res.json(await Ticket.findById(req.params.id)));
app.put('/tickets/:id', async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Ticket updated', ticket });
});

// Challenges
app.post('/challenges', async (req, res) => res.json(await new Challenge(req.body).save()));
app.get('/challenges', async (req, res) => res.json(await Challenge.find()));

// Proposals
app.post('/proposals', async (req, res) => res.json(await new Proposal(req.body).save()));
app.get('/proposals', async (req, res) => res.json(await Proposal.find()));

// Sensor Data
app.post('/sensor-data', async (req, res) => res.json(await new SensorData(req.body).save()));
app.get('/sensor-data', async (req, res) => res.json(await SensorData.find()));

// Messages
app.post('/messages', async (req, res) => res.json(await new Message(req.body).save()));
app.get('/messages', async (req, res) => res.json(await Message.find()));

// --- START SERVER ---
app.listen(5000, () => console.log('Server live on port 5000'));