import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import EmployerDashboard from './pages/employer/EmployerDashboard'
import Chat from './pages/Chat'
import AdminDashboard from './pages/admin/AdminDashboard'

function Protected({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
  return children
}

function DashboardRouter() {
  const { user } = useAuth()
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'WORKER') return <WorkerDashboard />
  return <EmployerDashboard />
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><DashboardRouter /></Protected>} />
        <Route path="/chat" element={<Protected><Chat /></Protected>} />
        <Route path="/admin" element={<Protected role="ADMIN"><AdminDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
