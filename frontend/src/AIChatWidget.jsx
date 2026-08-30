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
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999, fontFamily: 'inherit' }}>
      {isOpen ? (
        <div style={{ width: '340px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eaeaea' }}>
          <div style={{ backgroundColor: '#059669', color: '#fff', padding: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Nova AI Agent</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✖</button>
          </div>
          
          <div style={{ height: '320px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', backgroundColor: msg.role === 'user' ? '#059669' : '#e5e7eb', color: msg.role === 'user' ? '#fff' : '#1f2937', fontSize: '14px', lineHeight: '1.4' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Nova is thinking...</div>}
          </div>

          <form onSubmit={sendMessage} style={{ padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #eaeaea', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..." 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>
              Send
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          💬 Chat with Nova
        </button>
      )}
    </div>
  );
}