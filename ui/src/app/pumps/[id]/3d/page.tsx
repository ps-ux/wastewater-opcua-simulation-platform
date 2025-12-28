'use client';

import React, { useEffect, use, useState, useMemo } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { Pump3DViewer } from '@/components/pumps/pump-3d-viewer';
import { Button } from '@/components/ui/button';
import { pumpsApi } from '@/lib/api';
import {
    Play,
    Square,
    ArrowLeft,
    Zap,
    Activity,
    BarChart3,
    Gauge,
    Waves,
    TrendingUp,
    Settings,
    FileText,
    Droplets,
    Info
} from 'lucide-react';
import Link from 'next/link';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceDot,
    Legend,
    Area
} from 'recharts';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Pump3DPage({ params }: PageProps) {
    const { id } = use(params);
    const { pumpData, fetchPumps, startPump, stopPump, setSpeed, isLoading } = usePumpStore();
    const { isConnected } = usePumpWebSocket();
    const pump = pumpData[id];

    const [targetRpm, setTargetRpm] = useState(1120); // Default to near-BEP speed
    const [activeTab, setActiveTab] = useState<'vfd' | 'specs'>('vfd');
    const [designSpecs, setDesignSpecs] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        fetchPumps();
    }, [fetchPumps]);

    useEffect(() => {
        // Sync target RPM with actual RPM when pump data loads (if pump is running)
        if (pump && pump.rpm >= 600 && pump.rpm <= 1180) {
            setTargetRpm(Math.round(pump.rpm));
        }
    }, [pump?.is_running]);

    // Fetch design specs when switching to specs tab
    useEffect(() => {
        if (activeTab === 'specs' && !designSpecs && id) {
            pumpsApi.getById(id).then(res => {
                setDesignSpecs(res.data.design_specs || {});
            }).catch(console.error);
        }
    }, [activeTab, designSpecs, id]);

    // Physics Constants & Calculations
    const physics = useMemo(() => {
        if (!pump) return null;

        // Convert discharge pressure (bar) to Head (meters)
        const head_m = pump.discharge_pressure * 10.197;

        // Static Lift (m) = Discharge Elevation (12m) - Wet Well Level
        const static_lift = 12 - (pump.wet_well_level || 4.2);

        // Efficiency Calc
        const q_m3s = pump.flow_rate / 3600;
        const p_pa = pump.discharge_pressure * 100000;
        const power_w = pump.power_consumption * 1000;
        const η = power_w > 0 ? (q_m3s * p_pa / power_w) * 100 : 0;

        // Curve Constants (Based on 1200 RPM nominal)
        const BEP_FLOW = 2800;
        const MAX_HEAD = 45; // m
        const BEP_EFF = 84; // %

        // Affinity Law Factor (N2/N1)
        const rpmFactor = pump.rpm / 1200;
        const adjMaxHead = MAX_HEAD * Math.pow(Math.max(0.1, rpmFactor), 2);
        const adjBepFlow = BEP_FLOW * rpmFactor;

        // Generate Curve Points
        const points = Array.from({ length: 25 }, (_, i) => {
            const q = i * 200;
            // H = H0 - kQ^2
            const head = adjMaxHead - (adjMaxHead * 0.4 * Math.pow(q / (adjBepFlow || 1), 2));
            // Eff = bell curve
            const eff = BEP_EFF * (1 - Math.pow((q - adjBepFlow) / (adjBepFlow || 1), 2));
            // Power = Q * H / η
            const p = (q * Math.max(0, head) * 9.81 * 1000) / (3600 * Math.max(1, eff) * 0.01 * 1000);

            return {
                q,
                head: Math.max(0, head).toFixed(1),
                efficiency: Math.max(0, eff).toFixed(1),
                power: Math.max(0, p).toFixed(1),
                system: (static_lift + 0.000002 * Math.pow(q, 2)).toFixed(1)
            };
        });

        return { head_m, η, points, static_lift, BEP_FLOW: adjBepFlow, BEP_EFF };
    }, [pump]);

    if (!pump || !physics) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#020617] flex-col gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-t-2 border-cyan-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="text-cyan-500 animate-pulse" size={24} />
                    </div>
                </div>
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase animate-pulse">Establishing OPC UA Sync...</p>
            </div>
        );
    }

    const applyRpm = async () => {
        await setSpeed(id, targetRpm);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 p-8 pt-6 space-y-8 flex flex-col items-center">

            {/* 1. TOP NAV & GLOBAL CONTROLS */}
            <div className="w-full max-w-[1500px] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/pumps" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                            Digital Twin <span className="text-cyan-500">_</span> {pump.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                                {isConnected ? 'OPC UA Streaming' : 'Reconnecting...'}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono tracking-widest">SID: {pump.id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <div className="flex flex-col items-end px-4 border-r border-white/10">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Dynamic Head</span>
                        <span className="text-xl font-mono font-black text-cyan-400">{physics.head_m.toFixed(2)} <span className="text-xs font-sans opacity-50">m</span></span>
                    </div>
                    <Button
                        variant={pump.is_running ? 'destructive' : 'default'}
                        onClick={() => pump.is_running ? stopPump(id) : startPump(id)}
                        disabled={isLoading}
                        className={`h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95 ${pump.is_running ? 'bg-rose-600' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                    >
                        {pump.is_running ? <Square className="mr-3 h-5 w-5 fill-white" /> : <Play className="mr-3 h-5 w-5 fill-white" />}
                        {pump.is_running ? 'Emergency Stop' : 'System Start'}
                    </Button>
                </div>
            </div>

            {/* 2. MAIN VISUALIZATION STACK */}
            <div className="w-full max-w-[1500px] grid grid-cols-12 gap-8 h-[750px]">

                {/* 3D Simulation Focus (Column 1-9) */}
                <div className="col-span-12 lg:col-span-9 rounded-[2.5rem] overflow-hidden border border-white/5 relative group">
                    <Pump3DViewer pump={pump} />

                    {/* Floating Telemetry Pods */}
                    <div className="absolute right-8 top-8 space-y-3">
                        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl space-y-1 w-40">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Input Lift</span>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xl font-mono font-bold text-white">{physics.static_lift.toFixed(1)}</span>
                                <span className="text-xs text-slate-500 uppercase">m</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(physics.static_lift / 10) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Control Strip (Column 10-12) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="flex-1 p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl flex flex-col">
                        {/* Tab Header */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 mb-6">
                            <button
                                onClick={() => setActiveTab('vfd')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === 'vfd'
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                            >
                                <Settings size={14} />
                                VFD
                            </button>
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === 'specs'
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                            >
                                <Info size={14} />
                                Specs
                            </button>
                        </div>

                        {/* VFD Control Tab */}
                        {activeTab === 'vfd' && (
                            <>
                                <div className="space-y-6 flex-1 flex flex-col justify-center">
                                    {/* Current vs Target RPM Display */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current</span>
                                            <span className="text-xl font-mono font-bold text-cyan-400">{pump.rpm.toFixed(0)}</span>
                                            <span className="text-[10px] text-slate-500 ml-1">RPM</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-center">
                                            <span className="text-[9px] font-bold text-cyan-500/70 uppercase tracking-widest block mb-1">Target</span>
                                            <span className="text-xl font-mono font-bold text-white">{targetRpm}</span>
                                            <span className="text-[10px] text-slate-500 ml-1">RPM</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="text-center">
                                            <span className="text-4xl font-mono font-black tracking-tighter text-white">
                                                {targetRpm}
                                            </span>
                                            <span className="block text-xs font-bold text-cyan-500/60 mt-1 uppercase">Speed Setpoint</span>
                                        </div>

                                        <input
                                            type="range"
                                            min="600"
                                            max="1180"
                                            step="10"
                                            value={targetRpm}
                                            onChange={(e) => setTargetRpm(parseInt(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono">
                                            <span>600</span>
                                            <span className="text-emerald-500">BEP: 1120</span>
                                            <span>1180</span>
                                        </div>
                                    </div>

                                    {/* Warning if pump not running */}
                                    {!pump.is_running && (
                                        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                                Start pump to change speed
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        className={`w-full h-12 rounded-xl font-bold uppercase tracking-widest transition-all shadow-xl ${
                                            pump.is_running
                                                ? 'bg-white text-black hover:bg-cyan-500 hover:text-white shadow-cyan-500/10'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                        onClick={applyRpm}
                                        disabled={isLoading || !pump.is_running}
                                    >
                                        {isLoading ? 'Sending...' : 'Apply Speed'}
                                    </Button>
                                </div>

                                <div className="mt-auto pt-4">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={12} className="text-emerald-400" />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                                            </div>
                                            <span className="text-lg font-mono font-bold text-emerald-400">{physics.η.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Design Specs Tab */}
                        {activeTab === 'specs' && (
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {!designSpecs ? (
                                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                                        Loading specs...
                                    </div>
                                ) : (
                                    <>
                                        {/* Hydraulic */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Droplets className="h-3 w-3" /> Hydraulic
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <SpecItem label="Design Flow" value={designSpecs.DesignFlow || 2500} unit="m³/h" />
                                                <SpecItem label="Design Head" value={designSpecs.DesignHead || 15} unit="m" />
                                                <SpecItem label="BEP Efficiency" value={designSpecs.ManufacturerBEP_Efficiency || 84} unit="%" />
                                                <SpecItem label="NPSH Required" value={designSpecs.NPSHRequired || 4.5} unit="m" />
                                                <SpecItem label="Impeller Dia" value={designSpecs.ImpellerDiameter || 450} unit="mm" />
                                            </div>
                                        </div>

                                        {/* Electrical */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Zap className="h-3 w-3" /> Electrical
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <SpecItem label="Design Power" value={designSpecs.DesignPower || 150} unit="kW" />
                                                <SpecItem label="Motor Eff" value={designSpecs.MotorEfficiency || 95.4} unit="%" />
                                                <SpecItem label="Rated Voltage" value={designSpecs.RatedVoltage || 480} unit="V" />
                                                <SpecItem label="Full Load Amps" value={designSpecs.FullLoadAmps || 225} unit="A" />
                                            </div>
                                        </div>

                                        {/* Mechanical */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Gauge className="h-3 w-3" /> Mechanical
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <SpecItem label="Max RPM" value={designSpecs.MaxRPM || 1180} unit="RPM" />
                                                <SpecItem label="Min RPM" value={designSpecs.MinRPM || 600} unit="RPM" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. PERFORMANCE ANALYZER (FULL WIDTH FOCUS) */}
            <div className="w-full max-w-[1500px] p-10 rounded-[3rem] bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/5 shadow-inner backdrop-blur-2xl">
                <div className="flex items-end justify-between mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-1 bg-cyan-500 rounded-full" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter">System Performance Curve</h2>
                        </div>
                        <p className="text-sm text-slate-500 max-w-xl font-medium">
                            Real-time intersection analysis between the <span className="text-cyan-400">Pump Curve (H-Q)</span>, <span className="text-emerald-400">Efficiency Map</span>, and <span className="text-amber-400">System Resistance</span>.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">BEP Flow</span>
                            <span className="text-2xl font-mono font-bold">{physics.BEP_FLOW.toFixed(0)} <span className="text-xs font-normal opacity-40">m³/h</span></span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Hydraulic Power</span>
                            <span className="text-2xl font-mono font-bold text-rose-400">{pump.power_consumption.toFixed(2)} <span className="text-xs font-normal opacity-40">kW</span></span>
                        </div>
                    </div>
                </div>

                <div className="h-[500px] w-full relative">
                    {/* Y-Axis Labels - Positioned outside chart area */}
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.15em]">Head (m)</span>
                    </div>
                    <div className="absolute -right-20 top-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap flex items-center gap-3">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.1em]">Eff %</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.1em]">Power kW</span>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Flow Rate (m³/h)</div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={physics.points} margin={{ top: 20, right: 50, left: 30, bottom: 30 }}>
                            <defs>
                                <linearGradient id="effGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />

                            <XAxis
                                dataKey="q"
                                type="number"
                                domain={[0, 5000]}
                                stroke="#334155"
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                tickCount={10}
                                axisLine={{ stroke: '#334155' }}
                            />

                            {/* Left Y-Axis for Head - Cyan themed */}
                            <YAxis
                                yAxisId="left"
                                stroke="#0e7490"
                                domain={[0, 60]}
                                tick={{ fill: '#06b6d4', fontSize: 10, fontWeight: 'bold' }}
                                tickCount={7}
                                axisLine={{ stroke: '#0e7490' }}
                            />

                            {/* Right Y-Axis for Eff/Power - Dual colored ticks */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#065f46"
                                domain={[0, 100]}
                                tick={{ fill: '#10b981', fontSize: 10, fontWeight: 'bold' }}
                                tickCount={6}
                                axisLine={{ stroke: '#065f46' }}
                            />

                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'medium' }}
                            />

                            <Legend verticalAlign="top" height={36} iconType="circle" />

                            {/* CURVES */}
                            <Line yAxisId="left" type="monotone" dataKey="head" stroke="#06b6d4" strokeWidth={4} dot={false} name="H-Q Pump Curve" />
                            <Line yAxisId="left" type="monotone" dataKey="system" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="8 8" name="System Resistance" />
                            <Line yAxisId="right" type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={3} dot={false} name="Brake Horsepower (kW)" />
                            <Area yAxisId="right" type="monotone" dataKey="efficiency" fill="url(#effGradient)" stroke="#10b981" strokeWidth={3} name="Hydraulic Efficiency (%)" />

                            {/* LIVE OPERATING POINT INDICATORS */}
                            <ReferenceDot
                                yAxisId="left"
                                x={pump.flow_rate}
                                y={(pump.discharge_pressure * 10.197)}
                                r={8}
                                fill="#00e1ff"
                                stroke="white"
                                strokeWidth={3}
                                className="animate-pulse"
                            />
                            <ReferenceDot
                                yAxisId="right"
                                x={pump.flow_rate}
                                y={physics.η}
                                r={6}
                                fill="#10b981"
                                stroke="white"
                                strokeWidth={2}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. FACILITY FOOTER */}
            <div className="w-full max-w-[1500px] flex justify-between items-center text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase pt-8 border-t border-white/5">
                <div className="flex gap-10">
                    <span className="flex items-center gap-2">
                        <Waves size={14} /> Total Dynamic Head Resolver v4.8
                    </span>
                    <span className="flex items-center gap-2">
                        <BarChart3 size={14} /> Affinity Law Engine active
                    </span>
                </div>
                <div className="flex gap-10">
                    <span>Facility Integration Layer: Influent Headworks</span>
                    <span>OPC UA Protocol Type: NS1;S_PUMP_STATION</span>
                </div>
            </div>
        </div>
    );
}

// Helper component for design specs display
function SpecItem({ label, value, unit }: { label: string; value: number | string; unit: string }) {
    return (
        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-[9px] text-slate-500 uppercase truncate">{label}</p>
            <p className="font-mono text-sm text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
                <span className="text-slate-500 text-[10px] ml-0.5">{unit}</span>
            </p>
        </div>
    );
}
