"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Settings,
  Database,
  Mail,
  Shield,
  Globe,
  Server,
  Key,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react'

interface SystemConfig {
  general: {
    siteName: string
    siteDescription: string
    supportEmail: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    maxSessionDuration: number
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  security: {
    jwtExpiry: number
    maxLoginAttempts: number
    sessionTimeout: number
    passwordMinLength: number
    requireTwoFactor: boolean
  }
  livekit: {
    apiKey: string
    secretKey: string
    wsUrl: string
    enabled: boolean
  }
  storage: {
    provider: string
    bucketName: string
    region: string
    maxFileSize: number
  }
}

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'error'
    responseTime: number
    lastChecked: string
  }
  livekit: {
    status: 'healthy' | 'warning' | 'error'
    responseTime: number
    lastChecked: string
  }
  email: {
    status: 'healthy' | 'warning' | 'error'
    lastSent: string
    lastChecked: string
  }
  storage: {
    status: 'healthy' | 'warning' | 'error'
    usedSpace: number
    totalSpace: number
    lastChecked: string
  }
}

export default function SystemSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadSystemConfig()
    loadSystemStatus()
  }, [])

  const loadSystemConfig = async () => {
    try {
      // Fetch system configuration from backend
      const response = await fetch('/api/admin/system/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load system config')
      }

      const data = await response.json()
      const systemConfig: SystemConfig = data.config || {
        general: {
          siteName: 'OET Praxis Platform',
          siteDescription: 'Advanced OET training platform for healthcare professionals',
          supportEmail: 'support@oetpraxis.com',
          maintenanceMode: false,
          registrationEnabled: true,
          maxSessionDuration: 60
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'notifications@oetpraxis.com',
          smtpPassword: '••••••••',
          fromEmail: 'noreply@oetpraxis.com',
          fromName: 'OET Praxis'
        },
        security: {
          jwtExpiry: 24,
          maxLoginAttempts: 5,
          sessionTimeout: 30,
          passwordMinLength: 8,
          requireTwoFactor: false
        },
        livekit: {
          apiKey: 'dev-api-key',
          secretKey: '••••••••••••••••',
          wsUrl: 'wss://oet-livekit.livekit.cloud',
          enabled: true
        },
        storage: {
          provider: 'aws-s3',
          bucketName: 'oet-praxis-storage',
          region: 'us-east-1',
          maxFileSize: 50
        }
      }

      setConfig(systemConfig)
    } catch (error) {
      console.error('Failed to load system config:', error)
    }
  }

  const loadSystemStatus = async () => {
    try {
      // Fetch system status from backend
      const response = await fetch('/api/admin/system/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load system status')
      }

      const data = await response.json()
      const systemStatus: SystemStatus = data.status || {
        database: {
          status: 'healthy',
          responseTime: 45,
          lastChecked: new Date().toISOString()
        },
        livekit: {
          status: 'healthy',
          responseTime: 120,
          lastChecked: new Date().toISOString()
        },
        email: {
          status: 'healthy',
          lastSent: '2025-09-25T08:30:00Z',
          lastChecked: new Date().toISOString()
        },
        storage: {
          status: 'healthy',
          usedSpace: 2.4,
          totalSpace: 100,
          lastChecked: new Date().toISOString()
        }
      }

      setSystemStatus(systemStatus)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load system status:', error)
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      
      // Save configuration to backend
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      })

      if (!response.ok) {
        throw new Error('Failed to save system configuration')
      }

      const result = await response.json()
      console.log('System configuration saved successfully:', result)
      
      // Show success message or handle response
    } catch (error) {
      console.error('Failed to save system config:', error)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading system settings...</p>
        </div>
      </div>
    )
  }

  if (!config || !systemStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Failed to load system settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and monitor system health</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={saving}>
          <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(systemStatus.database.status)}
              <span className="text-sm text-gray-600">{systemStatus.database.responseTime}ms</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LiveKit</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(systemStatus.livekit.status)}
              <span className="text-sm text-gray-600">{systemStatus.livekit.responseTime}ms</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Service</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(systemStatus.email.status)}
              <span className="text-xs text-gray-500">Last sent: {formatDate(systemStatus.email.lastSent)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(systemStatus.storage.status)}
              <span className="text-sm text-gray-600">
                {systemStatus.storage.usedSpace}GB / {systemStatus.storage.totalSpace}GB
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="livekit">LiveKit</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, siteName: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={config.general.supportEmail}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, supportEmail: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={config.general.siteDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({
                    ...config,
                    general: { ...config.general, siteDescription: e.target.value }
                  })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxSessionDuration">Max Session Duration (minutes)</Label>
                  <Input
                    id="maxSessionDuration"
                    type="number"
                    value={config.general.maxSessionDuration}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, maxSessionDuration: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Temporarily disable access to the platform</p>
                  </div>
                  <Switch
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      general: { ...config.general, maintenanceMode: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registration Enabled</Label>
                    <p className="text-sm text-gray-600">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={config.general.registrationEnabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      general: { ...config.general, registrationEnabled: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={config.email.smtpHost}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, smtpHost: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, smtpPort: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={config.email.smtpUser}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, smtpUser: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={config.email.smtpPassword}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, smtpPassword: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, fromEmail: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={config.email.fromName}
                    onChange={(e) => setConfig({
                      ...config,
                      email: { ...config.email, fromName: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and session security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jwtExpiry">JWT Token Expiry (hours)</Label>
                  <Input
                    id="jwtExpiry"
                    type="number"
                    value={config.security.jwtExpiry}
                    onChange={(e) => setConfig({
                      ...config,
                      security: { ...config.security, jwtExpiry: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => setConfig({
                      ...config,
                      security: { ...config.security, maxLoginAttempts: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => setConfig({
                      ...config,
                      security: { ...config.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Password Min Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => setConfig({
                      ...config,
                      security: { ...config.security, passwordMinLength: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Enforce 2FA for all users</p>
                </div>
                <Switch
                  checked={config.security.requireTwoFactor}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    security: { ...config.security, requireTwoFactor: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="livekit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LiveKit Configuration</CardTitle>
              <CardDescription>Real-time communication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input
                  id="wsUrl"
                  value={config.livekit.wsUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    livekit: { ...config.livekit, wsUrl: e.target.value }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={config.livekit.apiKey}
                    onChange={(e) => setConfig({
                      ...config,
                      livekit: { ...config.livekit, apiKey: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={config.livekit.secretKey}
                    onChange={(e) => setConfig({
                      ...config,
                      livekit: { ...config.livekit, secretKey: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>LiveKit Enabled</Label>
                  <p className="text-sm text-gray-600">Enable real-time communication features</p>
                </div>
                <Switch
                  checked={config.livekit.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    livekit: { ...config.livekit, enabled: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>File storage and media settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Storage Provider</Label>
                <Select 
                  value={config.storage.provider} 
                  onValueChange={(value) => setConfig({
                    ...config,
                    storage: { ...config.storage, provider: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws-s3">AWS S3</SelectItem>
                    <SelectItem value="gcp-storage">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure-blob">Azure Blob Storage</SelectItem>
                    <SelectItem value="local">Local Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bucketName">Bucket Name</Label>
                  <Input
                    id="bucketName"
                    value={config.storage.bucketName}
                    onChange={(e) => setConfig({
                      ...config,
                      storage: { ...config.storage, bucketName: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={config.storage.region}
                    onChange={(e) => setConfig({
                      ...config,
                      storage: { ...config.storage, region: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={config.storage.maxFileSize}
                  onChange={(e) => setConfig({
                    ...config,
                    storage: { ...config.storage, maxFileSize: parseInt(e.target.value) }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}