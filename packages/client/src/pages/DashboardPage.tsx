import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2">VIBEE</h1>
          <p className="text-gray-400">Панель управления агентами</p>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Активные агенты</h3>
            <p className="text-3xl font-bold text-yellow-500">0</p>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Всего сообщений</h3>
            <p className="text-3xl font-bold text-blue-400">0</p>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Успешных операций</h3>
            <p className="text-3xl font-bold text-green-400">0</p>
          </div>
        </div>

        {/* Действия */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-4 rounded-lg transition-colors">
              Создать агента
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Загрузить персонажа
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Настройки
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Документация
            </button>
          </div>
        </div>

        {/* Логи */}
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Последняя активность</h2>
          <div className="space-y-2 text-gray-400">
            <p>• Система успешно запущена</p>
            <p>• Ожидание команд...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
