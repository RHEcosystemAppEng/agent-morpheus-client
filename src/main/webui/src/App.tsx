// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import ReportPage from "./pages/ReportPage";
import ExcludedComponentsPage from "./pages/ExcludedComponentsPage";
import RepositoryReportPage from "./pages/RepositoryReportPage";
import CveDetailsPage from "./pages/CveDetailsPage";

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
          <Route path="/reports/single-repositories" element={<ReportsPage />} />
          <Route
            path="/reports/product/:productId/:cveId/:reportId"
            element={<RepositoryReportPage />}
          />
          <Route
            path="/reports/product/excluded-components/:productId/:cveId"
            element={<ExcludedComponentsPage />}
          />
          <Route
            path="/reports/product/:productId/:cveId"
            element={<ReportPage />}
          />
          <Route
            path="/reports/component/:cveId/:reportId"
            element={<RepositoryReportPage />}
          />
          <Route
            path="/reports/product/cve/:productId/:cveId/:reportId"
            element={<CveDetailsPage />}
          />
          <Route
            path="/reports/component/cve/:cveId/:reportId"
            element={<CveDetailsPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
