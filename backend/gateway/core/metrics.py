"""
Metrics collection for monitoring
Based on monitoring-service.md specification
"""

from prometheus_client import Counter, Histogram, Gauge, start_http_server
import structlog
from config.settings import get_settings

logger = structlog.get_logger(__name__)

# Metrics definitions
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections_total',
    'Number of active connections'
)

ERROR_COUNT = Counter(
    'errors_total',
    'Total number of errors',
    ['error_type', 'service']
)

RATE_LIMIT_HITS = Counter(
    'rate_limit_hits_total',
    'Total number of rate limit hits',
    ['client_type']
)


def setup_metrics():
    """Initialize metrics collection"""
    settings = get_settings()
    
    if settings.enable_metrics:
        try:
            # Start Prometheus metrics server on port 9090
            start_http_server(9090)
            logger.info("Metrics server started on port 9090")
        except Exception as e:
            logger.warning("Failed to start metrics server", error=str(e))


def record_request(method: str, endpoint: str, status_code: int, duration: float):
    """Record HTTP request metrics"""
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
    REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)


def record_error(error_type: str, service: str = "gateway"):
    """Record error metrics"""
    ERROR_COUNT.labels(error_type=error_type, service=service).inc()


def record_rate_limit_hit(client_type: str):
    """Record rate limit hit"""
    RATE_LIMIT_HITS.labels(client_type=client_type).inc()


def increment_active_connections():
    """Increment active connections counter"""
    ACTIVE_CONNECTIONS.inc()


def decrement_active_connections():
    """Decrement active connections counter"""
    ACTIVE_CONNECTIONS.dec()