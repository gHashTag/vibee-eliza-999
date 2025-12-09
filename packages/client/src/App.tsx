import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // ✅ После аутентификации показываем полноценный ElizaOS Dashboard
  return (
    <div id="root" className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">🤖 ElizaOS Dashboard</h1>
            <span className="text-gray-400">•</span>
            <span className="text-green-400">✓ Авторизован</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">
              {user?.first_name} {user?.last_name}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                window.location.reload();
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Загруженные агенты</h2>
          <p className="text-gray-400">
            Ваши ИИ-агенты готовы к работе и ждут команд
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Виби Агент */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                🦄
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Виби Агент</h3>
                <p className="text-sm text-gray-400">Наставник по разработке</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              ИИ-наставник для изучения современной разработки. Специализируется на React, TypeScript, Node.js
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400">● Активен</span>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                Начать чат
              </button>
            </div>
          </div>

          {/* Колс Агент */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-2xl">
                📸
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Kols Agent</h3>
                <p className="text-sm text-gray-400">SMM и контент</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Помогает создавать viral контент и вести социальные сети
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400">● Активен</span>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                Начать чат
              </button>
            </div>
          </div>

          {/* NeuroPhoto Агент */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-2xl">
                🎨
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">NeuroPhoto</h3>
                <p className="text-sm text-gray-400">Генерация изображений</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Создание и обработка изображений с помощью ИИ. 7 различных моделей
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400">● Активен</span>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                Создать
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Системная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">3</div>
              <div className="text-sm text-gray-400">Загруженных агентов</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">4000</div>
              <div className="text-sm text-gray-400">Порт сервера</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-sm text-gray-400">Работоспособность</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Быстрые действия</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
              ➕ Добавить агента
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              📁 Управление проектами
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              ⚙️ Настройки
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              📈 Аналитика
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
