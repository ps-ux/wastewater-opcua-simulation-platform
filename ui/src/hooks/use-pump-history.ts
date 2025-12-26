// Hook for maintaining pump data history for charts

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import type { PumpData } from '@/lib/types';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface PumpHistory {
  flow_rate: DataPoint[];
  rpm: DataPoint[];
  power_consumption: DataPoint[];
  bearing_temp_de: DataPoint[];
  vibration_de_h: DataPoint[];
  suction_pressure: DataPoint[];
  discharge_pressure: DataPoint[];
}

const MAX_HISTORY_POINTS = 60; // Keep last 60 data points (1 minute at 1s interval)

export function usePumpHistory(pumpId: string) {
  const [history, setHistory] = useState<PumpHistory>({
    flow_rate: [],
    rpm: [],
    power_consumption: [],
    bearing_temp_de: [],
    vibration_de_h: [],
    suction_pressure: [],
    discharge_pressure: [],
  });

  const { pumpData } = usePumpStore();
  const lastUpdateRef = useRef<number>(0);

  const addDataPoint = useCallback((data: PumpData) => {
    const now = Date.now();

    // Throttle updates to max 1 per second
    if (now - lastUpdateRef.current < 900) return;
    lastUpdateRef.current = now;

    setHistory(prev => {
      const addPoint = (arr: DataPoint[], value: number): DataPoint[] => {
        const newArr = [...arr, { timestamp: now, value }];
        if (newArr.length > MAX_HISTORY_POINTS) {
          return newArr.slice(-MAX_HISTORY_POINTS);
        }
        return newArr;
      };

      return {
        flow_rate: addPoint(prev.flow_rate, data.flow_rate),
        rpm: addPoint(prev.rpm, data.rpm),
        power_consumption: addPoint(prev.power_consumption, data.power_consumption),
        bearing_temp_de: addPoint(prev.bearing_temp_de, data.bearing_temp_de),
        vibration_de_h: addPoint(prev.vibration_de_h, data.vibration_de_h),
        suction_pressure: addPoint(prev.suction_pressure, data.suction_pressure),
        discharge_pressure: addPoint(prev.discharge_pressure, data.discharge_pressure),
      };
    });
  }, []);

  useEffect(() => {
    const data = pumpData[pumpId];
    if (data && data.is_running) {
      addDataPoint(data);
    }
  }, [pumpId, pumpData, addDataPoint]);

  const clearHistory = useCallback(() => {
    setHistory({
      flow_rate: [],
      rpm: [],
      power_consumption: [],
      bearing_temp_de: [],
      vibration_de_h: [],
      suction_pressure: [],
      discharge_pressure: [],
    });
  }, []);

  return { history, clearHistory };
}
