import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header = ({ onTryNotebook }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-blue-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left corner - Website name */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nooto
            </h1>
          </div>

          {/* Right corner - Theme toggle and Try NoteBook button */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={onTryNotebook}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try Nooto
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
