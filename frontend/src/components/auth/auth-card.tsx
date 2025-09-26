import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="text-center mb-8">
      {/* OET Praxis Logo */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#008080' }}
          >
            <span className="text-white font-bold text-lg">OP</span>
          </div>
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: '#36454F' }}
            >
              OET Praxis
            </h1>
            <p className="text-sm opacity-80" style={{ color: '#36454F' }}>
              Healthcare Professional Training
            </p>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl" style={{ color: '#36454F' }}>
            {title}
          </CardTitle>
          <CardDescription className="text-base" style={{ color: '#36454F' }}>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}