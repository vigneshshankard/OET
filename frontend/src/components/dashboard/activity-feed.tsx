import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'practice' | 'achievement' | 'progress'
  score?: number
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'practice':
        return '🎙️'
      case 'achievement':
        return '🏆'
      case 'progress':
        return '📈'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'practice':
        return '#008080'
      case 'achievement':
        return '#FF8C00'
      case 'progress':
        return '#22C55E'
      default:
        return '#36454F'
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle style={{ color: '#36454F' }}>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm opacity-70 text-center py-4" style={{ color: '#36454F' }}>
              No recent activity. Start practicing to see your progress here!
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}
                >
                  <span>{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: '#36454F' }}>
                      {activity.title}
                    </p>
                    {activity.score && (
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: '#E0F2F1',
                          color: '#008080'
                        }}
                      >
                        {activity.score}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-1" style={{ color: '#36454F' }}>
                    {activity.description}
                  </p>
                  <p className="text-xs opacity-50 mt-1" style={{ color: '#36454F' }}>
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}