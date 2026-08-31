import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, XRDomOverlay, createXRStore } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function HologramPin({ position }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02;
      groupRef.current.position.y = position.y + Math.sin(state.clock.getElapsedTime() * 3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <mesh>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ARSceneManager({ stagedPin, setStagedPin, setInAR }) {
  const { gl } = useThree();

  useEffect(() => {
    const handleEnd = () => {
      setInAR(false);
      setStagedPin(null);
    };
    gl.xr.addEventListener("sessionend", handleEnd);
    return () => gl.xr.removeEventListener("sessionend", handleEnd);
  }, [gl, setInAR, setStagedPin]);

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

export default function ARReporter({ onLocationSaved }) {
  const [stagedPin, setStagedPin] = useState(null);
  const [inAR, setInAR] = useState(false);
  const [geo, setGeo] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  const [store] = useState(() => createXRStore());

  useEffect(() => {
    if (!stagedPin) {
      setGeo(null);
      setGeoStatus("idle");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus("ready");
      },
      () => setGeoStatus("unavailable"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [stagedPin]);

  const startAR = async () => {
    const supported = navigator.xr ? await navigator.xr.isSessionSupported("immersive-ar") : false;
    
    if (!supported) {
      setIsDesktopMode(true);
      setStagedPin({ x: 0, y: 0, z: -2 });
      return;
    }

    setStagedPin(null);
    setInAR(true);
    store.enterAR();
  };

  const handleConfirm = () => {
    onLocationSaved({ 
      x: stagedPin?.x || 0, 
      y: stagedPin?.y || 0, 
      z: stagedPin?.z || 0, 
      ...geo 
    });
    setInAR(false);
    setIsDesktopMode(false);
    setStagedPin(null);
    if (store.getState().session) {
      store.getState().session.end();
    }
  };

  return (
    <div style={{ width: "100%", height: "400px", position: "relative", borderRadius: "10px", overflow: "hidden", border: "2px solid #333", background: "#111" }}>

      {!inAR && !isDesktopMode && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "white" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>AR Spatial Issue Scanner</h3>
          <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "20px" }}>
            Anchor a high-precision 3D civic ticket via mobile AR or desktop simulation.
          </p>
          <button
            type="button"
            onClick={startAR}
            style={{ padding: "14px 28px", background: "#00e5ff", color: "black", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", boxShadow: "0 0 15px rgba(0,229,255,0.4)" }}
          >
            📸 Launch AR Spatial Scanner
          </button>
        </div>
      )}

      {/* DESKTOP SIMULATION FALLBACK CANVAS */}
      {isDesktopMode && (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "rgba(0,0,0,0.8)", color: "#00e5ff", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", border: "1px solid #00e5ff" }}>
            🖥️ Desktop AR Simulator Active (Orbit & Inspect)
          </div>
          <Canvas camera={{ position: [0, 1, 3] }}>
            <ambientLight intensity={2} />
            <OrbitControls />
            <gridHelper args={[10, 10, "#00e5ff", "#333"]} />
            {stagedPin && <HologramPin position={stagedPin} />}
          </Canvas>
          <div style={{ position: "absolute", bottom: 15, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => setIsDesktopMode(false)} style={{ padding: "10px 20px", background: "#111", color: "#f44336", border: "1px solid #f44336", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} style={{ padding: "10px 20px", background: "#00e5ff", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              ✓ Confirm Simulated Spatial Pin
            </button>
          </div>
        </div>
      )}

      {!isDesktopMode && (
        <Canvas>
          <XR store={store}>
            <ARSceneManager stagedPin={stagedPin} setStagedPin={setStagedPin} setInAR={setInAR} />

            <XRDomOverlay>
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "20px", boxSizing: "border-box", pointerEvents: "none"
              }}>

                <div style={{
                  background: "rgba(10, 10, 10, 0.85)", color: "#00e5ff", padding: "12px 20px",
                  borderRadius: "10px", border: "1px solid #00e5ff", textAlign: "center",
                  fontWeight: "bold", fontSize: "15px", pointerEvents: "auto", backdropFilter: "blur(5px)",
                  marginTop: "20px"
                }}>
                  {!stagedPin
                    ? "🎯 Tap anywhere on the screen to anchor the ticket"
                    : geoStatus === "locating"
                    ? "📍 Ticket anchored — locking GPS…"
                    : "📍 Ticket anchored — GPS locked"}
                </div>

                {/* --- THE FIX: SHOW LOADER WHILE LOCATING --- */}
                {stagedPin && geoStatus === "locating" && (
                  <div style={{ display: "flex", justifyContent: "center", pointerEvents: "auto", marginBottom: "30px" }}>
                    <div style={{
                      padding: "16px 24px",
                      background: "rgba(10, 10, 10, 0.85)",
                      color: "#00e5ff",
                      borderRadius: "10px",
                      border: "1px solid #00e5ff",
                      fontWeight: "bold",
                      fontSize: "16px",
                      backdropFilter: "blur(5px)"
                    }}>
                      ⏳ Locking GPS Coordinates...
                    </div>
                  </div>
                )}

                {/* --- THE FIX: SHOW BUTTONS ONLY WHEN NOT LOCATING --- */}
                {stagedPin && geoStatus !== "locating" && (
                  <div style={{ display: "flex", gap: "15px", pointerEvents: "auto", marginBottom: "30px", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => setStagedPin(null)}
                      style={{ padding: "16px 24px", background: "#111", color: "#f44336", border: "2px solid #f44336", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      ↻ Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      style={{ padding: "16px 24px", background: "#00e5ff", color: "#000", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 15px rgba(0, 229, 255, 0.5)" }}
                    >
                      ✓ Confirm & Save
                    </button>
                  </div>
                )}

              </div>
            </XRDomOverlay>
          </XR>
        </Canvas>
      )}
    </div>
  );
}