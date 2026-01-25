/**
 * Authentication hook for user information and logout
 * Integrates with Quarkus OIDC backend authentication
 */

import { useApi } from './useApi';

export interface UserInfo {
  name: string;
}

/**
 * Hook to get current user information from the backend
 * The backend extracts user info from OIDC UserInfo (email, upn, or metadata.name)
 * 
 * @returns User information with loading and error states
 * 
 * @example
 * ```tsx
 * const { data: userInfo, loading, error } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Alert>Failed to load user</Alert>;
 * return <div>Hello, {userInfo?.name}</div>;
 * ```
 */
export function useAuth() {
  const { data, loading, error } = useApi<UserInfo>(
    async () => {
      const response = await fetch('/api/v1/user', {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        // If unauthorized, the user needs to login (redirect handled by Quarkus)
        if (response.status === 401) {
          throw new Error('Unauthorized - redirecting to login');
        }
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }

      return response.json();
    }
  );

  return {
    userInfo: data,
    loading,
    error,
    userName: data?.name || 'Loading...',
  };
}

/**
 * Logout function that triggers backend logout endpoint
 * The backend returns HTML with Clear-Site-Data header to clear cookies/storage
 */
export async function logout(): Promise<void> {
  // Create a form and submit it to trigger the logout endpoint
  // This ensures cookies are cleared via Clear-Site-Data header
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/v1/user/logout';
  document.body.appendChild(form);
  form.submit();
}
