import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import CandidateDashboard from './candidate/CandidateDashboard';
import RecruiterDashboard from './recruiter/RecruiterDashboard';
import ResumeAnalyzer from './resumeAnalyzer/ResumeAnalyzer';
import AFAIInterview from './pages/AFAIInterview';
import AFAISetup from './pages/AFAISetup';
import AFAISummary from './pages/AFAISummary';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import { PremiumBackground, SmoothExperience } from './components/PremiumUI';

export default function App() {
  return (
    <>
      <PremiumBackground />
      <SmoothExperience />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route
            path="/candidate/dashboard"
            element={(
              <ProtectedRoute roles={['candidate', 'admin']}>
                <CandidateDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/recruiter/dashboard"
            element={(
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/jobs"
            element={<Jobs />}
          />
          <Route
            path="/resume-analyzer"
            element={(
              <ProtectedRoute roles={['candidate', 'admin']}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/afai"
            element={(
              <ProtectedRoute roles={['candidate', 'admin']}>
                <AFAISetup />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/afai/interview"
            element={(
              <ProtectedRoute roles={['candidate', 'admin']}>
                <AFAIInterview />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/afai/summary"
            element={(
              <ProtectedRoute roles={['candidate', 'admin']}>
                <AFAISummary />
              </ProtectedRoute>
            )}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
