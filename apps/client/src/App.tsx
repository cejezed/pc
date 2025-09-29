import React, { useState } from 'react';
import AppLayout from './components/AppLayout';
import Analytics from './components/analytics/Analytics';
import Uren from './components/uren/Uren';
import Budget from './components/budget/Budget';
import Ideas from './components/ideas/Ideas';
import Taken from './components/taken/Taken';
import Health from './components/health/Health';
import Abonnementen from './components/abonnementen/Abonnementen';
import TeKopen from './components/te-kopen/TeKopen';

type Page = "home" | "analytics" | "uren" | "budget" | "taken" | "ideas" | "health" | "abonnementen" | "tekopen";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const handleLogout = async () => {
    // TODO: Implementeer Supabase logout
    console.log("Logging out...");
    alert("Logout functionaliteit komt hier");
  };

  return (
    <AppLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {/* Home Page */}
      {currentPage === "home" && (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-brikx-dark mb-2">Dashboard</h1>
            <p className="text-gray-600">Welkom terug! Kies een sectie om te beginnen.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Welcome Card */}
            <div className="card-brikx-dark">
              <h2 className="text-lg font-semibold mb-2">👋 Goedemorgen!</h2>
              <p className="text-gray-200 text-sm">
                Je dashboard is gereed voor gebruik.
              </p>
            </div>

            {/* Quick Links */}
            <button
              onClick={() => setCurrentPage("analytics")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                📊 Analytics
              </h3>
              <p className="text-sm text-gray-600">Bekijk je statistieken</p>
            </button>

            <button
              onClick={() => setCurrentPage("uren")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                ⏰ Uren
              </h3>
              <p className="text-sm text-gray-600">Registreer je gewerkte uren</p>
            </button>

            <button
              onClick={() => setCurrentPage("budget")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                💰 Budget
              </h3>
              <p className="text-sm text-gray-600">Beheer je financiën</p>
            </button>

            <button
              onClick={() => setCurrentPage("taken")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                ✅ Taken
              </h3>
              <p className="text-sm text-gray-600">Beheer je taken en to-do's</p>
            </button>

            <button
              onClick={() => setCurrentPage("ideas")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                💡 Ideeën
              </h3>
              <p className="text-sm text-gray-600">Bewaar je ideeën</p>
            </button>

            <button
              onClick={() => setCurrentPage("health")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                ❤️ Health
              </h3>
              <p className="text-sm text-gray-600">Track je gezondheid</p>
            </button>

            <button
              onClick={() => setCurrentPage("abonnementen")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                💳 Abonnementen
              </h3>
              <p className="text-sm text-gray-600">Beheer subscriptions</p>
            </button>

            <button
              onClick={() => setCurrentPage("tekopen")}
              className="card-brikx-interactive"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brikx-teal transition-colors">
                🛒 Te kopen
              </h3>
              <p className="text-sm text-gray-600">Je shopping lijst</p>
            </button>
          </div>
        </div>
      )}

      {/* Other Pages */}
      {currentPage === "analytics" && <Analytics />}
      {currentPage === "uren" && <Uren />}
      {currentPage === "budget" && <Budget />}
      {currentPage === "ideas" && <Ideas />}
      {currentPage === "taken" && <Taken />}
      {currentPage === "health" && <Health />}
      {currentPage === "abonnementen" && <Abonnementen />}
      {currentPage === "tekopen" && <TeKopen />}
    </AppLayout>
  );
}

export default App;