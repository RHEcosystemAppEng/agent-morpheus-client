/**
 * Hook to fetch user comments for a vulnerability
 */

import { useApi } from './useApi';
import { VulnerabilityEndpointService } from '../generated-client/services/VulnerabilityEndpointService';

/**
 * Hook to fetch user comments for a specific vulnerability
 * @param vulnId - The vulnerability ID (CVE ID)
 * @returns Object with comments (string), loading state, and error state
 */
export function useVulnComments(vulnId: string | undefined) {
  const { data: comments, loading, error } = useApi<string>(
    () => {
      if (!vulnId) {
        return Promise.resolve('');
      }
      return VulnerabilityEndpointService.getApiVulnerabilitiesComments({
        vulnId,
      });
    },
    { deps: [vulnId], immediate: !!vulnId }
  );

  return {
    comments: comments || '',
    loading,
    error,
  };
}

