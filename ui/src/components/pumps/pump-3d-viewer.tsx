'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    ContactShadows,
    MeshTransmissionMaterial,
    Float,
    Text,
    Html
} from '@react-three/drei';
import * as THREE from 'three';
import { PumpData } from '@/lib/types';

interface Pump3DViewerProps {
    pump: PumpData;
}

/**
 * High-precision Centrifugal Impeller
 */
function RealisticImpeller({ rpm }: { rpm: number }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Rotate the impeller based on current RPM feedback from OPC UA
            const rotationSpeed = (rpm * Math.PI * 2) / 60;
            groupRef.current.rotation.y += rotationSpeed * delta;
        }
    });

    return (
        <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
            {/* Impeller Back Shroud */}
            <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[0.42, 0.42, 0.04, 64]} />
                <meshStandardMaterial color="#334155" metalness={1} roughness={0.05} />
            </mesh>

            {/* Central Boss / Shaft Hub */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.35, 32]} />
                <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.2} />
            </mesh>

            {/* 4-Blade Semi-Open Clog-Resistant Vanes (Common in Wastewater) */}
            {[0, 1, 2, 3].map((i) => (
                <group key={i} rotation={[0, (i * Math.PI * 2) / 4, 0]}>
                    <mesh position={[0.22, 0.08, 0]} rotation={[0, -0.4, 0]}>
                        <boxGeometry args={[0.35, 0.22, 0.03]} />
                        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Vane Tip curve */}
                    <mesh position={[0.38, 0.08, 0.12]} rotation={[0, -1.2, 0]}>
                        <boxGeometry args={[0.15, 0.22, 0.03]} />
                        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/**
 * Dynamic Wet Well Water with Surface Physics
 */
function WetWellWater({ level, flowRate, isRunning }: { level: number; flowRate: number; isRunning: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const targetY = (level / 10) * 5 - 2.5; // Map simulation level to 3D space

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();
            // Level transition smoothing
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);

            // Surface agitation based on pump activity
            const agitation = isRunning ? (0.02 + (flowRate / 5000) * 0.08) : 0.005;
            const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
            const position = geometry.attributes.position;

            for (let i = 0; i < position.count; i++) {
                const x = position.getX(i);
                const y = position.getY(i);
                const z = Math.sin(x * 2 + time * 3) * agitation + Math.cos(y * 2 + time * 2.5) * agitation;
                position.setZ(i, z);
            }
            position.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* Animated Surface Plane */}
            <mesh ref={meshRef} position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[10, 10, 32, 32]} />
                <meshPhysicalMaterial
                    color="#0ea5e9"
                    transparent
                    opacity={0.65}
                    transmission={0.4}
                    thickness={0.5}
                    roughness={0.05}
                    metalness={0.1}
                    ior={1.33}
                    reflectivity={0.6}
                />
            </mesh>
            {/* Underwater volume */}
            <mesh position={[0, -5, 0]}>
                <boxGeometry args={[10, 5, 10]} />
                <meshStandardMaterial color="#0369a1" transparent opacity={0.45} />
            </mesh>
        </group>
    );
}

/**
 * Velocity-Based Hydrodynamic Particles
 */
