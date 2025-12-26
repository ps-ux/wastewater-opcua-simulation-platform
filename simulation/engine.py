"""Simulation engine coordinator.

Manages all simulation instances and runs the main tick loop.
Provides methods for mode changes and global simulation control.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from .pump import PumpSimulation
from .chamber import ChamberSimulation
from .modes import ModeParameters, SimulationMode, FailureType

_logger = logging.getLogger('simulation.engine')


class SimulationEngine:
    """Coordinates all simulation instances."""

    def __init__(self, mode_params: Optional[ModeParameters] = None):
        self.mode_params = mode_params or ModeParameters()
        self.pumps: Dict[str, PumpSimulation] = {}
        self.chambers: Dict[str, ChamberSimulation] = {}
        self.is_running = False
        self.last_tick_time: Optional[datetime] = None

        # Timing
        self.interval_ms = 1000.0  # Default 1 second

        # WebSocket broadcast callback
        self._ws_broadcast_callback = None

    def set_ws_broadcast_callback(self, callback) -> None:
        """Set callback for WebSocket broadcasting."""
        self._ws_broadcast_callback = callback
        _logger.info("WebSocket broadcast callback registered")

    def add_pump(self, pump: PumpSimulation) -> None:
        """Add a pump simulation."""
        self.pumps[pump.asset_id] = pump
        _logger.debug(f"Added pump simulation: {pump.name}")

    def add_chamber(self, chamber: ChamberSimulation) -> None:
        """Add a chamber simulation."""
        self.chambers[chamber.asset_id] = chamber
        _logger.debug(f"Added chamber simulation: {chamber.name}")

    def get_pump(self, asset_id: str) -> Optional[PumpSimulation]:
        """Get pump by asset ID."""
        return self.pumps.get(asset_id)

    def get_chamber(self, asset_id: str) -> Optional[ChamberSimulation]:
        """Get chamber by asset ID."""
        return self.chambers.get(asset_id)

    def set_interval(self, interval_ms: float) -> None:
        """Set simulation tick interval in milliseconds."""
        self.interval_ms = max(10.0, min(10000.0, interval_ms))
        _logger.info(f"Simulation interval set to {self.interval_ms}ms")

    def set_mode(self, mode: SimulationMode) -> None:
        """Change simulation mode for all pumps."""
        self.mode_params.mode = mode
        _logger.info(f"Simulation mode changed to {mode.name}")

    def trigger_failure(self, asset_id: str, failure_type: FailureType) -> bool:
        """Trigger failure on a specific pump."""
        pump = self.pumps.get(asset_id)
        if pump:
            self.mode_params.mode = SimulationMode.FAILURE
            self.mode_params.failure_config.failure_type = failure_type
            self.mode_params.failure_config.failure_progression = 0.0
            _logger.info(f"Triggered {failure_type.name} failure on {pump.name}")
            return True
        return False

    def reset_simulation(self) -> None:
        """Reset all simulations to OPTIMAL state."""
        self.mode_params = ModeParameters()
        for pump in self.pumps.values():
            pump.runtime_hours = 0.0
            pump.start_count = 0
            pump.is_faulted = False
        _logger.info("Simulation reset to OPTIMAL state")

    def apply_aging(self, years: float) -> None:
        """Apply aging to all pumps."""
        self.mode_params.mode = SimulationMode.AGED
        self.mode_params.aged_config.years_of_operation = years
        _logger.info(f"Applied {years} years of aging")

    async def run(self) -> None:
        """Main simulation loop."""
        self.is_running = True
        self.last_tick_time = datetime.now()

        _logger.info(f"Simulation engine started with {len(self.pumps)} pumps and {len(self.chambers)} chambers")

        try:
            while self.is_running:
                # Calculate time delta
                now = datetime.now()
                dt = (now - self.last_tick_time).total_seconds()
                self.last_tick_time = now

                # Update failure progression if in FAILURE mode
                if self.mode_params.mode == SimulationMode.FAILURE:
                    self._update_failure_progression(dt)

                # Tick all simulations
                await self._tick_all(dt)

                # Wait for next tick
                await asyncio.sleep(self.interval_ms / 1000.0)

        except asyncio.CancelledError:
            _logger.info("Simulation engine stopped")
        except Exception as e:
            _logger.error(f"Simulation engine error: {e}")
            raise

    def stop(self) -> None:
        """Stop the simulation loop."""
        self.is_running = False

    async def _tick_all(self, dt: float) -> None:
        """Tick all simulation instances."""
        # Tick pumps
        for pump in self.pumps.values():
            try:
                await pump.tick(dt)
            except Exception as e:
                _logger.warning(f"Error ticking pump {pump.name}: {e}")

        # Tick chambers
        for chamber in self.chambers.values():
            try:
                await chamber.tick(dt)
            except Exception as e:
                _logger.warning(f"Error ticking chamber {chamber.name}: {e}")

        # Broadcast pump states via WebSocket
        if self._ws_broadcast_callback:
            try:
                all_states = self.get_all_pump_states()
                await self._ws_broadcast_callback(all_states)
            except Exception as e:
                _logger.debug(f"WebSocket broadcast error: {e}")

    def _update_failure_progression(self, dt: float) -> None:
        """Update failure progression over time."""
        if self.mode_params.failure_config.time_to_failure <= 0:
            return

        # Progress failure based on time acceleration
        hours_elapsed = (dt / 3600.0) * self.mode_params.time_acceleration
        progress_rate = 100.0 / self.mode_params.failure_config.time_to_failure

        new_progression = (
            self.mode_params.failure_config.failure_progression +
            progress_rate * hours_elapsed * 3600.0
        )

        self.mode_params.failure_config.failure_progression = min(100.0, new_progression)

        # Check if failure is complete
        if self.mode_params.failure_config.failure_progression >= 100.0:
            _logger.warning("Failure simulation complete - pump has failed")

    # =========================================================================
    # BULK CONTROL METHODS
    # =========================================================================

    async def start_all_pumps(self) -> None:
        """Start all pumps."""
        for pump in self.pumps.values():
            await pump.start()
        _logger.info("Started all pumps")

    async def stop_all_pumps(self) -> None:
        """Stop all pumps."""
        for pump in self.pumps.values():
            await pump.stop()
        _logger.info("Stopped all pumps")

    async def start_pump(self, asset_id: str) -> bool:
        """Start a specific pump."""
        pump = self.pumps.get(asset_id)
        if pump:
            await pump.start()
            return True
        return False

    async def stop_pump(self, asset_id: str) -> bool:
        """Stop a specific pump."""
        pump = self.pumps.get(asset_id)
        if pump:
            await pump.stop()
            return True
        return False

    def get_status(self) -> Dict[str, Any]:
        """Get current simulation status."""
        return {
            'is_running': self.is_running,
            'mode': self.mode_params.mode.name,
            'interval_ms': self.interval_ms,
            'time_acceleration': self.mode_params.time_acceleration,
            'pump_count': len(self.pumps),
            'chamber_count': len(self.chambers),
            'pumps_running': sum(1 for p in self.pumps.values() if p.is_running),
            'failure_progression': self.mode_params.failure_config.failure_progression
        }

    def get_all_pump_states(self) -> Dict[str, Dict[str, Any]]:
        """Get current state of all pumps for WebSocket broadcasting."""
        states = {}
        for pump_id, pump in self.pumps.items():
            try:
                states[pump_id] = pump.get_state()
            except Exception as e:
                _logger.warning(f"Failed to get state for pump {pump_id}: {e}")
        return states
