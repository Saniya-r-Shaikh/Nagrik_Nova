require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Clean Database Connected!'))
  .catch(err => console.log('❌ DB Error:', err.message));

// --- MODELS (6 Collections) ---
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String, role: String }));
const Ticket = mongoose.model('Ticket', new mongoose.Schema({ 
  ticketId: String, 
  title: String, 
  description: String, 
  location: String,

  // --- THE MISSING PIECE ---
  submittedBy: String, 
  
  submitterRole: { type: String, default: 'citizen' }, 
  analyzed: { type: Boolean, default: false }, 
  status: { type: String, default: 'open' }, 
  createdAt: { type: Date, default: Date.now },
  
  domain: String,
  priority: String,
  requiredExpertise: [String],
  solutionIdea: String,
  matchedOrganizations: Array
}));
const Challenge = mongoose.model('Challenge', new mongoose.Schema({ title: String, description: String }));
const Proposal = mongoose.model('Proposal', new mongoose.Schema({ challengeId: String, solution: String }));
const SensorData = mongoose.model('SensorData', new mongoose.Schema({ sensorType: String, reading: String, timestamp: { type: Date, default: Date.now } }));
const Message = mongoose.model('Message', new mongoose.Schema({ senderId: String, content: String }));

// --- ESSENTIAL APIs ---

// Users & Auth (Basic Login)
// Register a new user (Hackathon simple version)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body; 
    console.log("REGISTER ATTEMPT:", email); // <-- Snitch log

    const user = await new User({ username: email, password, role }).save();
    
    res.json({ 
      message: 'User created successfully',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      user: { 
        id: user._id,
        email: user.username, 
        name: name || user.username, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error("CRASH IN REGISTER:", error); // <-- Snitch log
    res.status(500).json({ message: 'Error creating account' }); // Changed to 'message' for the frontend
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    console.log("LOGIN ATTEMPT:", email, password); // <-- Snitch log

    const user = await User.findOne({ username: email, password });
    
    if (user) {
      console.log("LOGIN SUCCESS FOR:", email);
      res.json({ 
        message: 'Login successful',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
        user: { 
          id: user._id,
          email: user.username, 
          name: user.username, 
          role: user.role 
        }
      });
    } else {
      console.log("LOGIN FAILED: Wrong email or password");
      // Saniya's code looks for 'message', not 'error', so we fix that here!
      res.status(401).json({ message: 'Invalid credentials. Wrong email or password.' });
    }
  } catch (error) {
    console.error("CRASH IN LOGIN:", error); // <-- Snitch log
    res.status(500).json({ message: 'Server crash during login' });
  }
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
// Add this route to catch the frontend's request for issues
app.get('/api/issues', async (req, res) => {
  try {
    // Fetching from your Ticket model!
    const issues = await Ticket.find(); 
    
    // Send the array of tickets back to the frontend
    res.json(issues);
  } catch (error) {
    console.error("CRASH IN /api/issues:", error); 
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});
app.post('/api/issues', async (req, res) => {
  try {
    // 1. ADD submittedBy HERE so the backend grabs it
    const { title, description, location, submittedBy } = req.body; 
    console.log("NEW TICKET SUBMITTED:", title);

    const newTicket = await new Ticket({ 
      title, 
      description, 
      location,
      submittedBy, // 2. ADD IT HERE so it saves to the database
      submitterRole: 'citizen',
      analyzed: false
    }).save();
    
    res.json(newTicket);
  } catch (error) {
    console.error("CRASH IN POST /api/issues:", error);
    res.status(500).json({ message: 'Server crash saving the issue' });
  }
});
// Fetch a single issue by its ID
app.get('/api/issues/:id', async (req, res) => {
  try {
    // Grab the ID from the URL
    const { id } = req.params;
    
    // Find that specific ticket in your database
    const issue = await Ticket.findById(id);
    
    // If someone clicks a deleted/fake ID, tell the frontend it's missing
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Send the full ticket data back to Saniya's UI!
    res.json(issue);
  } catch (error) {
    console.error("CRASH IN GET /api/issues/:id:", error);
    res.status(500).json({ message: 'Failed to fetch the issue details' });
  }
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

// --- AI ANALYSIS ROUTE ---
// --- AI ANALYSIS ROUTE ---
app.post('/api/issues/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log(`[AI AGENT] Asking Gemini to analyze: ${ticket.title}...`);

    // Initialize Gemini
    // This will tell us if your .env file is actually working!
console.log("🔑 API KEY STATUS:", process.env.GEMINI_API_KEY ? "LOADED" : "MISSING");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Testing the new 3.1-flash-lite model!
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // The Prompt
    const prompt = `
      You are an expert civic planning AI for a platform called Nagrik Nova.
      Analyze this community issue:
      Title: "${ticket.title}"
      Description: "${ticket.description}"
      Location: "${ticket.location}"
      
      Respond strictly with a RAW JSON object. Do not include markdown formatting or backticks. 
      Use exactly these keys:
      - "domain": A short category (e.g., "Urban Infrastructure", "Public Health", "Sanitation")
      - "priority": Strictly one of ["High", "Medium", "Low"]
      - "requiredExpertise": An array of 2-3 specific skills needed (e.g., ["Civil Engineering", "Data Analytics"])
      - "solutionIdea": A concise, 2-sentence actionable solution pathway.
    `;

    // Call the API
    const result = await model.generateContent(prompt);
    
    // Clean up markdown blocks
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Snitch log
    console.log("RAW AI RESPONSE:", responseText); 
    
    // Parse response
    const aiData = JSON.parse(responseText);

    // Update ticket
    ticket.analyzed = true;
    ticket.domain = aiData.domain;
    ticket.priority = aiData.priority;
    ticket.requiredExpertise = aiData.requiredExpertise;
    ticket.solutionIdea = aiData.solutionIdea;
    
    ticket.matchedOrganizations = [
      {
        userId: "org-1",
        role: "university",
        name: "Siddhant College of Engineering", 
        expertise: aiData.requiredExpertise 
      }
    ];

    await ticket.save();
    console.log("[AI AGENT] Analysis complete! Sending to frontend.");
    res.json(ticket);

  } catch (error) {
    console.error("CRASH IN AI ANALYZE:", error);
    res.status(500).json({ message: 'AI Analysis failed' });
  }
});
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // 1. Initialize the AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        // Using the ultra-fast 3 Flash model we tested
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview", 
            generationConfig: { responseMimeType: "application/json" }
        });

        // 2. Fetch recent database context (RAG)
        // Note: Make sure 'Issue' matches the name of your Mongoose model!
        const dbContext = await Issue.find({ status: { $ne: 'resolved' } }).limit(3); 
        const dbContextString = dbContext.length > 0
            ? JSON.stringify(dbContext.map(i => ({ description: i.description, status: i.status })))
            : "No active local issues found.";

        // 3. Generate the response
        const prompt = `User Message: "${message}"\n\n[DATABASE CONTEXT]: ${dbContextString}`;
        const result = await model.generateContent(prompt);
        const aiResponseString = result.response.text();
        
        // 4. Parse the JSON and potentially save to DB
        let aiResultData = JSON.parse(aiResponseString);
        
        if (aiResultData.status === 'final_report') {
            const newIssue = new Issue(aiResultData.dataToSave);
            await newIssue.save();
            aiResultData.message += ` (Report has been submitted to the dashboard!)`;
        }

        res.json({ message: aiResultData.message });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to process AI request." });
    }
});
// --- START SERVER ---
app.listen(5000, () => console.log('Server live on port 5000'));