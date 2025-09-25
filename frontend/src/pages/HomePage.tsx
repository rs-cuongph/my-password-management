import React from 'react';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';

const HomePage: React.FC = () => {
  const { theme, language, setTheme, setLanguage } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();

  const techStack = [
    'React 19',
    'Vite',
    'Tailwind CSS',
    'Tanstack Query',
    'Tanstack Router',
    'Zustand',
    'Valibot'
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Vibe Kanban
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Modern React Application với các tech stack hiện đại
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {isAuthenticated
                  ? `Chào mừng, ${user?.name || 'User'}!`
                  : 'Chào mừng đến với ứng dụng React 19!'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Ứng dụng của bạn đã được setup với các tech stack hiện đại nhất.
              </p>
            </div>

            {/* Tech Stack Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tech) => (
                <div
                  key={tech}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-lg text-center text-sm font-semibold"
                >
                  {tech}
                </div>
              ))}
            </div>

            {/* Theme & Language Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Theme:</label>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                  }`}
                >
                  {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Language:</label>
                <button
                  onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                  className="px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded text-sm font-medium transition-colors"
                >
                  {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                </button>
              </div>
            </div>

            {/* Auth Status */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                isAuthenticated
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isAuthenticated ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                {isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105">
                Bắt đầu sử dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
