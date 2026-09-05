import React, { useEffect, useState } from "react";
import axios from "axios";
import { Award, Gift, Coins, CheckCircle2, Sparkles, Package, Clock } from "lucide-react";

const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });

// THE FIX: Mapped the exact final image strings you provided.
const mockProducts = [
  { id: 1, name: "Nagrik Nova Official Supporter T-Shirt", price: 100, image: "/watermarked_img_2354946755341967162-removebg-preview_3.png" },
  { id: 2, name: "LEGO Marvel Spider-Man Keyring", price: 150, image: "/854290_4.png" }, 
  { id: 3, name: "Domino's Pizza ₹500 E-Voucher", price: 300, image: "/32a0d627-ade5-4988-8936-330a4b22d6a4-removebg-preview_3.png" },
  { id: 4, name: "OnePlus Nord 4 Custom Back Cover", price: 400, image: "/868e78b2-bba0-48f0-9482-4c0d2e7fb608-removebg-preview_3.png" },
  { id: 5, name: "boAt Airdopes 141 TWS Wireless Earphones", price: 800, image: "/images-removebg-preview_3.png" }
];

export default function Rewards({ user }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      api.get(`/users/${userId}`)
        .then(res => setBalance(res.data.coins || 0))
        .catch(err => console.error("Could not fetch wallet", err))
        .finally(() => setLoading(false));

      const savedOrders = JSON.parse(localStorage.getItem(`nn-orders-${userId}`) || "[]");
      setOrders(savedOrders);
    }
  }, [userId]);

  const handleRedeem = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    if (balance >= item.price) {
      const confirmRedeem = window.confirm(`Do you want to redeem '${item.name}' for ${item.price} Nova Coins?`);
      
      if (!confirmRedeem) return; 

      try {
        const res = await api.post(`/users/${userId}/redeem`, { cost: item.price });
        setBalance(res.data.coins);

        const newOrder = {
          orderId: `ORD-${Math.floor(Math.random() * 100000)}`,
          name: item.name,
          date: new Date().toLocaleDateString(),
          status: "Processing",
          icon: item.icon, 
          image: item.image 
        };
        
        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem(`nn-orders-${userId}`, JSON.stringify(updatedOrders));

        alert(`🎉 Success! Your ${item.name} has been redeemed.\n\nEstimated delivery: 3-5 business days to your registered address.`);
      } catch (error) {
        console.error("Redemption failed:", error);
        alert("Something went wrong while processing your redemption. Please try again.");
      }
    } else {
      alert("Not enough coins! Keep reporting civic issues to earn more rewards.");
    }
  };

  return (
    <section className="page">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div className="eyebrow"><Award size={15} /> Changemaker Rewards</div>
          <h1>Redeem your <em>impact.</em></h1>
          <p>Use the coins you earned from reporting issues to claim rewards.</p>
        </div>
        
        <div className="chat-bubble" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Coins size={32} color="#fff" />
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Available Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{loading ? '...' : balance} Nova Coins</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {mockProducts.map((item) => (
          <div key={item.id} className="issue" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 'auto' }}>
            
            <div style={{ fontSize: '40px', textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '12px', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                item.icon
              )}
            </div>
            
            <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={16}/> {item.price} Coins
              </span>
              
              <button 
                type="button"
                className="btn small"
                onClick={(e) => handleRedeem(e, item)}
                disabled={balance < item.price}
                style={{ 
                  cursor: balance >= item.price ? 'pointer' : 'not-allowed',
                  opacity: balance >= item.price ? 1 : 0.5,
                  padding: '8px 16px',
                  position: 'relative', 
                  zIndex: 10 
                }}
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length > 0 && (
        <div style={{ marginTop: '50px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '30px' }}>
          <h2><Package size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Your Orders</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {orders.map((order) => (
              <div key={order.orderId} className="issue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', minHeight: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  
                  <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {order.image ? (
                       <img src={order.image} alt={order.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                       <span style={{ fontSize: '24px' }}>{order.icon}</span>
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{ margin: 0 }}>{order.name}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Order ID: {order.orderId} • Placed on {order.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontWeight: 'bold', fontSize: '14px', background: 'rgba(254, 243, 199, 0.7)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(5px)' }}>
                  <Clock size={14} /> {order.status}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
    </section>
  );
}