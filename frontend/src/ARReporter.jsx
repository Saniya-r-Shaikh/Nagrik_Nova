import React, { useState, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import * as THREE from "three";

const store = createXRStore();

// 1. The Sci-Fi Hologram
function HologramPin({ position }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02;
      groupRef.current.position.y = position.y + Math.sin(state.clock.getElapsedTime() * 3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 0, position.z]}>
      <mesh position={[0, position.y, 0]}>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, position.y - 0.2, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 2. The Math Manager (Just handles the 3D pin now)
function ARSceneManager({ stagedPin, setStagedPin }) {
  const { gl } = useThree();

  const handleScreenTap = (e) => {
    e.stopPropagation();
    if (stagedPin) return;

    const xrCamera = gl.xr.getCamera();
    const pos = new THREE.Vector3();
    xrCamera.getWorldPosition(pos);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion);

    pos.add(dir.multiplyScalar(1.5));
    pos.y -= 0.4;

    setStagedPin({ x: pos.x, y: pos.y, z: pos.z });

    setTimeout(() => {
      const session = gl.xr.getSession();
      if (session) session.end();
    }, 1500);
  };

  return (
    <>
      <ambientLight intensity={2} />
      <mesh onPointerDown={handleScreenTap}>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
      </mesh>
      {stagedPin && <HologramPin position={stagedPin} />}
    </>
  );
}

// 3. The React UI
export default function ARReporter({ onLocationSaved }) {
  const [stagedPin, setStagedPin] = useState(null);
  const [gpsData, setGpsData] = useState(null); // INDEPENDENT LIVE GPS STATE
  const [confirmed, setConfirmed] = useState(false);

  const startAR = () => {
    setStagedPin(null);
    setConfirmed(false);
    setGpsData(null);

    // Fetch GPS in the background. It will update `gpsData` whenever it finishes!
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (geoPos) => {
          setGpsData({ lat: geoPos.coords.latitude, lng: geoPos.coords.longitude });
        },
        (err) => console.warn("GPS Failed:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    store.enterAR();
  };

  const handleConfirm = () => {
    // Merge the 3D pin and the live GPS data right before saving
    onLocationSaved({
      ...stagedPin,
      lat: gpsData?.lat || null,
      lng: gpsData?.lng || null
    });
    setConfirmed(true);
  };

  return (
    <div style={{ width: "100%", marginBottom: "20px", padding: "15px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "white" }}>
      
      {!stagedPin && (
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 10px 0", color: "#aaa", fontSize: "14px" }}>
            Capture spatial coordinates and exact GPS location using AR.
          </p>
          <button 
            type="button" 
            onClick={startAR} 
            style={{ padding: "14px", background: "#00e5ff", color: "black", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", width: "100%" }}
          >
            📸 Open AR Camera
          </button>
        </div>
      )}

      {stagedPin && !confirmed && (
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#00e5ff", fontWeight: "bold" }}>
            📍 AR Spatial: [{stagedPin.x.toFixed(2)}, {stagedPin.z.toFixed(2)}]
          </p>
          
          {/* Reactive GPS Check: Will update the second your phone gets a signal */}
          {gpsData ? (
            <p style={{ margin: "0 0 15px 0", color: "#4CAF50", fontWeight: "bold", fontSize: "14px" }}>
              🌍 GPS Location: {gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}
            </p>
          ) : (
            <p style={{ margin: "0 0 15px 0", color: "#f44336", fontSize: "14px", fontStyle: "italic" }}>
              ⏳ Fetching GPS signal... (Please wait)
            </p>
          )}
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={startAR} style={{ flex: 1, padding: "14px", background: "#333", color: "white", border: "1px solid #f44336", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              ↻ Retake
            </button>
            <button type="button" onClick={handleConfirm} style={{ flex: 1, padding: "14px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(76, 175, 80, 0.3)" }}>
              ✓ Confirm & Attach
            </button>
          </div>
        </div>
      )}

      {confirmed && (
        <div style={{ textAlign: "center", color: "#4CAF50", fontWeight: "bold", padding: "10px 0", background: "rgba(76, 175, 80, 0.1)", borderRadius: "8px" }}>
          ✅ High-Precision Location Data Attached!
        </div>
      )}

      <div style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        <Canvas>
          <XR store={store}>
            <ARSceneManager stagedPin={stagedPin} setStagedPin={setStagedPin} />
          </XR>
        </Canvas>
      </div>
    </div>
  );
}