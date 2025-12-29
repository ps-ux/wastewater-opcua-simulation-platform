'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    ContactShadows,
    Text,
    Html,
    Float
} from '@react-three/drei';
import * as THREE from 'three';
import { PumpData } from '@/lib/types';

interface IPS3DViewerProps {
    pumps: PumpData[];
}

/**
 * Single Station Pump Instance
 */
function StationPump({
    position,
    pump,
    label
}: {
    position: [number, number, number];
    pump?: PumpData;
    label: string
}) {
    const isRunning = pump?.is_running || false;
    const rpm = pump?.rpm || 0;

    // Simple rotation for visual feedback
    const impellerRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (impellerRef.current && isRunning) {
            impellerRef.current.rotation.y += (rpm * 0.002) * delta;
        }
    });

    return (
        <group position={position}>
            {/* Motor */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1.2, 32]} />
                <meshStandardMaterial color={isRunning ? "#1d4ed8" : "#334155"} metalness={0.6} />
            </mesh>

            {/* Shaft/Coupling */}
            <group ref={impellerRef}>
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            </group>

            {/* Pump Housing (Volute) */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>

            {/* Suction Pipe (Down into wet well) */}
            <mesh position={[0, -1.5, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 3, 32]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>

            {/* Label */}
            <Html position={[0, 2.5, 0]} center>
                <div className={`px-2 py-1 rounded-md border backdrop-blur-md text-[10px] whitespace-nowrap font-bold ${isRunning
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}>
                    {label}
                </div>
            </Html>
        </group>
    );
}

/**
 * Water Volume for Wet Well
 */
function WetWellVolume({
    position,
    width,
    depth,
    level, // 0-100% or similar scale
    color = "#0ea5e9"
}: {
    position: [number, number, number];
    width: number;
    depth: number;
    level: number;
    color?: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    // Assuming level is roughly in feet/meters. Let's map it to our scene scale.
    // Base of well at y=-5, Top at y=0. Max level ~10ft? 
    // Let's say level 0 = y=-4.5, level 10 = y=-0.5

    const targetY = -4.5 + (Math.min(Math.max(level, 0), 15) / 15) * 4;

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 2);
        }
    });

    return (
        <mesh ref={meshRef} position={[position[0], -4, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, depth]} />
            <meshPhysicalMaterial
                color={color}
                transparent
                opacity={0.6}
                transmission={0.4}
                roughness={0.1}
                metalness={0.1}
            />
        </mesh>
    );
}

/**
 * Main Station Scene
 */
function StationScene({ pumps }: { pumps: PumpData[] }) {
    // Group pumps by location
    // Pumps 1-4: North Wet Well
    // Pumps 5-7: South Wet Well
    // IDs are usually strings. Let's assume they contain "1", "2" etc or we map by index if sorted.
    // For safety, let's try to map by ID parsing or just index if they come in order.

    const sortedPumps = useMemo(() => {
        return [...pumps].sort((a, b) => a.id.localeCompare(b.id));
    }, [pumps]);

    // North Wet Well Pumps (Indices 0-3 / IDs ending 1-4)
    const northPumps = sortedPumps.filter(p => ['1', '2', '3', '4'].some(id => p.id.includes(id)) || parseInt(p.id.replace(/\D/g, '')) <= 4).slice(0, 4);

    // South Wet Well Pumps (Indices 4-6 / IDs ending 5-7)
    const southPumps = sortedPumps.filter(p => ['5', '6', '7'].some(id => p.id.includes(id)) || parseInt(p.id.replace(/\D/g, '')) >= 5).slice(0, 3);

    // Calculate Average Levels (mocking if not available)
    const northLevel = northPumps.reduce((acc, p) => acc + (p.wet_well_level || 0), 0) / (northPumps.length || 1) || 5;
    const southLevel = southPumps.reduce((acc, p) => acc + (p.wet_well_level || 0), 0) / (southPumps.length || 1) || 5;

    return (
        <group>
            {/* FLOOR / GROUND */}
            <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <gridHelper args={[40, 40, 0x1e293b, 0x0f172a]} position={[0, -4.99, 0]} />

            {/* --- NORTH WET WELL SECTION (Left) --- */}
            <group position={[-6, 0, 0]}>
                {/* Well Walls */}
                <mesh position={[0, -2.5, 0]}>
                    <boxGeometry args={[10, 5, 8]} />
                    <meshStandardMaterial color="#334155" wireframe />
                </mesh>
                {/* Floor Label */}
                <Text position={[0, 0.1, 5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} color="white">
                    NORTH WET WELL
                </Text>

                {/* Water */}
                <WetWellVolume position={[0, 0, 0]} width={9} depth={7} level={northLevel} />

                {/* Pumps 1-4 */}
                <group position={[0, 0, 1]}>
                    {/* Arrange in a line or grid inside the well area */}
                    {/* Let's do a 2x2 or line. Narrative says "4 pumps drawing from North". */}

                    <StationPump position={[-3, 0, 0]} pump={northPumps[0]} label="PUMP 1" />
                    <StationPump position={[-1, 0, 0]} pump={northPumps[1]} label="PUMP 2" />
                    <StationPump position={[1, 0, 0]} pump={northPumps[2]} label="PUMP 3" />
                    <StationPump position={[3, 0, 0]} pump={northPumps[3]} label="PUMP 4" />
                </group>
            </group>

            {/* --- SOUTH WET WELL SECTION (Right) --- */}
            <group position={[6, 0, 0]}>
                {/* Well Walls */}
                <mesh position={[0, -2.5, 0]}>
                    <boxGeometry args={[8, 5, 8]} />
                    <meshStandardMaterial color="#334155" wireframe />
                </mesh>
                {/* Floor Label */}
                <Text position={[0, 0.1, 5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} color="white">
                    SOUTH WET WELL
                </Text>

                {/* Water */}
                <WetWellVolume position={[0, 0, 0]} width={7} depth={7} level={southLevel} />

                {/* Pumps 5-7 */}
                <group position={[0, 0, 1]}>
                    <StationPump position={[-2, 0, 0]} pump={southPumps[0]} label="PUMP 5" />
                    <StationPump position={[0, 0, 0]} pump={southPumps[1]} label="PUMP 6" />
                    <StationPump position={[2, 0, 0]} pump={southPumps[2]} label="PUMP 7" />
                </group>
            </group>

            {/* --- INFLUENT / EFFLUENT PIPING --- */}

            {/* 72" Incoming Header (Background) */}
            <mesh position={[0, -3, -6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.9, 0.9, 20, 32]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <Text position={[0, -1.5, -6]} fontSize={0.4} color="#94a3b8">
                72" INFLUENT INTERCEPTOR
            </Text>

            {/* Discharge Headers (Foreground/Top) */}
            {/* North Output */}
            <mesh position={[-6, 2, -2]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 12, 32]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            {/* South Output */}
            <mesh position={[6, 2, -2]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 12, 32]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>

        </group>
    );
}

export function IPS3DViewer({ pumps }: IPS3DViewerProps) {
    // Pre-calculate aggregate stats for HUD
    const totalFlow = pumps.reduce((acc, p) => acc + p.flow_rate, 0);
    const runningCount = pumps.filter(p => p.is_running).length;
    const activePower = pumps.reduce((acc, p) => acc + p.power_consumption, 0);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />

            <Canvas shadows gl={{ antialias: true }} camera={{ position: [0, 10, 20], fov: 45 }}>
                <PerspectiveCamera makeDefault position={[0, 12, 18]} fov={50} />
                <OrbitControls
                    maxPolarAngle={Math.PI / 2}
                    minDistance={10}
                    maxDistance={40}
                    target={[0, 0, 0]}
                    autoRotate={false}
                />

                <ambientLight intensity={0.4} />
                <spotLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <pointLight position={[-10, 5, -5]} intensity={0.5} color="#0ea5e9" />
                <pointLight position={[10, 5, -5]} intensity={0.5} color="#0ea5e9" />

                <React.Suspense fallback={null}>
                    <StationScene pumps={pumps} />
                    <Environment preset="night" />
                    <ContactShadows opacity={0.4} scale={40} blur={2} far={10} color="#000000" />
                </React.Suspense>
            </Canvas>

            {/* HUD / OVERLAY */}
            <div className="absolute top-6 left-6 z-10 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl w-80">
                <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    IPS DIGITAL TWIN
                </h1>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-6">Influent Pump Station Overview</p>

                <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-slate-500 text-sm">Total Flow</span>
                        <div className="text-right">
                            <span className="text-2xl font-mono text-cyan-400 font-bold">{totalFlow.toFixed(1)}</span>
                            <span className="text-xs text-slate-500 ml-1">MGD</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-slate-500 text-sm">Active Pumps</span>
                        <div className="text-right">
                            <span className="text-2xl font-mono text-white font-bold">{runningCount}</span>
                            <span className="text-xs text-slate-500 ml-1">/ {pumps.length}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 text-sm">Total Power</span>
                        <div className="text-right">
                            <span className="text-xl font-mono text-yellow-400 font-bold">{activePower.toFixed(1)}</span>
                            <span className="text-xs text-slate-500 ml-1">kW</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="flex gap-2">
                        <div className="flex-1 py-2 px-3 bg-slate-800 rounded text-center">
                            <div className="text-[10px] text-slate-500 uppercase">North Level</div>
                            <div className="text-lg font-mono text-white">4.8 <span className="text-[10px] text-slate-600">ft</span></div>
                        </div>
                        <div className="flex-1 py-2 px-3 bg-slate-800 rounded text-center">
                            <div className="text-[10px] text-slate-500 uppercase">South Level</div>
                            <div className="text-lg font-mono text-white">5.2 <span className="text-[10px] text-slate-600">ft</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend / Status */}
            <div className="absolute bottom-6 right-6 z-10 flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-full border border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-300">Run Mode</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-full border border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-xs text-slate-300">Standby</span>
                </div>
            </div>
        </div>
    );
}
