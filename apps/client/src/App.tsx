import React, { useState } from 'react';
import AppLayout from './Components/AppLayout';
import Dashboard from './Components/Dashboard/Dashboard';
import Analytics from './Components/analytics/Analytics';
import Uren from './Components/uren/Uren';
import Invoices from './Components/invoices/Invoices';
import Budget from './Components/budget/Budget';
import Ideas from './Components/ideas/Ideas';
import Taken from './Components/taken/Taken';
import Health from './Components/health/Health';
import Abonnementen from './Components/abonnementen/Abonnementen';
import TeKopen from './Components/te-kopen/TeKopen';
import Affirmations from './Components/Affirmations/Affirmations';

type Page = "home" | "analytics" | "uren" | "budget" | "taken" | "ideas" | "health" | "abonnementen" | "tekopen" | "affirmaties" | "facturen";

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
      {currentPage === "home" && <Dashboard />}
      {currentPage === "analytics" && <Analytics />}
      {currentPage === "uren" && <Uren />}
      {currentPage === "facturen" && <Invoices />}
      {currentPage === "budget" && <Budget />}
      {currentPage === "ideas" && <Ideas />}
      {currentPage === "taken" && <Taken />}
      {currentPage === "affirmaties" && <Affirmations />}
      {currentPage === "health" && <Health />}
      {currentPage === "abonnementen" && <Abonnementen />}
      {currentPage === "tekopen" && <TeKopen />}
    </AppLayout>
  );
}

export default App;
