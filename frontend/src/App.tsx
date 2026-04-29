import React from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { EnumeratorDashboard } from './components/EnumeratorDashboard';
import { UpdateModal } from './components/UpdateModal';
import { Auth } from './pages/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useVersionCheck } from './hooks/useVersionCheck';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { updateInfo, isUpdateModalOpen, closeUpdateModal, dismissUpdate } = useVersionCheck();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show consolidated auth pages if not authenticated
  if (!isAuthenticated) {
    return <Auth initialPage="login" />;
  }

  // Main app content for authenticated users
  return (
    <div className="App">
      {/* Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        updateInfo={updateInfo}
        onClose={closeUpdateModal}
        onDismiss={dismissUpdate}
      />

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
