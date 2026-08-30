import React, { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import * as THREE from "three";
import axios from "axios";

const store = createXRStore();

function IssuePillar({ issue, position }) {
  const priority = issue.priority?.toLowerCase() || "pending";
  
  // 1. Dynamic Height and Color Logic
  let color, height;

  switch (priority) {
    case "high":
      color = "#ff4444"; // Red
      height = 2.4;      // Over eye level
      break;
    case "medium":
      color = "#ffcc00"; // Yellow
      height = 1.6;      // Slightly lower eye level
      break;
    case "low":
      color = "#4CAF50"; // Green
      height = 1.1;      // Stomach level
      break;
    case "pending":
    default:
      color = "#00e5ff"; // Cyan
      height = 0.5;      // Feet to knee level
      break;
  }
  
  const labelRef = useRef();

  // 2. Custom mathematical tracker: Swivels to face your headset horizontally
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
      
      {/* The 3D Cylinder (Dynamic Height & Color) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, height, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* The Flip-Proof Label Group */}
      <group ref={labelRef} position={[0, height + 0.15, 0]}>
        
        {/* Text faces perfectly forward (0 rotation) to be readable at any height */}
        <group rotation={[0, 0, 0]}>
          <Text 
            position={[0, 0.08, 0]} 
            fontSize={0.12} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {issue.title || "Unknown Issue"}
          </Text>

          <Text 
            position={[0, -0.08, 0]} 
            fontSize={0.07} 
            color={color} 
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {`${priority} Priority`.toUpperCase()}
          </Text>
        </group>

      </group>
    </group>
  );
}

export default function VRCommandCenter() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    axios.get(`https://nagrik-nova.onrender.com/api/issues`)
      .then((r) => setIssues(r.data))
      .catch((err) => console.error("Failed to fetch VR issues:", err));
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
      
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <OrbitControls />
          
          <Grid infiniteGrid fadeDistance={10} sectionColor="#444" cellColor="#222" />

          {issues.map((issue) => {
            const randomX = (Math.random() - 0.5) * 6;
            const randomZ = (Math.random() - 0.5) * 6;
            return <IssuePillar key={issue._id} issue={issue} position={{ x: randomX, z: randomZ }} />;
          })}
        </XR>
      </Canvas>
    </div>
  );
}