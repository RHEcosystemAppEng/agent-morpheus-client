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

import type { Report } from "../generated-client/models/Report";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useTableParams } from "../hooks/useTableParams";
import {
  REPOSITORY_REPORTS_VALID_SORT_COLUMNS,
  REPOSITORY_REPORTS_VALID_FILTER_KEYS,
} from "../hooks/repositoryReportsTableParams";
import { useRepositoryReports } from "../hooks/useRepositoryReports";

function getCveIdForReport(report: Report): string | undefined {
  return report.vulns?.[0]?.vulnId;
}

const SingleRepositoriesTable: React.FC = () => {
  const params = useTableParams({
    validSortColumns: REPOSITORY_REPORTS_VALID_SORT_COLUMNS,
    validFilterKeys: REPOSITORY_REPORTS_VALID_FILTER_KEYS,
  });

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useRepositoryReports({
    tableData: params.data,
  });

  const getViewPath = (report: Report) => {
    const cveId = getCveIdForReport(report);
    return cveId
      ? `/reports/component/${cveId}/${report.scanId}`
      : "/reports/single-repositories";
  };

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableParams={params}
      getViewPath={getViewPath}
      showCveIdColumn={true}
      ariaLabel="Single repositories table"
    />
  );
};

export default SingleRepositoriesTable;
