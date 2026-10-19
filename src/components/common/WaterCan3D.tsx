/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sparkles, Droplets, Maximize2, Minimize2 } from 'lucide-react';

interface WaterCan3DProps {
  className?: string;
  itemName?: string;
  interactive?: boolean;
}

export const WaterCan3D: React.FC<WaterCan3DProps> = ({
  className = '',
  itemName = '20L Water Can',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isDispensing, setIsDispensing] = useState(false);
  const [waterLevel, setWaterLevel] = useState(0.85);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Match Slate-950

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio PBR Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85); // Sky blue to deep slate
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(2.5, 4, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 1.2, 8); // Cyan rim light
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    // 3. Composite 3D Hydration Hub Model (8 distinct parts)
    const hubGroup = new THREE.Group();
    hubGroup.position.set(0, -0.6, 0);

    // Part 1: Soft Contact Shadow Plane at floor
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    hubGroup.add(shadowMesh);

    // Part 2: Dispenser Stand Base (Matte dark ceramic/polypropylene)
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.1,
    });
    const standGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.5, 32);
    const standMesh = new THREE.Mesh(standGeo, standMat);
    standMesh.position.y = 0.26;
    standMesh.castShadow = true;
    standMesh.receiveShadow = true;
    hubGroup.add(standMesh);

    // Part 3: Dispenser Collar Ring (Metallic Cyan)
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const collarGeo = new THREE.TorusGeometry(0.56, 0.03, 16, 32);
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.51;
    hubGroup.add(collarMesh);

    // Part 4: Chrome Push-Tap Faucet
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.1,
      metalness: 0.95,
    });
    const tapStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16);
    const tapStem = new THREE.Mesh(tapStemGeo, chromeMat);
    tapStem.rotation.x = Math.PI / 2;
    tapStem.position.set(0, 0.3, 0.6);
    hubGroup.add(tapStem);

    const tapSpoutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16);
    const tapSpout = new THREE.Mesh(tapSpoutGeo, chromeMat);
    tapSpout.position.set(0, 0.22, 0.68);
    hubGroup.add(tapSpout);

    // Lever handle
    const leverMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    const leverGeo = new THREE.BoxGeometry(0.08, 0.04, 0.14);
    const leverMesh = new THREE.Mesh(leverGeo, leverMat);
    leverMesh.position.set(0, 0.34, 0.64);
    hubGroup.add(leverMesh);

    // Part 5: Inverted 20L Water Can (Polycarbonate transparent blue)
    const canPlasticMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.75, // Glass / clear PET plastic
      thickness: 0.6,
      transparent: true,
      opacity: 0.88,
    });

    const bottleBodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.95, 32);
    const bottleBody = new THREE.Mesh(bottleBodyGeo, canPlasticMat);
    bottleBody.position.y = 1.1;
    bottleBody.castShadow = true;
    hubGroup.add(bottleBody);

    // Reinforcing Rib Rings on the 20L Can
    const ribGeo = new THREE.TorusGeometry(0.505, 0.015, 12, 32);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, transparent: true, opacity: 0.7 });
    for (const yOffset of [0.85, 1.05, 1.25]) {
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = yOffset;
      hubGroup.add(rib);
    }

    // Part 6: Bottle Neck & Taper
    const taperGeo = new THREE.ConeGeometry(0.5, 0.28, 32);
    const taperMesh = new THREE.Mesh(taperGeo, canPlasticMat);
    taperMesh.position.y = 0.58;
    hubGroup.add(taperMesh);

    // Part 7: Bottle Top / Bottom Rim
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
    const topCapGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.06, 32);
    const topCap = new THREE.Mesh(topCapGeo, capMat);
    topCap.position.y = 1.6;
    hubGroup.add(topCap);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.18, 0.035, 16, 24, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.25 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.48, 1.1, 0);
    handle.rotation.z = -Math.PI / 2;
    hubGroup.add(handle);

    // Part 8: Inner Water Volume
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.85,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const waterGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.8, 24);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 1.05;
    hubGroup.add(waterMesh);

    scene.add(hubGroup);

    // 4. Pointer Drag & Orbit Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let rotationVelocity = 0.005;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - prevMouseX;
      hubGroup.rotation.y += delta * 0.01;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const delta = e.touches[0].clientX - prevMouseX;
      hubGroup.rotation.y += delta * 0.012;
      prevMouseX = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 5. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle auto-rotation when not user-dragging
      if (!isDragging) {
        hubGroup.rotation.y += rotationVelocity;
      }

      // Subtle water gentle wave bobbing
      waterMesh.position.y = 1.05 + Math.sin(elapsed * 2.5) * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-56 cursor-grab active:cursor-grabbing" />

      {/* Floating 3D HUD Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-[10px] text-cyan-300 font-semibold shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Interactive 3D {itemName}</span>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-[10px] text-slate-300 shadow-md">
        <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Drag to rotate 360°</span>
      </div>
    </div>
  );
};
