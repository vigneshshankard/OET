'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Bug, 
  RefreshCw, 
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Server,
  Wifi,
  Shield,
  BookOpen
} from 'lucide-react'
import ErrorReportingService, { type ErrorMetrics, type ErrorReport } from '@/services/error-reporting'

interface ErrorMonitoringDashboardProps {
  className?: string
}

const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null)
  const [recentErrors, setRecentErrors] = useState<ErrorReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadErrorData()
  }, [timeRange])

  const loadErrorData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [metricsData, errorsData] = await Promise.all([
        ErrorReportingService.getErrorMetrics(timeRange),
        ErrorReportingService.getRecentErrors(100)
      ])

      setMetrics(metricsData)
      setRecentErrors(errorsData)
    } catch (err) {
      console.error('Failed to load error data:', err)
      setError('Failed to load error monitoring data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportErrorData = async () => {
    try {
      const data = {
        metrics,
        recentErrors: recentErrors.slice(0, 1000), // Limit export size
        exportTime: new Date().toISOString(),
        timeRange
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export error data:', err)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'medium': return <Bug className="w-4 h-4 text-yellow-600" />
      case 'low': return <Bug className="w-4 h-4 text-blue-600" />
      default: return <Bug className="w-4 h-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Shield className="w-4 h-4" />
      case 'api': return <Server className="w-4 h-4" />
      case 'practice': return <BookOpen className="w-4 h-4" />
      case 'admin': return <Users className="w-4 h-4" />
      case 'realtime': return <Wifi className="w-4 h-4" />
      default: return <Bug className="w-4 h-4" />
    }
  }

  const filteredErrors = selectedCategory === 'all' 
    ? recentErrors 
    : recentErrors.filter(error => error.category === selectedCategory)

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            onClick={loadErrorData} 
            variant="outline" 
            size="sm" 
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Error Monitoring</h2>
          <p className="text-gray-600">Track and analyze application errors</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            onClick={exportErrorData} 
            variant="outline"
            disabled={isLoading || !metrics}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={loadErrorData} 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalErrors}</div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Last {timeRange}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Critical Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.errorsBySeverity.critical || 0}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Require immediate attention
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-gray-900">
                    {Object.entries(metrics.errorsByCategory)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    {getCategoryIcon(Object.entries(metrics.errorsByCategory)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || '')}
                    <span className="ml-1">
                      {Object.entries(metrics.errorsByCategory)
                        .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} errors
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {timeRange === '24h' ? (metrics.totalErrors / 24).toFixed(1) :
                     timeRange === '7d' ? (metrics.totalErrors / 7).toFixed(1) :
                     (metrics.totalErrors / 30).toFixed(1)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Per {timeRange === '24h' ? 'hour' : 'day'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed View */}
          <Tabs defaultValue="recent" className="w-full">
            <TabsList>
              <TabsTrigger value="recent">Recent Errors</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="severity">By Severity</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </Button>
                {metrics && Object.keys(metrics.errorsByCategory).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {getCategoryIcon(category)}
                    <span className="ml-1 capitalize">{category}</span>
                    <Badge variant="secondary" className="ml-2">
                      {metrics.errorsByCategory[category]}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Error List */}
              <div className="space-y-2">
                {filteredErrors.slice(0, 50).map((error) => (
                  <Card key={error.errorId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(error.severity)}
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryIcon(error.category)}
                            <span className="ml-1 capitalize">{error.category}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{error.message}</h4>
                        {error.context && (
                          <p className="text-sm text-gray-600 mb-2">{error.context}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Error ID: {error.errorId}
                          {error.userId && ` • User: ${error.userId}`}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {filteredErrors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No errors found for the selected criteria
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics && Object.entries(metrics.errorsByCategory).map(([category, count]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="capitalize">{category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">
                        {((count / metrics.totalErrors) * 100).toFixed(1)}% of total
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="severity">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics && Object.entries(metrics.errorsBySeverity).map(([severity, count]) => (
                  <Card key={severity}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityIcon(severity)}
                        <span className="capitalize">{severity}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">
                        {((count / metrics.totalErrors) * 100).toFixed(1)}% of total
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default ErrorMonitoringDashboard