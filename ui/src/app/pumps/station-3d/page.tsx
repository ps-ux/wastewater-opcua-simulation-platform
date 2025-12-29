'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { IPS3DViewer } from '@/components/pumps/ips-3d-viewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Station3DPage() {
    const { pumps, pumpData, fetchPumps, isLoading } = usePumpStore();

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

    return (
        <div className="flex h-screen w-full flex-col bg-slate-950">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 z-50 w-full p-6 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <Link href="/pumps">
                        <Button variant="outline" className="bg-slate-900/50 backdrop-blur-md border-slate-700 hover:bg-slate-800 text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 3D Viewport */}
            <div className="flex-1">
                <IPS3DViewer pumps={fullPumpData} />
            </div>
        </div>
    );
}
