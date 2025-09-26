"""
Monitoring and health check utilities for OET Python AI Engine
"""

import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

@dataclass
class SystemHealth:
    """System health status"""
    service_name: str
    status: str  # healthy, degraded, unhealthy
    timestamp: datetime
    details: Dict[str, Any]
    response_time_ms: Optional[float] = None

class MetricsCollector:
    """Collect and manage system metrics"""
    
    def __init__(self):
        self.request_metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0.0,
            "requests_by_endpoint": {},
            "error_counts": {}
        }
        self.performance_history = []
        self.max_history_size = 1000
    
    async def record_request(
        self, 
        method: str, 
        endpoint: str, 
        status_code: int, 
        duration: float
    ):
        """Record a request for metrics"""
        try:
            self.request_metrics["total_requests"] += 1
            
            if 200 <= status_code < 300:
                self.request_metrics["successful_requests"] += 1
            else:
                self.request_metrics["failed_requests"] += 1
            
            # Update average response time
            total = self.request_metrics["total_requests"]
            current_avg = self.request_metrics["avg_response_time"]
            self.request_metrics["avg_response_time"] = (
                (current_avg * (total - 1) + duration) / total
            )
            
            # Track by endpoint
            endpoint_key = f"{method}:{endpoint}"
            if endpoint_key not in self.request_metrics["requests_by_endpoint"]:
                self.request_metrics["requests_by_endpoint"][endpoint_key] = {
                    "count": 0,
                    "avg_duration": 0.0,
                    "success_count": 0,
                    "error_count": 0
                }
            
            endpoint_metrics = self.request_metrics["requests_by_endpoint"][endpoint_key]
            endpoint_metrics["count"] += 1
            
            if 200 <= status_code < 300:
                endpoint_metrics["success_count"] += 1
            else:
                endpoint_metrics["error_count"] += 1
            
            # Update endpoint average duration
            count = endpoint_metrics["count"]
            current_avg = endpoint_metrics["avg_duration"]
            endpoint_metrics["avg_duration"] = (
                (current_avg * (count - 1) + duration) / count
            )
            
            # Add to performance history
            self.performance_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "method": method,
                "endpoint": endpoint,
                "status_code": status_code,
                "duration": duration
            })
            
            # Trim history if too large
            if len(self.performance_history) > self.max_history_size:
                self.performance_history = self.performance_history[-self.max_history_size:]
                
        except Exception as e:
            logger.error(f"Error recording request metrics: {e}")
    
    async def record_error(
        self, 
        method: str, 
        endpoint: str, 
        error_type: str, 
        duration: float
    ):
        """Record an error for metrics"""
        try:
            await self.record_request(method, endpoint, 500, duration)
            
            # Track error types
            if error_type not in self.request_metrics["error_counts"]:
                self.request_metrics["error_counts"][error_type] = 0
            self.request_metrics["error_counts"][error_type] += 1
            
        except Exception as e:
            logger.error(f"Error recording error metrics: {e}")
    
    async def get_prometheus_metrics(self) -> Dict[str, Any]:
        """Get metrics in Prometheus format"""
        try:
            metrics = {}
            
            # Basic counters
            metrics["oet_requests_total"] = self.request_metrics["total_requests"]
            metrics["oet_requests_successful_total"] = self.request_metrics["successful_requests"]
            metrics["oet_requests_failed_total"] = self.request_metrics["failed_requests"]
            metrics["oet_request_duration_avg"] = self.request_metrics["avg_response_time"]
            
            # Success rate
            total = self.request_metrics["total_requests"]
            if total > 0:
                metrics["oet_success_rate"] = (
                    self.request_metrics["successful_requests"] / total
                )
            else:
                metrics["oet_success_rate"] = 1.0
            
            # Endpoint metrics
            metrics["oet_endpoint_metrics"] = self.request_metrics["requests_by_endpoint"]
            
            # Error counts
            metrics["oet_error_counts"] = self.request_metrics["error_counts"]
            
            # Recent performance (last 100 requests)
            recent_history = self.performance_history[-100:] if self.performance_history else []
            if recent_history:
                recent_durations = [h["duration"] for h in recent_history]
                metrics["oet_recent_avg_duration"] = sum(recent_durations) / len(recent_durations)
                metrics["oet_recent_min_duration"] = min(recent_durations)
                metrics["oet_recent_max_duration"] = max(recent_durations)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error generating Prometheus metrics: {e}")
            return {}

