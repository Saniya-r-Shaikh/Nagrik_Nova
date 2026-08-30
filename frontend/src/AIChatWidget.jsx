import React, { useState } from 'react';
import axios from 'axios';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi! I am Nova, the AI assistant for Talegaon. You can report an issue or ask about existing ones. How can I help?' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // Remember to ensure this URL matches your live Render domain exactly
      const response = await axios.post('https://nagrik-nova.onrender.com/api/ai/chat', {
        message: userMessage
      });

      setMessages((prev) => [...prev, { role: 'agent', text: response.data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'agent', text: 'Sorry, I lost connection to the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-emerald-600 text-white p-4 font-bold flex justify-between items-center">
            <span>Nova AI Agent</span>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">✖</button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500 italic">Nova is typing...</div>}
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-emerald-500 text-black"
            />
            <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all font-bold"
        >
          💬 Chat with Nova
        </button>
      )}
    </div>
  );
}