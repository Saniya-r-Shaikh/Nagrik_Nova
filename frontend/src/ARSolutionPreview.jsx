import React, { useState, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { XR, XRDomOverlay, createXRStore } from "@react-three/xr";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const store = createXRStore();

// 1. The 3D Model Loader
function ProposedSolution({ modelPath, position }) {
  const { scene } = useGLTF(modelPath); 
  
  return (
    <primitive 
      object={scene.clone()} 
      position={[position.x, position.y, position.z]} 
      scale={[0.05, 0.05, 0.05]} // Keeps it perfectly scaled down
    />
  );
}

// 2. The Placement Engine
function ARPreviewManager({ modelPath, stagedModel, setStagedModel, setInAR }) {
  const { gl } = useThree();
  const [canPlace, setCanPlace] = useState(false);

  useEffect(() => {
    // Prevents accidental instant-spawning when you click the 'Enter AR' button
    const timer = setTimeout(() => setCanPlace(true), 1000);
    
    const handleEnd = () => {
      setInAR(false);
      setStagedModel(null);
    };
    
    gl.xr.addEventListener("sessionend", handleEnd);
    return () => {
      clearTimeout(timer);
      gl.xr.removeEventListener("sessionend", handleEnd);
    };
  }, [gl, setInAR, setStagedModel]);

  const handleScreenTap = (e) => {
    e.stopPropagation();
    if (stagedModel || !canPlace) return;

    const xrCamera = gl.xr.getCamera();
    const pos = new THREE.Vector3();
    xrCamera.getWorldPosition(pos);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion);

    // Drops the model exactly 2 meters in front of your camera
    pos.add(dir.multiplyScalar(2.0));
    pos.y -= 0.5; 

    setStagedModel({ x: pos.x, y: pos.y, z: pos.z });
  };

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} />
      
      <mesh onPointerDown={handleScreenTap}>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
      </mesh>
      
      {stagedModel && <ProposedSolution modelPath={modelPath} position={stagedModel} />}
    </>
  );
}

// 3. The React UI
export default function ARSolutionPreview({ modelPath = "/solution.glb" }) {
  const [stagedModel, setStagedModel] = useState(null);
  const [inAR, setInAR] = useState(false);
  const [store] = useState(() => createXRStore());

  const startAR = () => {
    setStagedModel(null);
    setInAR(true);
    store.enterAR();
  };

  return (
    <div style={{ width: "100%", marginTop: "20px", borderRadius: "10px", overflow: "hidden", border: "2px solid #4CAF50", background: "#111", position: "relative" }}>
      
      {!inAR && (
        <div style={{ padding: "20px", textAlign: "center", color: "white", position: "relative", zIndex: 10 }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>3D Solution Preview</h3>
          <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "15px" }}>
            An engineering solution has been proposed. View the blueprint in true scale on your street.
          </p>
          <button
            type="button"
            onClick={startAR}
            style={{ padding: "12px 24px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", width: "100%" }}
          >
            🏗️ View Proposal in AR
          </button>
        </div>
      )}

      <div style={{ 
        position: inAR ? "fixed" : "absolute", 
        top: 0, 
        left: 0, 
        width: inAR ? "100vw" : "0px", 
        height: inAR ? "100vh" : "0px", 
        zIndex: inAR ? 9999 : -1,
        opacity: inAR ? 1 : 0,
        visibility: inAR ? "visible" : "hidden",
        pointerEvents: inAR ? "auto" : "none"
      }}>
        <Canvas gl={{ alpha: true }}>
          <XR store={store}>
            {/* THE FIX: Suspense ensures the camera feed runs smoothly while the model loads! */}
            <Suspense fallback={null}>
              {inAR && (
                <ARPreviewManager modelPath={modelPath} stagedModel={stagedModel} setStagedModel={setStagedModel} setInAR={setInAR} />
              )}
            </Suspense>

            <XRDomOverlay>
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "20px", boxSizing: "border-box", pointerEvents: "none"
              }}>
                
                <div style={{
                  background: "rgba(10, 10, 10, 0.85)", color: "#4CAF50", padding: "12px 20px",
                  borderRadius: "10px", border: "1px solid #4CAF50", textAlign: "center",
                  fontWeight: "bold", fontSize: "15px", pointerEvents: "auto", backdropFilter: "blur(5px)",
                  marginTop: "20px"
                }}>
                  {!stagedModel ? "🎯 Tap screen to anchor 3D Solution" : "✅ 3D Solution Anchored! Walk around to evaluate."}
                </div>

                {stagedModel && (
                  <div style={{ display: "flex", justifyContent: "center", pointerEvents: "auto", marginBottom: "30px" }}>
                    <button
                      type="button"
                      onClick={() => store.getState().session?.end()}
                      style={{ padding: "16px 30px", background: "#f44336", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      ✖ Close Preview
                    </button>
                  </div>
                )}

              </div>
            </XRDomOverlay>
          </XR>
        </Canvas>
      </div>
    </div>
  );
}