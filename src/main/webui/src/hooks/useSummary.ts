import { useMemo } from 'react';
import { useApi } from './useApi';
import { ReportEndpointService as Reports, Report } from '../generated-client';

const PAGE_SIZE = 100;
export interface ReportsSummary {
  vulnerableReportsCount: number;
  nonVulnerableReportsCount: number;
  pendingRequestsCount: number;
  newReportsTodayCount: number;
}

export interface UseSummaryResult {
  summary: ReportsSummary;
  loading: boolean;
  error: Error | null;
  reports: Array<Report> | null;
}

/**
 * Hook to fetch reports and calculate summary statistics
 * @returns Object containing summary statistics, loading state, error, and reports
 */
export function useSummary(): UseSummaryResult {
  // Fetch all reports
  const { data: reports, loading, error } = useApi<Array<Report>>(() => 
    Reports.getApiV1Reports({ pageSize: PAGE_SIZE })
  );

  // Calculate summary statistics from reports
  const summary = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        vulnerableReportsCount: 0,
        nonVulnerableReportsCount: 0,
        pendingRequestsCount: 0,
        newReportsTodayCount: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let vulnerableReportsCount = 0;
    let nonVulnerableReportsCount = 0;
    let pendingRequestsCount = 0;
    let newReportsTodayCount = 0;

    reports.forEach((report) => {
      // Check if report is pending
      const isPending = report.state === 'pending' || 
                       report.state === 'queued' || 
                       report.state === 'sent';
      
      if (isPending) {
        pendingRequestsCount++;
        return;
      }

      // Check if report has vulnerabilities
      // Safely check for vulnerabilities with null-safe access
      const hasVulnerableCve = report.vulns?.some(
        (vuln) => vuln?.justification?.status === 'TRUE'
      ) ?? false;

      // Check if report is completed (has completedAt)
      const isCompleted = report.completedAt && report.completedAt.length > 0;

      if (isCompleted) {
        if (hasVulnerableCve) {
          vulnerableReportsCount++;
        } else {
          nonVulnerableReportsCount++;
        }

        // Check if completed today
        const completedDate = new Date(report.completedAt);
        if (completedDate >= today && completedDate < tomorrow) {
          newReportsTodayCount++;
        }
      }
    });

    return {
      vulnerableReportsCount,
      nonVulnerableReportsCount,
      pendingRequestsCount,
      newReportsTodayCount,
    };
  }, [reports]);

  return {
    summary,
    loading,
    error,
    reports,
  };
}

