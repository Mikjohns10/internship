import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { refreshToken, getMe } from '../api/auth.api';

/**
 * Hook to manage authentication state on app load.
 * Attempts to refresh the access token from the HttpOnly cookie.
 */
export function useAuth() {
  const { setAuth, clearAuth, setLoading, isAuthenticated, user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('accessToken');

      if (!storedToken) {
        clearAuth();
        setInitialized(true);
        return;
      }

      try {
        // Try to get user profile with existing token
        const userData = await getMe();
        setAuth(userData, storedToken);
      } catch {
        // Token might be expired, try refresh
        try {
          const data = await refreshToken();
          setAuth(data.user, data.accessToken);
        } catch {
          clearAuth();
        }
      }

      setInitialized(true);
    };

    init();
  }, []);

  return { isAuthenticated, user, initialized };
}
