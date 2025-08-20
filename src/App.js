import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    // Check if we're on the dashboard route
    if (window.location.pathname === '/dashboard') {
      setCurrentPage('dashboard');
    }
  }, []);

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/dashboard');
  };

  const handleNavigateToLanding = () => {
    setCurrentPage('landing');
    window.history.pushState({}, '', '/');
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/dashboard') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPage === 'dashboard') {
    return <Dashboard onNavigateToLanding={handleNavigateToLanding} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header onTryNotebook={handleNavigateToDashboard} />
      <Hero onGetStarted={handleNavigateToDashboard} />
      <Features />
      <HowItWorks onStartUsing={handleNavigateToDashboard} />
      <Footer />
    </div>
  );
}

export default App;
