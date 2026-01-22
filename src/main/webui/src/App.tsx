import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import ReportPage from "./pages/ReportPage";
import RepositoryReportPage from "./pages/RepositoryReportPage";

/**
 * App component - provides router context and defines all application routes
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route
            path="/reports/product/:productId/:cveId/:reportId"
            element={<RepositoryReportPage />}
          />
          <Route path="/reports/product/:productId/:cveId" element={<ReportPage />} />
          <Route
            path="/reports/component/:cveId/:reportId"
            element={<RepositoryReportPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