class HealthChecker:
    """Check health of various system components"""
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        self.health_history = []
        self.max_history_size = 100
    
    async def check_llm_health(self) -> SystemHealth:
        """Check LLM manager health"""
        start_time = time.time()
        
        try:
            if not self.llm_manager:
                return SystemHealth(
                    service_name="llm_manager",
                    status="unhealthy",
                    timestamp=datetime.utcnow(),
                    details={"error": "LLM Manager not available"},
                    response_time_ms=None
                )
            
            # Check if manager is ready
            is_ready = await self.llm_manager.is_ready()
            
            # Get basic info
            models_info = await self.llm_manager.get_loaded_models_info()
            gpu_info = await self.llm_manager.get_gpu_memory_info()
            
            response_time = (time.time() - start_time) * 1000
            
            # Determine status
            if is_ready and len(models_info) > 0:
                status = "healthy"
            elif is_ready:
                status = "degraded"  # Ready but no models loaded
            else:
                status = "unhealthy"
            
            return SystemHealth(
                service_name="llm_manager",
                status=status,
                timestamp=datetime.utcnow(),
                details={
                    "ready": is_ready,
                    "loaded_models": len(models_info),
                    "models_info": models_info,
                    "gpu_info": gpu_info
                },
                response_time_ms=response_time
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"LLM health check failed: {e}")
            
            return SystemHealth(
                service_name="llm_manager",
                status="unhealthy",
                timestamp=datetime.utcnow(),
                details={"error": str(e)},
                response_time_ms=response_time
            )
    
    async def check_system_health(self) -> SystemHealth:
        """Check general system health"""
        start_time = time.time()
        
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            response_time = (time.time() - start_time) * 1000
            
            # Determine status based on resource usage
            if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
                status = "degraded"
            elif cpu_percent > 80 or memory.percent > 80 or disk.percent > 80:
                status = "degraded"
            else:
                status = "healthy"
            
            return SystemHealth(
                service_name="system",
                status=status,
                timestamp=datetime.utcnow(),
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3)
                },
                response_time_ms=response_time
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"System health check failed: {e}")
            
            return SystemHealth(
                service_name="system",
                status="unhealthy",
                timestamp=datetime.utcnow(),
                details={"error": str(e)},
                response_time_ms=response_time
            )
    
    async def check_dependencies_health(self) -> List[SystemHealth]:
        """Check health of external dependencies"""
        dependencies = []
        
        try:
            # Check if we can import key libraries
            libraries_to_check = [
                ("torch", "PyTorch"),
                ("transformers", "Transformers"), 
                ("fastapi", "FastAPI"),
                ("pydantic", "Pydantic")
            ]
            
            for lib_name, display_name in libraries_to_check:
                start_time = time.time()
                try:
                    __import__(lib_name)
                    response_time = (time.time() - start_time) * 1000
                    
                    dependencies.append(SystemHealth(
                        service_name=f"library_{lib_name}",
                        status="healthy",
                        timestamp=datetime.utcnow(),
                        details={"library": display_name, "imported": True},
                        response_time_ms=response_time
                    ))
                except ImportError as e:
                    response_time = (time.time() - start_time) * 1000
                    
                    dependencies.append(SystemHealth(
                        service_name=f"library_{lib_name}",
                        status="unhealthy",
                        timestamp=datetime.utcnow(),
                        details={"library": display_name, "error": str(e)},
                        response_time_ms=response_time
                    ))
                    
        except Exception as e:
            logger.error(f"Dependencies health check failed: {e}")
        
        return dependencies
    
    async def comprehensive_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        try:
            # Run all health checks
            llm_health = await self.check_llm_health()
            system_health = await self.check_system_health()
            dependencies_health = await self.check_dependencies_health()
            
            # Compile results
            all_checks = [llm_health, system_health] + dependencies_health
            
            # Determine overall health
            statuses = [check.status for check in all_checks]
            if all(status == "healthy" for status in statuses):
                overall_status = "healthy"
            elif any(status == "unhealthy" for status in statuses):
                overall_status = "unhealthy"
            else:
                overall_status = "degraded"
            
            # Add to history
            health_summary = {
                "timestamp": datetime.utcnow().isoformat(),
                "overall_status": overall_status,
                "individual_checks": len(all_checks),
                "healthy_checks": len([s for s in statuses if s == "healthy"]),
                "degraded_checks": len([s for s in statuses if s == "degraded"]),
                "unhealthy_checks": len([s for s in statuses if s == "unhealthy"])
            }
            
            self.health_history.append(health_summary)
            if len(self.health_history) > self.max_history_size:
                self.health_history = self.health_history[-self.max_history_size:]
            
            return {
                "overall_healthy": overall_status == "healthy",
                "overall_status": overall_status,
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "llm": {
                        "status": llm_health.status,
                        "details": llm_health.details,
                        "response_time_ms": llm_health.response_time_ms
                    },
                    "system": {
                        "status": system_health.status,
                        "details": system_health.details,
                        "response_time_ms": system_health.response_time_ms
                    },
                    "dependencies": [
                        {
                            "service": dep.service_name,
                            "status": dep.status,
                            "details": dep.details,
                            "response_time_ms": dep.response_time_ms
                        }
                        for dep in dependencies_health
                    ]
                },
                "summary": {
                    "total_checks": len(all_checks),
                    "healthy": len([s for s in statuses if s == "healthy"]),
                    "degraded": len([s for s in statuses if s == "degraded"]),
                    "unhealthy": len([s for s in statuses if s == "unhealthy"])
                },
                "history": self.health_history[-10:]  # Last 10 health checks
            }
            
        except Exception as e:
            logger.error(f"Comprehensive health check failed: {e}")
            return {
                "overall_healthy": False,
                "overall_status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }