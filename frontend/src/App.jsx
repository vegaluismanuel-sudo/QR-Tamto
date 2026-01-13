import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ReportProvider } from './contexts/ReportContext';
import Welcome from './components/Welcome/Welcome';
import MainLayout from './components/Layout/MainLayout';
import DataCapture from './components/DataCapture/DataCapture';
import ReportHistory from './components/History/ReportHistory';
import StatsDashboard from './components/StatsDashboard/StatsDashboard';
import CapabilityAnalysis from './components/CapabilityAnalysis/CapabilityAnalysis';
import WebReportView from './components/Reports/WebReportView';
import Login from './components/Auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 border-4 border-[#FBCC00] border-t-transparent rounded-full animate-spin"></div>
  </div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Placeholder only if not implemented yet
const CapabilityIndices = () => <div className="p-4 bg-white shadow rounded">Capability Indices (Component to be built)</div>;

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ReportProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginWrapper />} />
              <Route path="/" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DataCapture /></MainLayout></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><MainLayout><StatsDashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/capability" element={<ProtectedRoute><MainLayout><CapabilityAnalysis /></MainLayout></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><MainLayout><ReportHistory /></MainLayout></ProtectedRoute>} />
              <Route path="/report-view" element={<ProtectedRoute><WebReportView /></ProtectedRoute>} />
            </Routes>
          </Router>
        </ReportProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

const LoginWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" />;
  return <Login />;
};

export default App
