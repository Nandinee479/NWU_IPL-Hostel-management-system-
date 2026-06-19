import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Homepage from './Pages/Homepage'
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import DashboardPage from './Pages/Dashboard'
import RoomManagement from './Pages/RoomManagement'
import Student from './Pages/StudentManagement'
import MealEntryIndex from './Pages/MealEntry'
import ComplainIndex from './Pages/Complain'
import PaymentsIndex from './Pages/Payments'
import StudentOrder from './Pages/StudentOrder'

//Student Pages
import Registration from './Pages/Registration'
import StudentDashboard from './Pages/Student'
import OrderMeal from './Pages/OrderMeal'
import MealHistory from './Pages/MealHistory'
import PaymentHistory from './Pages/PaymentHistory'
import MakePayment from './Pages/MakePayment'
import ComplainStu from './Pages/ComplainStu'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/*" element={<ProtectedRoute role="admin"><DashboardPage /></ProtectedRoute>} />
        <Route path="/RoomManagement/*" element={<ProtectedRoute role="admin"><RoomManagement  /></ProtectedRoute>} />
        <Route path="/student-management/*" element={<ProtectedRoute role="admin"><Student /></ProtectedRoute>} />
        <Route path="/meal-entry/*" element={<ProtectedRoute role="admin"><MealEntryIndex /></ProtectedRoute>} />
        <Route path="/complain/*" element={<ProtectedRoute role="admin"><ComplainIndex /></ProtectedRoute>} />
        <Route path="/payments/*" element={<ProtectedRoute role="admin"><PaymentsIndex /></ProtectedRoute>} />
        <Route path="/registration/*" element={<ProtectedRoute role="admin"><Registration /></ProtectedRoute>} />
        <Route path="/student-order/*" element={<ProtectedRoute role="admin"><StudentOrder /></ProtectedRoute>} />

      {/* Student Routes */}
        <Route path="/student/*" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/order-meal/*" element={<ProtectedRoute role="student"><OrderMeal /></ProtectedRoute>} />
        <Route path="/meal-history/*" element={<ProtectedRoute role="student"><MealHistory /></ProtectedRoute>} />
        <Route path="/make-payment/*" element={<ProtectedRoute role="student"><MakePayment /></ProtectedRoute>} />
        <Route path="/payment-history/*" element={<ProtectedRoute role="student"><PaymentHistory /></ProtectedRoute>} />
        <Route path="/complain-stu/*" element={<ProtectedRoute role="student"><ComplainStu /></ProtectedRoute>} />
        
        
      </Routes>
    </AuthProvider>
  )
}

export default App
