import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlanDashboard from './PlanDashboard';
import ValidatorPage from './ValidatorPage';
import NavBar from './NavBar'; // 引用 NavBar.jsx
import './App.css';

function App() {
  return (
    <Router>
      <NavBar /> {/* 使用從 NavBar.jsx 匯入的 NavBar */}
      <Routes>
        <Route path="/" element={<PlanDashboard />} />
        <Route path="/validator" element={<ValidatorPage />} />
      </Routes>
    </Router>
  );
}

export default App;