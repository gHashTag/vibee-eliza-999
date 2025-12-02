import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Simple SPA router - listen to popstate
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    // Override pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setCurrentPath(window.location.pathname);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setCurrentPath(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Simple navigation function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login
  if (!user) {
    return <LoginPage />;
  }

  // Simple routing
  if (currentPath === '/login') {
    return <LoginPage />;
  }

  // Default to dashboard
  return (
    <div>
      {/* Navigation bar */}
      <nav className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className="text-yellow-500 font-bold text-xl"
            >
              VIBEE
            </button>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-2 rounded-md ${currentPath === '/' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Главная
              </button>
              <button
                onClick={() => navigate('/login')}
                className={`px-3 py-2 rounded-md ${currentPath === '/login' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Вход
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">{user?.first_name || 'User'}</span>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
              Выйти
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <DashboardPage />
    </div>
  );
}
