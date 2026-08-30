require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body; 
    console.log("REGISTER ATTEMPT:", email); 

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
    console.error("CRASH IN REGISTER:", error); 
    res.status(500).json({ message: 'Error creating account' }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    console.log("LOGIN ATTEMPT:", email, password); 

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
      res.status(401).json({ message: 'Invalid credentials. Wrong email or password.' });
    }
  } catch (error) {
    console.error("CRASH IN LOGIN:", error); 
    res.status(500).json({ message: 'Server crash during login' });
  }
});

// Complaints / Tickets
app.post('/complaints', async (req, res) => {
  const count = await Ticket.countDocuments();
  const generatedId = `TKT-${(count + 1).toString().padStart(3, '0')}`; 
  const ticketData = { ...req.body, ticketId: generatedId };
  const ticket = await new Ticket(ticketData).save();
  res.json({ message: 'Complaint logged', ticket });
});

app.get('/api/issues', async (req, res) => {
  try {
    const issues = await Ticket.find(); 
    res.json(issues);
  } catch (error) {
    console.error("CRASH IN /api/issues:", error); 
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, location, submittedBy } = req.body; 
    console.log("NEW TICKET SUBMITTED:", title);

    const newTicket = await new Ticket({ 
      title, 
      description, 
      location,
      submittedBy, 
      submitterRole: 'citizen',
      analyzed: false
    }).save();
    
    res.json(newTicket);
  } catch (error) {
    console.error("CRASH IN POST /api/issues:", error);
    res.status(500).json({ message: 'Server crash saving the issue' });
  }
});

app.get('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Ticket.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
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

// Challenges, Proposals, Sensor Data, Messages
app.post('/challenges', async (req, res) => res.json(await new Challenge(req.body).save()));
app.get('/challenges', async (req, res) => res.json(await Challenge.find()));
app.post('/proposals', async (req, res) => res.json(await new Proposal(req.body).save()));
app.get('/proposals', async (req, res) => res.json(await Proposal.find()));
app.post('/sensor-data', async (req, res) => res.json(await new SensorData(req.body).save()));
app.get('/sensor-data', async (req, res) => res.json(await SensorData.find()));
app.post('/messages', async (req, res) => res.json(await new Message(req.body).save()));
app.get('/messages', async (req, res) => res.json(await Message.find()));

// --- AI ANALYSIS ROUTE ---
app.post('/api/issues/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log(`[AI AGENT] Asking Gemini to analyze: ${ticket.title}...`);
    console.log("🔑 API KEY STATUS:", process.env.GEMINI_API_KEY ? "LOADED" : "MISSING");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

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

    const result = await model.generateContent(prompt);
    
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("RAW AI RESPONSE:", responseText); 
    
    const aiData = JSON.parse(responseText);

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

// --- AI CHATBOT ROUTE ---
// --- AI CHATBOT ROUTE ---
// --- AI CHATBOT ROUTE ---
app.post('/api/ai/chat', async (req, res) => {
    try {
        // THE FIX: Catch the history array from React
        const { message, history } = req.body;
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const dbContext = await Ticket.find({ status: { $ne: 'resolved' } }).limit(3); 
        const dbContextString = dbContext.length > 0
            ? JSON.stringify(dbContext.map(i => ({ description: i.description, status: i.status })))
            : "No active local issues found.";

        // THE FIX: Convert the history array into a readable script for the AI
        const historyTranscript = history && history.length > 0
            ? history.map(m => `${m.role === 'user' ? 'Citizen' : 'Nova'}: ${m.text}`).join('\n')
            : "No previous conversation.";

        const prompt = `
        You are Nova, the official Nationwide Civic AI Agent for Nagrik Nova across India. 
        Help citizens report infrastructure issues conversationally for any city or state.
        
        Read the conversation history, then reply to the citizen's latest message.
        You must extract: description, category (e.g., Infrastructure, Road Safety), location (anywhere in India), and severity (1 to 3).
        
        [CONVERSATION HISTORY]
        ${historyTranscript}
        
        [CURRENT DATABASE CONTEXT]
        ${dbContextString}
        
        [CITIZEN'S LATEST MESSAGE]
        Citizen: "${message}"

        CRITICAL INSTRUCTION: You MUST respond ONLY with a raw JSON object using exactly these keys. Do not include markdown:
        {
          "message": "Your conversational reply based on the history. Ask for missing details, or thank them if the report is complete.",
          "dataToSave": {
            "description": "extracted string or empty",
            "category": "extracted string or empty",
            "location": "extracted string or empty",
            "severity": 1
          },
          "status": "processing or final_report"
        }
        `;

        const result = await model.generateContent(prompt);
        let aiResponseString = result.response.text();
        
        aiResponseString = aiResponseString.replace(/```json/g, '').replace(/```/g, '').trim();
        let aiResultData = JSON.parse(aiResponseString);
        
        // Failsafe to prevent MongoDB crashes if data is missing
        if (aiResultData.status === 'final_report') {
            if (aiResultData.dataToSave.description && aiResultData.dataToSave.location) {
                const newTicket = new Ticket(aiResultData.dataToSave);
                await newTicket.save();
                aiResultData.message += ` (Report has been automatically submitted to the dashboard!)`;
            } else {
                // If it tries to save too early, force it to keep asking
                aiResultData.status = 'processing';
                aiResultData.message = "I almost have everything, but I just need to confirm the exact location and description before I save this. Could you clarify?";
            }
        }

        const finalMessage = aiResultData.message || "I understood, but my response got jumbled. Could you clarify?";
        res.json({ message: finalMessage });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to process AI request." });
    }
});
// --- START SERVER ---
app.listen(5000, () => console.log('Server live on port 5000'));