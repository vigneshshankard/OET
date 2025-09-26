export default function Footer() {
  return (
    <footer className="border-t mt-auto" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: '#008080' }}
              >
                <span className="text-white font-bold text-xs">OP</span>
              </div>
              <span 
                className="font-bold"
                style={{ color: '#36454F' }}
              >
                OET Praxis
              </span>
            </div>
            <p className="text-sm" style={{ color: '#36454F' }}>
              AI-powered speaking practice for healthcare professionals preparing for the OET exam.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3" style={{ color: '#36454F' }}>
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/scenarios" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Practice Scenarios
                </a>
              </li>
              <li>
                <a href="/progress" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Progress Tracking
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3" style={{ color: '#36454F' }}>
              Healthcare
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span style={{ color: '#36454F' }}>For Doctors</span>
              </li>
              <li>
                <span style={{ color: '#36454F' }}>For Nurses</span>
              </li>
              <li>
                <span style={{ color: '#36454F' }}>For Dentists</span>
              </li>
              <li>
                <span style={{ color: '#36454F' }}>For Physiotherapists</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3" style={{ color: '#36454F' }}>
              Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/help" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:opacity-80" style={{ color: '#36454F' }}>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm" style={{ color: '#36454F' }}>
            © 2025 OET Praxis. All rights reserved. Professional healthcare education platform.
          </p>
        </div>
      </div>
    </footer>
  )
}