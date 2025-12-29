'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { IPS3DViewer } from '@/components/pumps/ips-3d-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function Station3DPage() {
    const [ipsPumpsStarted, setIpsPumpsStarted] = useState(false);
    const { pumps, pumpData, fetchPumps, startAllIPSPumps, isLoading } = usePumpStore();

    useEffect(() => {
        fetchPumps();
        // Set up a polling interval for live updates from store if not websocket driven,
        // but assuming the store handles updates or we rely on initial fetch + websockets.
        // The store seems to update pumpData via websocket connection in other components.
        // We ensure we fetch at least once.
    }, [fetchPumps]);

    // Merge static pump info with dynamic data
    const fullPumpData = pumps.map(pump => ({
        ...pump,
        ...(pumpData[pump.id] || {})
    }));

    const { isConnected } = usePumpWebSocket();

    // Compute station aggregates
    const activePumps = fullPumpData.filter(p => p.is_running).length;
    const totalPumps = fullPumpData.length;
    const totalFlow = fullPumpData.reduce((acc, p) => acc + (p.flow_rate || 0), 0);
    const totalPower = fullPumpData.reduce((acc, p) => acc + (p.power_consumption || 0), 0);

    const formattedTotalFlow = totalFlow.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const formattedTotalPower = totalPower.toLocaleString(undefined, { maximumFractionDigits: 0 });

    const handleStartIPS = async () => {
        await startAllIPSPumps();
        setIpsPumpsStarted(true);
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
                        <div className="mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Facility Twin</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                            Rock Creek <span className="text-cyan-500">_</span> IPS
                        </h1>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button 
                        onClick={handleStartIPS} 
                        disabled={ipsPumpsStarted || isLoading}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Cpu className="mr-2 h-4 w-4" />
                        IPS Controller
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        {isConnected ? 'OPC UA Streaming' : 'Reconnecting...'}
                    </div>
                </div>
            </div>

            {/* 2. MAIN VISUALIZATION STACK */}
            <div className="w-full max-w-[1500px] h-[750px] relative rounded-[2.5rem] overflow-hidden border border-white/5 group">
                <IPS3DViewer pumps={fullPumpData} />

                {/* OVERLAY UI */}
                <div className="absolute top-8 left-8 p-6 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl max-w-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Station Telemetry</h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Total Flow</span>
                            <span className="text-xl font-mono font-bold text-cyan-400">
                                {formattedTotalFlow} <span className="text-xs text-slate-500">m³/h</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Active Pumps</span>
                            <span className="text-xl font-mono font-bold text-white">
                                {activePumps} <span className="text-xs text-slate-500">/ {totalPumps}</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Total Power</span>
                            <span className="text-xl font-mono font-bold text-amber-400">
                                {formattedTotalPower} <span className="text-xs text-slate-500">kW</span>
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">North Elev</span>
                            <span className="text-lg font-mono font-bold text-rose-400">113.8 <span className="text-[10px]">ft</span></span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">South Elev</span>
                            <span className="text-lg font-mono font-bold text-rose-400">113.8 <span className="text-[10px]">ft</span></span>
                        </div>
                    </div>
                </div>
            </div>
            {/* FOOTER */}
            <div className="w-full max-w-[1500px] flex justify-between items-center text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase pt-4">
                <span>Interactive Facility Model</span>
                <span>Coordinates: 45.12N, 122.43W</span>
            </div>
        </div>
    );
}
