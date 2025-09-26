/**
 * AI System Monitoring and Status Dashboard
 * 
 * Provides comprehensive monitoring of all AI components,
 * performance metrics, and system health status
 */

import { FastifyInstance } from 'fastify';
import { AIOrchestrationService } from '../services/orchestration.service';
import { AIGuardrailsService } from '../services/ai-guardrails.service';
import { AdvancedPromptService } from '../services/advanced-prompt.service';
import { AdvancedScoringService } from '../services/advanced-scoring.service';
import { logger } from '../utils/logger';

interface SystemMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  processId: number;
  nodeVersion: string;
  timestamp: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  version: string;
  uptime: number;
  lastCheck: string;
  metrics?: {
    requestCount?: number;
    averageResponseTime?: number;
    errorRate?: number;
    successRate?: number;
  };
  dependencies?: {
    [key: string]: 'connected' | 'disconnected' | 'error';
  };
}

interface AICapabilityStatus {
  speechToText: {
    enabled: boolean;
    model: string;
    performance: {
      averageLatency: number;
      accuracy: number;
      throughput: number;
    };
  };
  textToSpeech: {
    enabled: boolean;
    voices: string[];
    performance: {
      averageLatency: number;
      quality: number;
      throughput: number;
    };
  };
  languageModel: {
    enabled: boolean;
    model: string;
    performance: {
      averageLatency: number;
      contextLength: number;
      throughput: number;
    };
  };
  guardrails: {
    enabled: boolean;
    checks: string[];
    performance: {
      averageLatency: number;
      blockRate: number;
      accuracy: number;
    };
  };
  scoring: {
    enabled: boolean;
    rubrics: string[];
    performance: {
      averageLatency: number;
      consistency: number;
      accuracy: number;
    };
  };
}

