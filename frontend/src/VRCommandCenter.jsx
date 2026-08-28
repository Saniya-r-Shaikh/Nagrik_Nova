import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
// Look! Just one clean import from drei now:
import { OrbitControls, Grid, Html } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import axios from "axios";

const store = createXRStore();

function IssuePillar({ issue, position }) {
  const isHighPriority = issue.priority?.toLowerCase() === "high";
  const color = isHighPriority ? "#ff4444" : "#ffcc00";
  const height = isHighPriority ? 3 : 1.5;

  return (
    <group position={[position.x, 0, position.z]}>
      {/* The 3D Cylinder */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, height, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* The Floating UI Label */}
      <Html
        position={[0, height + 0.4, 0]}
        center
        distanceFactor={12}
        zIndexRange={[100, 0]}
      >
        <div style={{
          background: "rgba(10, 10, 10, 0.85)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "6px",
          border: `1px solid ${color}`,
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: `0px 0px 10px ${color}40`
        }}>
          <strong style={{ display: "block", marginBottom: "2px" }}>
            {issue.title || "Unknown Issue"}
          </strong>
          <span style={{ color: color, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
            {issue.priority || "Pending"} Priority
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function VRCommandCenter() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    // Fetch your existing tickets from your Node backend
    axios.get("http://localhost:5000/api/issues").then((r) => setIssues(r.data));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#111", position: "relative" }}>
      
      <button 
        className="btn"
        onClick={() => store.enterVR()}
        style={{ position: "absolute", top: 20, left: 20, zIndex: 10, padding: "10px 20px" }}
      >
        Enter VR Mode
      </button> 
      
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <OrbitControls />
          
          <Grid infiniteGrid fadeDistance={20} sectionColor="#444" cellColor="#222" />

          {issues.map((issue, i) => {
            const randomX = (Math.random() - 0.5) * 10;
            const randomZ = (Math.random() - 0.5) * 10;
            return <IssuePillar key={issue._id} issue={issue} position={{ x: randomX, z: randomZ }} />;
          })}
        </XR>
      </Canvas>
    </div>
  );
}