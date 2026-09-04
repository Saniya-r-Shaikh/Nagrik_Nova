import React, { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import * as THREE from "three";
import axios from "axios";
import { ShieldAlert, Activity, Cpu } from "lucide-react";

const store = createXRStore();

function IssuePillar({ issue, position }) {
  const priority = issue.priority?.toLowerCase() || "pending";
  let color, height;

  switch (priority) {
    case "high":
      color = "#ff4444"; 
      height = 2.4; 
      break;
    case "medium":
      color = "#ffcc00"; 
      height = 1.6; 
      break;
    case "low":
      color = "#4CAF50"; 
      height = 1.1; 
      break;
    case "pending":
    default:
      color = "#00e5ff"; 
      height = 0.5; 
      break;
  }
  
  const labelRef = useRef();

  useFrame(({ camera }) => {
    if (labelRef.current) {
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      const dx = camPos.x - position.x;
      const dz = camPos.z - position.z;
      labelRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, height, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      <group ref={labelRef} position={[0, height + 0.15, 0]}>
        <group rotation={[0, 0, 0]}>
          <Text 
            position={[0, 0.08, 0]} 
            fontSize={0.11} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {issue.title ? (issue.title.length > 25 ? issue.title.substring(0, 22) + "..." : issue.title) : "Civic Signal"}
          </Text>

          <Text 
            position={[0, -0.08, 0]} 
            fontSize={0.065} 
            color={color} 
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {`${priority.toUpperCase()} PRIORITY`}
          </Text>
        </group>
      </group>
    </group>
  );
}

export default function VRCommandCenter() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`https://nagrik-nova.onrender.com/api/issues`)
      .then((r) => setIssues(r.data))
      .catch((err) => console.error("Failed to fetch VR issues:", err))
      .finally(() => setLoading(false));
  }, []);

  const highCount = issues.filter(i => i.priority?.toLowerCase() === "high").length;
  const medCount = issues.filter(i => i.priority?.toLowerCase() === "medium").length;

  return (
    <div style={{ width: "100vw", height: "calc(100vh - 70px)", backgroundColor: "#0a0a0a", position: "relative", overflow: "hidden" }}>
      
      {/* MISSION CONTROL HUD OVERLAY */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, display: "flex", gap: "15px", pointerEvents: "none" }}>
        <div style={{ background: "rgba(10, 10, 10, 0.9)", border: "1px solid #333", padding: "12px 20px", borderRadius: "10px", color: "white", backdropFilter: "blur(5px)" }}>
          <div style={{ fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}><Cpu size={14}/> SYSTEM STATUS</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00e5ff" }}>ONLINE (SECURE)</div>
        </div>
        <div style={{ background: "rgba(10, 10, 10, 0.9)", border: "1px solid #333", padding: "12px 20px", borderRadius: "10px", color: "white", backdropFilter: "blur(5px)" }}>
          <div style={{ fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}><ShieldAlert size={14}/> HIGH PRIORITY</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ff4444" }}>{highCount} Active Alerts</div>
        </div>
        <div style={{ background: "rgba(10, 10, 10, 0.9)", border: "1px solid #333", padding: "12px 20px", borderRadius: "10px", color: "white", backdropFilter: "blur(5px)" }}>
          <div style={{ fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}><Activity size={14}/> TOTAL SIGNALS</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#4CAF50" }}>{issues.length} Processed</div>
        </div>
      </div>

      <button 
        onClick={() => store.enterVR()}
        style={{ position: "absolute", top: 20, right: 20, zIndex: 10, padding: "12px 24px", background: "#00e5ff", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 20px rgba(0,229,255,0.4)" }}
      >
        🥽 Launch Immersive VR Mode
      </button> 
      
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <XR store={store}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          
          <OrbitControls enablePan={true} enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.05} />
          
          <Grid infiniteGrid fadeDistance={15} sectionColor="#00e5ff" cellColor="#222" sectionSize={3} />

          {issues.map((issue, index) => {
            // Deterministic layout mapping based on index so pillars don't jump around on re-renders
            const angle = (index / issues.length) * Math.PI * 2;
            const radius = 1.5 + (index % 3) * 1.2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            return <IssuePillar key={issue._id || index} issue={issue} position={{ x, z }} />;
          })}
        </XR>
      </Canvas>

      {loading && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "#00e5ff", background: "rgba(0,0,0,0.8)", padding: "10px 20px", borderRadius: "8px", border: "1px solid #00e5ff" }}>
          🔄 Syncing live grid signals from database...
        </div>
      )}
    </div>
  );
}