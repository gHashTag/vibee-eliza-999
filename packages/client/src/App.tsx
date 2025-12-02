import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ElizaOSDashboard from './components/ElizaOSDashboard';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div id="root" className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div id="root">
        <LoginPage />
      </div>
    );
  }

  // After authentication, show ElizaOS Dashboard
  return <ElizaOSDashboard />;
}
