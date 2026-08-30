import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

export default function CitizenMap() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    axios.get(`[https://nagrik-nova.onrender.com/api/issues](https://nagrik-nova.onrender.com/api/issues)`)
      .then((r) => setIssues(r.data))
      .catch((err) => console.error("Failed to fetch map issues:", err));
  }, []);

  const center = [18.7278, 73.6781];

  const getCoords = (loc) => {
    if (!loc) return [
      center[0] + (Math.random() - 0.5) * 0.04,
      center[1] + (Math.random() - 0.5) * 0.04
    ];
    
    const match = loc.match(/(\d+\.\d+),\s*(\d+\.\d+)/);
    if (match) return [parseFloat(match[1]), parseFloat(match[2])];
    
    return [
      center[0] + (Math.random() - 0.5) * 0.04,
      center[1] + (Math.random() - 0.5) * 0.04
    ];
  };

  const getColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#ff4444"; 
      case "medium": return "#ffcc00"; 
      case "low": return "#4CAF50"; 
      default: return "#00e5ff"; 
    }
  };

  return (
    <section className="page" style={{ padding: 0, height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "80px", left: "20px", zIndex: 1000, background: "rgba(10,10,10,0.85)", padding: "15px", borderRadius: "10px", border: "1px solid #333", backdropFilter: "blur(5px)" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "white" }}><MapPin size={16}/> Live Citizen Heatmap</h2>
        <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Tracking active signals across the city.</p>
      </div>

      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%", background: "#111" }}>
        {/* THE HACKATHON TRICK: Free OSM tiles with a custom dark-mode CSS class */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          className="dark-map-tiles"
        />
        
        {issues.map(issue => {
          // THE FIX: Safely fallback to a string if issue.location is missing
          const safeLocation = issue.location || "Location not specified";
          const coords = getCoords(safeLocation);
          const color = getColor(issue.priority);
          
          return (
            <CircleMarker
              key={issue._id}
              center={coords}
              pathOptions={{ color: color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
              radius={8}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: "180px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color: color, fontWeight: "bold", letterSpacing: "1px" }}>
                    {issue.analyzed ? `${issue.priority} Priority` : "Pending Analysis"}
                  </span>
                  <h3 style={{ margin: "5px 0", fontSize: "16px", color: "#fff" }}>{issue.title || "Untitled Issue"}</h3>
                  
                  {/* THE FIX: Safe length checking applied here */}
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#aaa" }}>
                    {safeLocation.length > 40 ? safeLocation.substring(0, 40) + "..." : safeLocation}
                  </p>

                  <Link to={`/issues/${issue._id}`} style={{ color: "#4CAF50", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: "bold" }}>
                    View Civic Brief <ArrowRight size={14} />
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </section>
  );
}