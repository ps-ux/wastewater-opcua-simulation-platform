"""Bridge to share simulation engine between OPC-UA server and REST API.

When the server runs with --with-api, it registers the simulation engine here
so the API endpoints can control pumps directly.
"""

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from simulation.engine import SimulationEngine

# Shared reference to the simulation engine
_engine: Optional["SimulationEngine"] = None


def register_engine(engine: "SimulationEngine") -> None:
    """Register the simulation engine for API access."""
    global _engine
    _engine = engine


def get_engine() -> Optional["SimulationEngine"]:
    """Get the registered simulation engine."""
    return _engine


def is_engine_available() -> bool:
    """Check if the simulation engine is available."""
    return _engine is not None and _engine.is_running
