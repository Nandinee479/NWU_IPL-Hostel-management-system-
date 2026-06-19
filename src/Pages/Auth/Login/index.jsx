import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Hotel, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../../../AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginUser } = useAuth()

  const defaultRole = searchParams.get('role') === 'student' ? 'student' : 'admin'
  const [role, setRole] = useState(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (role === 'admin') {
      if (email === 'admin@hostel.com' && password === 'password') {
        loginUser({ uid: 'admin-uid', email, name: 'Admin', role: 'admin' }, 'admin')
        navigate('/dashboard')
      } else {
        setError('Invalid admin credentials. Use admin@hostel.com / password')
      }
      setLoading(false)
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const fbUser = userCredential.user
      const snap = await getDoc(doc(db, 'users', fbUser.uid))
      if (!snap.exists()) {
        setError('Student account not found. Please register first.')
        setLoading(false)
        return
      }
      const data = snap.data()
      if (data.status === 'pending') {
        setError('Your account is pending admin approval.')
        setLoading(false)
        return
      }
      if (data.status === 'rejected') {
        setError('Your account has been rejected.')
        setLoading(false)
        return
      }
      loginUser({ uid: fbUser.uid, email, name: data.name, role: 'student', ...data }, 'student')
      navigate('/student')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim() || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1a36 50%, #1a2744 100%)' }}
    >
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
        <ArrowLeft size={15} />
        Back to Home
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#1a2744] px-8 pt-8 pb-6 text-center">
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hotel size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Harmony House</h1>
          <p className="text-white/60 text-sm mt-1">{role === 'admin' ? 'Admin Panel' : 'Student Portal'}</p>
        </div>

        <div className="bg-[#1a2744] mx-6 mt-6 rounded-lg p-1 flex">
          <button onClick={() => { setRole('admin'); setError('') }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${role === 'admin' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/60 hover:text-white'}`}>
            Admin Login
          </button>
          <button onClick={() => { setRole('student'); setError('') }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${role === 'student' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/60 hover:text-white'}`}>
            Student Login
          </button>
        </div>

        <form onSubmit={submit} className="px-6 pt-5 pb-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'admin' ? 'admin@hostel.com' : 'your@email.com'}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]" required />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#1a2744] text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-[#162057] transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        {role === 'student' && (
          <p className="text-center text-xs text-gray-400 pb-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1a2744] font-semibold hover:underline">Register here</Link>
          </p>
        )}
        {role === 'admin' && (
          <p className="text-center text-xs text-gray-400 pb-5">Secure admin login system</p>
        )}
      </div>
    </div>
  )
}
