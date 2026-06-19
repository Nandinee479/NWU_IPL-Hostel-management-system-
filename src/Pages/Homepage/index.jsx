import { Link } from 'react-router-dom'
import { Hotel, Utensils, CreditCard, BarChart3, Users, Shield, Zap, CheckCircle } 
from 'lucide-react'

export default function Homepage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e2d6b] rounded-md flex items-center justify-center">
            <Hotel size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Harmony House</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login?role=student" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5">
            Student Login
          </Link>
          <Link to="/login?role=admin" className="text-sm bg-[#1e2d6b] text-white font-medium px-4 py-1.5 rounded-md hover:bg-[#162057] transition-colors">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#1a2744] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Hotel size={12} />
            Smart Hostel Management System
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Manage Your Hostel<br />
            <span className="text-white">Smarter</span>{' '}
            <span className="text-blue-300">&amp; Faster</span>
          </h1>
          <p className="text-white/70 text-base max-w-xl mb-8 leading-relaxed">
            Streamline hostel operations with intelligent meal tracking, payment
            management, and real-time analytics — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login?role=student" className="inline-flex items-center gap-2 bg-white text-[#1a2744] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
              Login as Student
              <span className="text-xs">›</span>
            </Link>
            <Link to="/login?role=admin" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors">
              Login as Admin
              <span className="text-xs">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '500+', label: 'Students Managed' },
            { value: '99%', label: 'Uptime' },
            { value: '10k+', label: 'Meals Tracked' },
            { value: '₹50L+', label: 'Payments Processed' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-[#1a2744]">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">Features</p>
          <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Run a Hostel</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            A complete management solution designed for both administrators and students.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Utensils,
              color: 'bg-orange-50 text-orange-500',
              title: 'Meal Tracking',
              desc: 'Track daily meals — breakfast, lunch, and dinner with full history.',
            },
            {
              icon: CreditCard,
              color: 'bg-green-50 text-green-500',
              title: 'Payment Management',
              desc: 'Manage monthly payments, track dues, and maintain complete records.',
            },
            {
              icon: BarChart3,
              color: 'bg-blue-50 text-blue-500',
              title: 'Reports & Analytics',
              desc: 'Generate comprehensive reports with visual charts and analytics.',
            },
            {
              icon: Users,
              color: 'bg-purple-50 text-purple-500',
              title: 'Student Management',
              desc: 'Efficiently manage student records, profiles, and track progress.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose Our System?</h2>
          <p className="text-gray-500 text-sm mt-2">Built to make hostel management effortless for everyone.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: CheckCircle,
              color: 'bg-blue-50 text-blue-500',
              title: 'Easy to Use',
              desc: 'Intuitive interface designed for both students and administrators.',
            },
            {
              icon: Zap,
              color: 'bg-yellow-50 text-yellow-500',
              title: 'Real-time Updates',
              desc: 'Instant updates on meals and payments with live tracking.',
            },
            {
              icon: Shield,
              color: 'bg-green-50 text-green-500',
              title: 'Secure & Reliable',
              desc: 'Your data is safe with our secure management system.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h2>
        <p className="text-gray-500 text-sm mb-7">Join hundreds of hostels already using our platform.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/login?role=student" className="inline-flex items-center gap-2 bg-[#1a2744] text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#162057] transition-colors">
            Student Login
            <span className="text-xs">›</span>
          </Link>
          <Link to="/login?role=admin" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            Admin Login
            <span className="text-xs">›</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a2744] text-white/50 text-xs py-5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
            <Hotel size={12} className="text-white/80" />
          </div>
          <span className="text-white/80 font-semibold">Harmony House</span>
        </div>
        <span>© 2025 Harmony House Ltd. All rights reserved.</span>
      </footer>
    </div>
  )
}
