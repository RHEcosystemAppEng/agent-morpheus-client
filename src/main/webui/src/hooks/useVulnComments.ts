/**
 * Hook to fetch user comments for a vulnerability
 */


/**
 * Hook to fetch user comments for a specific vulnerability
 * @param vulnId - The vulnerability ID (CVE ID)
 * @returns Object with comments (string), loading state, and error state
 */
export function useVulnComments(_vulnId: string | undefined) {
  return {
    comments: '',
    loading: false,
    error: null,
  };
}

