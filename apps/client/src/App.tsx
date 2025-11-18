import React, { useState } from 'react';
import { useAuth } from './lib/AuthContext';
import Auth from './pages/Auth';
import AppLayout from './Components/AppLayout';
import Dashboard from './Components/Dashboard/Dashboard';
import Analytics from './Components/analytics/Analytics';
import Uren from './Components/uren/Uren';
import Facturen from './Components/facturen/Facturen';
import Budget from './Components/budget/Budget';
import Ideas from './Components/ideas/Ideas';
import Taken from './Components/taken/Taken';
import Health from './Components/health/Health';
import Abonnementen from './Components/abonnementen/Abonnementen';
import TeKopen from './Components/te-kopen/TeKopen';
import Affirmations from './Components/Affirmations/Affirmations';
import MijnKeuken from './Components/eten';
import Boodschappen from './Components/eten/pages/Boodschappen';

type Page = "home" | "analytics" | "uren" | "budget" | "taken" | "ideas" | "health" | "abonnementen" | "tekopen" | "affirmaties" | "facturen" | "eten" | "boodschappen";

function App() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("home");


  // Loading state
  if (loading) {
    console.log('→ Showing LOADING screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] to-[#1D3A5C]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-white text-lg">Laden...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show Auth page
  if (!user) {
    console.log('→ Showing AUTH page (no user)');
    return <Auth />;
  }

  console.log('→ Showing DASHBOARD (user logged in)');

  // Logged in - show app
  const handleLogout = async () => {
    if (confirm('Weet je zeker dat je wilt uitloggen?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Logout error:', error);
        alert('Fout bij uitloggen');
      }
    }
  };

  return (
    <AppLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {currentPage === "home" && <Dashboard />}
      {currentPage === "analytics" && <Analytics />}
      {currentPage === "uren" && <Uren />}
      {currentPage === "facturen" && <Facturen />}
      {currentPage === "budget" && <Budget />}
      {currentPage === "ideas" && <Ideas />}
      {currentPage === "taken" && <Taken />}
      {currentPage === "affirmaties" && <Affirmations />}
      {currentPage === "health" && <Health />}
      {currentPage === "eten" && <MijnKeuken />}
      {currentPage === "boodschappen" && <Boodschappen />}
      {currentPage === "abonnementen" && <Abonnementen />}
      {currentPage === "tekopen" && <TeKopen />}
    </AppLayout>
  );
}

export default App;