import React from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { EnumeratorDashboard } from './components/EnumeratorDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { Auth } from './pages/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  // Show loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show consolidated auth pages if not authenticated
  if (!isAuthenticated) {
    return <Auth initialPage="login" />;
  }

  // Main app content for authenticated users
  return (
    <div className="App">
      {/* Admin Dashboard */}
      {isAdmin && <AdminDashboard />}
      
      {/* Enumerator Dashboard */}
      {!isAdmin && <EnumeratorDashboard />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
