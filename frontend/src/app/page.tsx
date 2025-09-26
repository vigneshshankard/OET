"use client"

export default function HomePage() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleStartPractice = () => {
    window.location.href = '/auth/register'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: '#36454F' }}>
            OET Praxis
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: '#36454F' }}>
            AI-powered speaking practice platform for healthcare professionals preparing for the OET exam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartPractice}
              className="text-white px-8 py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: '#008080' }}
            >
              Start Free Practice
            </button>
            <button 
              onClick={scrollToFeatures}
              className="px-8 py-3 rounded-lg font-semibold transition-colors border-2 hover:opacity-90"
              style={{ 
                borderColor: '#FF8C00', 
                color: '#FF8C00',
                backgroundColor: 'transparent'
              }}
            >
              Learn More
            </button>
          </div>
        </div>
        
        <div id="features-section" className="mt-16 grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#E0F2F1' }}
            >
              <span style={{ color: '#008080' }} className="text-2xl">👩‍⚕️</span>
            </div>
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>For Doctors</h3>
            <p style={{ color: '#36454F' }} className="opacity-80">Practice patient consultations and diagnostic discussions</p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#E0F2F1' }}
            >
              <span style={{ color: '#008080' }} className="text-2xl">👨‍⚕️</span>
            </div>
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>For Nurses</h3>
            <p style={{ color: '#36454F' }} className="opacity-80">Master patient education and care coordination</p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FFF3E0' }}
            >
              <span style={{ color: '#FF8C00' }} className="text-2xl">🦷</span>
            </div>
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>For Dentists</h3>
            <p style={{ color: '#36454F' }} className="opacity-80">Practice dental consultations and treatment explanations</p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FFF3E0' }}
            >
              <span style={{ color: '#FF8C00' }} className="text-2xl">🏃‍♂️</span>
            </div>
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>For Physiotherapists</h3>
            <p style={{ color: '#36454F' }} className="opacity-80">Improve rehabilitation discussions and exercise guidance</p>
          </div>
        </div>
      </div>
    </div>
  )
}