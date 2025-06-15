import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import JobseekerDashboard from './pages/dashboard/JobseekerDashboard';
import EmployerDashboard from './pages/dashboard/EmployerDashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import Applications from './pages/Applications';
import EmployerApplications from './pages/EmployerApplications';
import PostJob from './pages/PostJob';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? (
          user.role === 'jobseeker' ? 
            <Navigate to="/dashboard/jobseeker" replace /> : 
            <Navigate to="/dashboard/employer" replace />
        ) : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        
        {/* Jobseeker Routes */}
        <Route path="/dashboard/jobseeker" element={
          <ProtectedRoute role="jobseeker">
            <JobseekerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute role="jobseeker">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute role="jobseeker">
            <Applications />
          </ProtectedRoute>
        } />

        {/* Employer Routes */}
        <Route path="/dashboard/employer" element={
          <ProtectedRoute role="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employer/applications" element={
          <ProtectedRoute role="employer">
            <EmployerApplications />
          </ProtectedRoute>
        } />
        <Route path="/post-job" element={
          <ProtectedRoute role="employer">
            <PostJob />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'bg-white shadow-lg border border-gray-200',
            duration: 4000,
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;