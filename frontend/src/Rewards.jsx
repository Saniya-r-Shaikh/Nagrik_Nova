import React, { useEffect, useState } from "react";
import axios from "axios";
import { Award, Gift, Coins, CheckCircle2, Sparkles } from "lucide-react";

const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });

const mockProducts = [
  { id: 1, name: "Nagrik Nova Official Supporter T-Shirt", price: 100, icon: "👕" },
  { id: 2, name: "LEGO Marvel Spider-Man Keyring", price: 150, icon: "🕷️" },
  { id: 3, name: "Domino's Pizza ₹500 E-Voucher", price: 300, icon: "🍕" },
  { id: 4, name: "OnePlus Nord 4 Custom Back Cover", price: 400, icon: "📱" },
  { id: 5, name: "boAt Airdopes 141 TWS Wireless Earphones", price: 800, icon: "🎧" }
];

export default function Rewards({ user }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch the latest coin balance from the database
  useEffect(() => {
    if (user?.id) {
      api.get(`/users/${user.id}`)
        .then(res => setBalance(res.data.coins || 0))
        .catch(err => console.error("Could not fetch wallet", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleRedeem = (item) => {
    if (balance >= item.price) {
      // Deduct locally just for the demo illusion!
      setBalance(balance - item.price);
      alert(`🎉 Success! Your ${item.name} has been redeemed.\n\nEstimated delivery: 3-5 business days to your registered address.`);
    } else {
      alert("Not enough coins! Keep reporting civic issues to earn more rewards.");
    }
  };

  return (
    <section className="page">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow"><Award size={15} /> Changemaker Rewards</div>
          <h1>Redeem your <em>impact.</em></h1>
          <p>Use the coins you earned from reporting issues to claim rewards.</p>
        </div>
        
        {/* The Virtual Wallet UI */}
        <div style={{ backgroundColor: '#059669', color: 'white', padding: '15px 25px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(5, 150, 105, 0.3)' }}>
          <Coins size={28} />
          <div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Available Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{loading ? '...' : balance} Nova Coins</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {mockProducts.map((item) => (
          <div key={item.id} style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '15px', transition: 'transform 0.2s', cursor: 'pointer' }} className="reward-card">
            <div style={{ fontSize: '40px', textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              {item.icon}
            </div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontWeight: 'bold', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={16}/> {item.price} Coins
              </span>
              <button 
                onClick={() => handleRedeem(item)}
                style={{ backgroundColor: balance >= item.price ? '#111' : '#e5e7eb', color: balance >= item.price ? '#fff' : '#9ca3af', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: balance >= item.price ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}