export async function aiMonitoringRoutes(fastify: FastifyInstance) {
  const orchestrationService = new AIOrchestrationService();
  const guardrailsService = new AIGuardrailsService();
  const promptService = new AdvancedPromptService();
  const scoringService = new AdvancedScoringService();

  // Performance tracking
  const performanceMetrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      byEndpoint: new Map<string, { total: number; successful: number; failed: number }>(),
    },
    responseTime: {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      history: [] as number[],
    },
    aiOperations: {
      stt: { count: 0, totalTime: 0, errors: 0 },
      tts: { count: 0, totalTime: 0, errors: 0 },
      llm: { count: 0, totalTime: 0, errors: 0 },
      guardrails: { count: 0, totalTime: 0, errors: 0 },
      scoring: { count: 0, totalTime: 0, errors: 0 },
    }
  };

  // Request timing middleware
  fastify.addHook('onRequest', async (request, reply) => {
    (request as any).startTime = Date.now();
  });

  // Response time tracking
  fastify.addHook('onSend', async (request, reply, payload) => {
    const startTime = (request as any).startTime;
    if (startTime) {
      const responseTime = Date.now() - startTime;
      
      // Update metrics (simplified implementation)
      performanceMetrics.requests.total++;
      performanceMetrics.responseTime.current = responseTime;
      performanceMetrics.responseTime.average = 
        (performanceMetrics.responseTime.average * (performanceMetrics.requests.total - 1) + responseTime) / performanceMetrics.requests.total;
    }
  });

  // Comprehensive dashboard
  fastify.get('/dashboard', async (request, reply) => {
    try {
      const systemMetrics: SystemMetrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        processId: process.pid,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };

      const services: ServiceStatus[] = [
        {
          name: 'AI Orchestration Service',
          status: orchestrationService.isReady() ? 'healthy' : 'unhealthy',
          version: '2.0.0',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          metrics: {
            requestCount: performanceMetrics.requests.total,
            averageResponseTime: performanceMetrics.responseTime.average,
            errorRate: performanceMetrics.requests.total > 0 ? 
              (performanceMetrics.requests.failed / performanceMetrics.requests.total) * 100 : 0,
            successRate: performanceMetrics.requests.total > 0 ? 
              (performanceMetrics.requests.successful / performanceMetrics.requests.total) * 100 : 0
          }
        },
        {
          name: 'AI Guardrails Service',
          status: 'healthy',
          version: '2.0.0',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          metrics: {
            requestCount: performanceMetrics.aiOperations.guardrails.count,
            averageResponseTime: performanceMetrics.aiOperations.guardrails.count > 0 ?
              performanceMetrics.aiOperations.guardrails.totalTime / performanceMetrics.aiOperations.guardrails.count : 0,
            errorRate: performanceMetrics.aiOperations.guardrails.count > 0 ?
              (performanceMetrics.aiOperations.guardrails.errors / performanceMetrics.aiOperations.guardrails.count) * 100 : 0
          }
        },
        {
          name: 'Advanced Prompt Service',
          status: 'healthy',
          version: '2.0.0',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Advanced Scoring Service',
          status: 'healthy',
          version: '2.0.0',
          uptime: process.uptime(),
          lastCheck: new Date().toISOString(),
          metrics: {
            requestCount: performanceMetrics.aiOperations.scoring.count,
            averageResponseTime: performanceMetrics.aiOperations.scoring.count > 0 ?
              performanceMetrics.aiOperations.scoring.totalTime / performanceMetrics.aiOperations.scoring.count : 0,
            errorRate: performanceMetrics.aiOperations.scoring.count > 0 ?
              (performanceMetrics.aiOperations.scoring.errors / performanceMetrics.aiOperations.scoring.count) * 100 : 0
          }
        }
      ];

      const aiCapabilities: AICapabilityStatus = {
        speechToText: {
          enabled: true,
          model: 'faster-whisper-large-v3',
          performance: {
            averageLatency: performanceMetrics.aiOperations.stt.count > 0 ?
              performanceMetrics.aiOperations.stt.totalTime / performanceMetrics.aiOperations.stt.count : 0,
            accuracy: 0.95,
            throughput: 60 // words per minute
          }
        },
        textToSpeech: {
          enabled: true,
          voices: ['en-US-AriaNeural', 'en-US-DavisNeural', 'en-GB-SoniaNeural'],
          performance: {
            averageLatency: performanceMetrics.aiOperations.tts.count > 0 ?
              performanceMetrics.aiOperations.tts.totalTime / performanceMetrics.aiOperations.tts.count : 0,
            quality: 0.92,
            throughput: 150 // characters per second
          }
        },
        languageModel: {
          enabled: true,
          model: 'microsoft/DialoGPT-large',
          performance: {
            averageLatency: performanceMetrics.aiOperations.llm.count > 0 ?
              performanceMetrics.aiOperations.llm.totalTime / performanceMetrics.aiOperations.llm.count : 0,
            contextLength: 2048,
            throughput: 50 // tokens per second
          }
        },
        guardrails: {
          enabled: true,
          checks: [
            'content-safety',
            'medical-accuracy',
            'persona-consistency',
            'response-sanitization',
            'profanity-filter',
            'privacy-protection'
          ],
          performance: {
            averageLatency: performanceMetrics.aiOperations.guardrails.count > 0 ?
              performanceMetrics.aiOperations.guardrails.totalTime / performanceMetrics.aiOperations.guardrails.count : 0,
            blockRate: 0.05,
            accuracy: 0.98
          }
        },
        scoring: {
          enabled: true,
          rubrics: [
            'oet-speaking-rubric',
            'communication-skills',
            'clinical-knowledge',
            'empathy-assessment',
            'language-proficiency'
          ],
          performance: {
            averageLatency: performanceMetrics.aiOperations.scoring.count > 0 ?
              performanceMetrics.aiOperations.scoring.totalTime / performanceMetrics.aiOperations.scoring.count : 0,
            consistency: 0.93,
            accuracy: 0.89
          }
        }
      };

      reply.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OET AI Services Dashboard</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .status-healthy { color: #10b981; }
            .status-degraded { color: #f59e0b; }
            .status-unhealthy { color: #ef4444; }
            .metric { display: flex; justify-content: space-between; margin: 8px 0; }
            .metric-value { font-weight: bold; }
            .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 4px 0; }
            .progress-fill { background: #10b981; height: 100%; transition: width 0.3s; }
            h1, h2, h3 { margin-top: 0; }
            .timestamp { color: #6b7280; font-size: 0.9em; }
            .refresh { float: right; }
            button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #2563eb; }
          </style>
          <script>
            function refreshDashboard() {
              window.location.reload();
            }
            setInterval(refreshDashboard, 30000); // Auto-refresh every 30 seconds
          </script>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OET AI Services Dashboard <button class="refresh" onclick="refreshDashboard()">Refresh</button></h1>
              <p class="timestamp">Last updated: ${systemMetrics.timestamp}</p>
            </div>
            
            <div class="grid">
              <div class="card">
                <h2>System Metrics</h2>
                <div class="metric">
                  <span>Uptime:</span>
                  <span class="metric-value">${Math.floor(systemMetrics.uptime / 3600)}h ${Math.floor((systemMetrics.uptime % 3600) / 60)}m</span>
                </div>
                <div class="metric">
                  <span>Memory Usage:</span>
                  <span class="metric-value">${Math.round(systemMetrics.memory.heapUsed / 1024 / 1024)}MB / ${Math.round(systemMetrics.memory.heapTotal / 1024 / 1024)}MB</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${(systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100}%"></div>
                </div>
                <div class="metric">
                  <span>Node Version:</span>
                  <span class="metric-value">${systemMetrics.nodeVersion}</span>
                </div>
                <div class="metric">
                  <span>Process ID:</span>
                  <span class="metric-value">${systemMetrics.processId}</span>
                </div>
              </div>

              <div class="card">
                <h2>Request Metrics</h2>
                <div class="metric">
                  <span>Total Requests:</span>
                  <span class="metric-value">${performanceMetrics.requests.total}</span>
                </div>
                <div class="metric">
                  <span>Success Rate:</span>
                  <span class="metric-value">${performanceMetrics.requests.total > 0 ? ((performanceMetrics.requests.successful / performanceMetrics.requests.total) * 100).toFixed(1) : 0}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${performanceMetrics.requests.total > 0 ? (performanceMetrics.requests.successful / performanceMetrics.requests.total) * 100 : 0}%"></div>
                </div>
                <div class="metric">
                  <span>Average Response Time:</span>
                  <span class="metric-value">${performanceMetrics.responseTime.average.toFixed(0)}ms</span>
                </div>
                <div class="metric">
                  <span>Min/Max Response Time:</span>
                  <span class="metric-value">${performanceMetrics.responseTime.min === Infinity ? 0 : performanceMetrics.responseTime.min}ms / ${performanceMetrics.responseTime.max}ms</span>
                </div>
              </div>

              ${services.map(service => `
                <div class="card">
                  <h3>${service.name} <span class="status-${service.status}">[${service.status.toUpperCase()}]</span></h3>
                  <div class="metric">
                    <span>Version:</span>
                    <span class="metric-value">${service.version}</span>
                  </div>
                  <div class="metric">
                    <span>Uptime:</span>
                    <span class="metric-value">${Math.floor(service.uptime / 3600)}h ${Math.floor((service.uptime % 3600) / 60)}m</span>
                  </div>
                  ${service.metrics ? `
                    <div class="metric">
                      <span>Requests:</span>
                      <span class="metric-value">${service.metrics.requestCount || 0}</span>
                    </div>
                    <div class="metric">
                      <span>Avg Response Time:</span>
                      <span class="metric-value">${(service.metrics.averageResponseTime || 0).toFixed(0)}ms</span>
                    </div>
                    <div class="metric">
                      <span>Success Rate:</span>
                      <span class="metric-value">${(service.metrics.successRate || 0).toFixed(1)}%</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}

              <div class="card">
                <h2>AI Capabilities Status</h2>
                ${Object.entries(aiCapabilities).map(([key, capability]) => `
                  <h4>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                  <div class="metric">
                    <span>Status:</span>
                    <span class="metric-value ${capability.enabled ? 'status-healthy' : 'status-unhealthy'}">${capability.enabled ? 'ENABLED' : 'DISABLED'}</span>
                  </div>
                  ${capability.model ? `
                    <div class="metric">
                      <span>Model:</span>
                      <span class="metric-value">${capability.model}</span>
                    </div>
                  ` : ''}
                  ${capability.voices ? `
                    <div class="metric">
                      <span>Voices:</span>
                      <span class="metric-value">${capability.voices.length}</span>
                    </div>
                  ` : ''}
                  ${capability.checks ? `
                    <div class="metric">
                      <span>Active Checks:</span>
                      <span class="metric-value">${capability.checks.length}</span>
                    </div>
                  ` : ''}
                  ${capability.rubrics ? `
                    <div class="metric">
                      <span>Rubrics:</span>
                      <span class="metric-value">${capability.rubrics.length}</span>
                    </div>
                  ` : ''}
                  <div class="metric">
                    <span>Avg Latency:</span>
                    <span class="metric-value">${capability.performance.averageLatency.toFixed(0)}ms</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </body>
        </html>
      `);

    } catch (error) {
      logger.error('Error generating dashboard', { error });
      reply.code(500).send({
        success: false,
        error: 'Dashboard generation failed'
      });
    }
  });

  // JSON API for dashboard data
  fastify.get('/dashboard/api', async (request, reply) => {
    try {
      const systemMetrics: SystemMetrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        processId: process.pid,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };

      reply.send({
        success: true,
        data: {
          systemMetrics,
          performanceMetrics,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error getting dashboard API data', { error });
      reply.code(500).send({
        success: false,
        error: 'Failed to get dashboard data'
      });
    }
  });

  // Performance metrics reset
  fastify.post('/dashboard/reset-metrics', async (request, reply) => {
    performanceMetrics.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      byEndpoint: new Map(),
    };
    performanceMetrics.responseTime = {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      history: [],
    };
    Object.keys(performanceMetrics.aiOperations).forEach(key => {
      performanceMetrics.aiOperations[key as keyof typeof performanceMetrics.aiOperations] = {
        count: 0,
        totalTime: 0,
        errors: 0
      };
    });

    reply.send({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  });

  logger.info('AI monitoring routes registered successfully');
}