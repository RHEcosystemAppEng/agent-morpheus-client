import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';

/**
 * App component - provides router context and defines all application routes
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