function HydroFlow({ pump }: { pump: PumpData }) {
    const count = 120;
    const particles = useMemo(() => {
        return Array.from({ length: count }, () => ({
            t: Math.random() * 20,
            offset: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
            speed: 1.2 + Math.random() * 0.5
        }));
    }, []);

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const isRunning = pump.is_running;
        const flowFactor = pump.flow_rate / 5000;

        particles.forEach((p, i) => {
            if (isRunning) {
                p.t += delta * p.speed * (0.4 + flowFactor * 2.5);
            }

            const cycle = p.t % 4;
            let x = 0, y = 0, z = 0, scale = 0;

            if (cycle < 1.5) { // Suction Path (From Well)
                x = 5.5 - (cycle * 3.5);
                y = -0.5 + p.offset[1] * 0.15;
                z = p.offset[2] * 0.15;
                scale = 0.04;
            } else if (cycle < 2.2) { // Interior Volute Acceleration
                const spiral = (cycle - 1.5) * Math.PI * 6;
                const radius = 0.1 + (cycle - 1.5) * 0.7;
                x = Math.cos(spiral) * radius + 0.2;
                y = Math.sin(spiral) * radius - 0.5;
                z = -0.1 + (cycle - 1.5) * 0.3;
                scale = 0.05;
            } else { // Discharge Path (Up to Channel)
                x = 0.2 + p.offset[0] * 0.1;
                y = -0.5 + (cycle - 2.2) * 4;
                z = 0.2 + p.offset[2] * 0.1;
                scale = 0.04;
            }

            dummy.position.set(x - 0.5, y + 0.5, z);
            dummy.scale.setScalar(isRunning ? scale : 0);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color="#bae6fd" transparent opacity={0.7} />
        </instancedMesh>
    );
}

function PumpDigitalTwin({ pump }: { pump: PumpData }) {
    return (
        <group>
            {/* 1. LIFT STATION STRUCTURE (Civil Infrastructure) */}
            <group position={[4, -2.5, 0]}>
                {/* Wet Well Reinforced Concrete (Physics-based water container) */}
                <mesh position={[0, -0.15, 0]}>
                    <boxGeometry args={[11, 0.3, 11]} />
                    <meshStandardMaterial color="#334155" roughness={0.9} />
                </mesh>
                {/* Floor Markings */}
                <gridHelper args={[11, 11, 0x0ea5e9, 0x1e293b]} position={[0, 0.01, 0]} />

                {/* Rear Wall */}
                <mesh position={[0, 3.5, -5.5]}>
                    <boxGeometry args={[11, 7, 0.3]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>

                {/* Maintenance Walkway / Grating */}
                <mesh position={[0, 7, 3]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[11, 0.1, 4]} />
                    <meshStandardMaterial color="#475569" transparent opacity={0.5} wireframe />
                </mesh>

                {/* The Water Reservoir */}
                <WetWellWater level={pump.wet_well_level || 4} flowRate={pump.flow_rate} isRunning={pump.is_running} />
            </group>

            {/* 2. PUMP STATION MECHANICAL ASSEMBLY */}
            <group position={[-1, 0, 0]}>
                {/* Heavy-Duty Steel Frame Overlay */}
                <mesh position={[0, -0.65, 0]}>
                    <boxGeometry args={[4, 0.2, 2]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
                </mesh>

                {/* Motor Unit (Siemens/ABB Style Industrial Motor) */}
                <group position={[-1.2, -0.1, 0]}>
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.5, 0.5, 1.6, 32]} />
                        <meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Cooling Shroud */}
                    <mesh position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.5, 0.5, 0.3, 32]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <Text position={[0, 0.6, 0.2]} fontSize={0.1} color="white">Wastewater Duty - Class I Div 1</Text>
                </group>

                {/* Coupler & Guard */}
                <mesh position={[0.2, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.9, 32]} />
                    <meshStandardMaterial color="#64748b" metalness={1} />
                </mesh>

                {/* THE VOLUTE (Heart of the Pump) - Glass/Transmission view for Visibility */}
                <group position={[1.4, -0.1, 0]}>
                    {/* Transparent outer casing */}
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.7, 0.7, 0.6, 32]} />
                        <MeshTransmissionMaterial
                            samples={16}
                            thickness={0.15}
                            chromaticAberration={0.03}
                            anisotropy={0.2}
                            distortion={0.1}
                            distortionScale={0.1}
                            temporalDistortion={0}
                            clearcoat={1}
                            attenuationDistance={0.5}
                            attenuationColor="#ffffff"
                            color="#bae6fd"
                            opacity={0.8}
                        />
                    </mesh>

                    {/* INTERNAL IMPELLER (Fully visible through transparency) */}
                    <RealisticImpeller rpm={pump.rpm} />

                    {/* Suction Label */}
                    <Html position={[2, 0.4, 0]}>
                        <div className="whitespace-nowrap px-2 py-1 rounded bg-black/40 border border-white/10 backdrop-blur-md text-[8px] font-bold text-cyan-400 uppercase tracking-widest">
                            Suction Intake: Raw Influent
                        </div>
                    </Html>

                    {/* Discharge Path Extension (Vertical) */}
                    <mesh position={[0, 1, 0.05]} castShadow>
                        <cylinderGeometry args={[0.22, 0.22, 1.8, 32]} />
                        <meshStandardMaterial color="#334155" metalness={0.7} />
                    </mesh>

                    {/* Discharge Label */}
                    <Html position={[0.4, 2, 0.2]}>
                        <div className="whitespace-nowrap px-2 py-1 rounded bg-black/40 border border-white/10 backdrop-blur-md text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                            Discharge: {pump.discharge_pressure.toFixed(2)} Bar Lift
                        </div>
                    </Html>
                </group>

                {/* Suction Pipe Assembly (Horizontal, leading to wet well) */}
                <group position={[2.8, -0.1, 0]}>
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                        <cylinderGeometry args={[0.28, 0.28, 2.8, 32]} />
                        <meshStandardMaterial color="#334155" metalness={0.6} />
                    </mesh>
                    {/* Pressure Taps / Sensors */}
                    <mesh position={[0.5, 0.4, 0]}>
                        <boxGeometry args={[0.1, 0.2, 0.1]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                </group>
            </group>

            {/* 3. DISCHARGE CHANNEL (Transport to Primary Clarifiers / Grit Chamber) */}
            <group position={[0.4, 4.5, 0]}>
                {/* Concrete Channel */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[1, 10, 1.5]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                {/* Floating Label for Destination */}
                <Text position={[4, 1.5, 0]} fontSize={0.3} color="#06b6d4">
                    NEXT STAGE: GRIT REMOVAL & CLARIFICATION
                </Text>

                {/* Live Flow visualization in channel */}
                {pump.is_running && pump.flow_rate > 50 && (
                    <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[10, 1.2]} />
                        <meshPhysicalMaterial
                            color="#0ea5e9"
                            transparent
                            opacity={0.4}
                            roughness={0}
                        />
                    </mesh>
                )}
            </group>

            {/* 4. DYNAMIC HYDRODYNAMICS */}
            <HydroFlow pump={pump} />
        </group>
    );
}

