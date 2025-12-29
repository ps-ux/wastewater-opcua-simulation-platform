"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { PumpControlPanel } from '@/components/pumps/pump-control-panel';
import { ProcessFlowDiagram } from '@/components/process/process-flow-diagram';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function PumpDetailPage() {
    const params = useParams();
    const router = useRouter();
    const {
        pumpData,
        startPump,
        stopPump,
        resetFault,
        setSpeed,
        fetchPumps,
        pumps
    } = usePumpStore();

    const pumpId = params.id as string;
    const pump = pumpData[pumpId];

    const { isConnected } = usePumpWebSocket();

    // Initial fetch to ensure we have data while WS connects
    useEffect(() => {
        fetchPumps();
    }, [fetchPumps]);

    if (!pump) {
        return (
            <div className="flex h-screen items-center justify-center space-x-2">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading Pump Data...</span>
            </div>
        );
    }

    // Calculate wet well levels from available pumps (fallback logic)
    // In a real scenario, this should come from a separate 'System' store or asset properties
    const northPumps = Object.values(pumpData).filter(p => ['IPS_PMP_001', 'IPS_PMP_002', 'IPS_PMP_003', 'IPS_PMP_004'].includes(p.id));
    const southPumps = Object.values(pumpData).filter(p => ['IPS_PMP_005', 'IPS_PMP_006', 'IPS_PMP_007'].includes(p.id));

    // Use the wet_well_level from the first pump in each group as a proxy for the well level
    const wwNorth = northPumps[0]?.wet_well_level || 10.0;
    const wwSouth = southPumps[0]?.wet_well_level || 10.0;

    return (
        <div className="min-h-screen bg-slate-950 p-6 space-y-8 pb-20">

            {/* Navigation */}
            {/* Navigation & Status */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/pumps')}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="flex items-center space-x-2 text-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-muted-foreground">{isConnected ? 'Live Data Stream' : 'Connecting...'}</span>
                </div>
            </div>

            {/* Main Control Panel */}
            <PumpControlPanel
                pump={pump}
                onStart={() => startPump(pumpId)}
                onStop={() => stopPump(pumpId)}
                onResetFault={() => resetFault(pumpId)}
                onSetSpeed={(rpm) => setSpeed(pumpId, rpm)}
            />

            {/* Process Visualization Context */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Process Context</h3>
                <ProcessFlowDiagram
                    pumps={Object.values(pumpData)}
                    wetWellLevelNorth={wwNorth}
                    wetWellLevelSouth={wwSouth}
                />
            </div>

        </div >
    );
}
