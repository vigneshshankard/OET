"""
Performance monitoring utilities for OET Python AI Engine
"""

import time
import asyncio
from typing import Dict, Any, Optional
from contextlib import contextmanager
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    operation: str
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def finish(self, **metadata):
        """Finish timing and add metadata"""
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
        self.metadata.update(metadata)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get metrics as dictionary"""
        return {
            "operation": self.operation,
            "duration": self.duration,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "metadata": self.metadata
        }

@contextmanager
def measure_performance(operation_name: str, **metadata):
    """Context manager for measuring performance"""
    metrics = PerformanceMetrics(
        operation=operation_name,
        start_time=time.time(),
        metadata=metadata
    )
    
    try:
        logger.debug(f"Starting operation: {operation_name}")
        yield metrics
    finally:
        metrics.finish()
        logger.debug(f"Completed operation: {operation_name} in {metrics.duration:.3f}s")

class PerformanceTracker:
    """Track performance metrics over time"""
    
    def __init__(self):
        self.metrics_history: Dict[str, list] = {}
        self.current_metrics: Dict[str, PerformanceMetrics] = {}
    
    def start_operation(self, operation_name: str, **metadata) -> str:
        """Start tracking an operation"""
        operation_id = f"{operation_name}_{int(time.time() * 1000)}"
        
        self.current_metrics[operation_id] = PerformanceMetrics(
            operation=operation_name,
            start_time=time.time(),
            metadata=metadata
        )
        
        return operation_id
    
    def finish_operation(self, operation_id: str, **metadata) -> PerformanceMetrics:
        """Finish tracking an operation"""
        if operation_id not in self.current_metrics:
            logger.warning(f"Operation {operation_id} not found in current metrics")
            return None
        
        metrics = self.current_metrics.pop(operation_id)
        metrics.finish(**metadata)
        
        # Add to history
        operation_name = metrics.operation
        if operation_name not in self.metrics_history:
            self.metrics_history[operation_name] = []
        
        self.metrics_history[operation_name].append(metrics)
        
        # Keep only last 100 entries per operation
        if len(self.metrics_history[operation_name]) > 100:
            self.metrics_history[operation_name] = self.metrics_history[operation_name][-100:]
        
        return metrics
    
    def get_operation_stats(self, operation_name: str) -> Dict[str, Any]:
        """Get statistics for an operation"""
        if operation_name not in self.metrics_history:
            return {"operation": operation_name, "count": 0}
        
        metrics_list = self.metrics_history[operation_name]
        durations = [m.duration for m in metrics_list if m.duration is not None]
        
        if not durations:
            return {"operation": operation_name, "count": 0}
        
        return {
            "operation": operation_name,
            "count": len(durations),
            "avg_duration": sum(durations) / len(durations),
            "min_duration": min(durations),
            "max_duration": max(durations),
            "total_duration": sum(durations),
            "last_duration": durations[-1] if durations else None
        }
    
    def get_all_stats(self) -> Dict[str, Any]:
        """Get statistics for all operations"""
        return {
            operation: self.get_operation_stats(operation)
            for operation in self.metrics_history.keys()
        }

# Global performance tracker
performance_tracker = PerformanceTracker()