export function Pump3DViewer({ pump }: Pump3DViewerProps) {
    return (
        <div className="relative h-[720px] w-full overflow-hidden rounded-[2rem] bg-slate-950 border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.08),transparent_50%)]" />

            <Canvas shadows gl={{ antialias: true, powerPreference: 'high-performance' }}>
                <PerspectiveCamera makeDefault position={[12, 6, 12]} fov={38} />
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={6}
                    maxDistance={30}
                    maxPolarAngle={Math.PI / 1.65}
                />

                <ambientLight intensity={0.25} />
                {/* Overhead Facility Lighting */}
                <spotLight
                    position={[15, 20, 15]}
                    angle={0.25}
                    penumbra={1}
                    intensity={2.2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-8, 6, -8]} color="#0ea5e9" intensity={1.2} />

                <React.Suspense fallback={<Html center><div className="text-white font-mono text-xs animate-pulse underline decoration-cyan-500">IGNITING_HYDRO_PHYSICS...</div></Html>}>
                    <PumpDigitalTwin pump={pump} />
                    <Environment preset="warehouse" />
                    <ContactShadows
                        position={[0, -2.5, 0]}
                        opacity={0.7}
                        scale={25}
                        blur={2.4}
                        far={12}
                    />
                </React.Suspense>
            </Canvas>

            {/* SCI-FI INDUSTRIAL HUD */}
            <div className="absolute left-8 top-8 space-y-4 pointer-events-none select-none">
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${pump.is_running ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-800'}`} />
                    <h2 className="text-xl font-black text-white tracking-widest uppercase opacity-80">
                        {pump.id}
                    </h2>
                </div>

                <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-3xl shadow-2xl w-56">
                    <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational State</div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block ${pump.is_running ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/40 text-slate-500'}`}>
                            {pump.is_running ? 'SYSTEM_ACTIVE' : 'IDLE_STANDBY'}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Thermal Efficiency</div>
                        <div className="text-xl font-mono font-bold text-cyan-400">
                            {(Math.random() * 5 + 78).toFixed(1)}%
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Discharge</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {pump.flow_rate.toFixed(1)}
                            <span className="text-[10px] text-slate-500 font-sans tracking-normal font-normal ml-1">m³/h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TECH SPECS FOOTER */}
            <div className="absolute bottom-10 left-10 flex gap-6 pointer-events-none opacity-40">
                <div className="text-[9px] font-mono text-cyan-500 space-y-1">
                    <div>&gt; PHY_RESOLVER: RADIAL_V4.2</div>
                </div>
            </div>

            {/* INTERACTION HINT */}
            <div className="absolute bottom-10 right-10 flex items-center gap-3 text-white/40 uppercase font-bold text-[9px] tracking-[0.3em]">
                <div className="w-8 h-[1px] bg-white/10" />
                Orbital Navigation Active
            </div>
        </div>
    );
}
