import { useState, useEffect, useCallback } from 'react';
import { requestDeviceCode, pollDeviceToken, getGitHubModels } from '../lib/sandbox';
import {
  GITHUB_CLIENT_ID,
  GitHubUser,
  getGitHubToken,
  getGitHubUser,
  storeGitHubToken,
  storeGitHubUser,
  clearGitHubToken,
  fetchGitHubUser,
} from '../lib/oauth';

export interface DeviceFlowData {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  interval: number;
}

export interface UseGitHubAuthReturn {
  user: GitHubUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<DeviceFlowData | null>;
  waitForAuth: (deviceCode: string, interval: number) => Promise<void>;
  logout: () => void;
}

async function setDefaultModelIfNeeded(token: string): Promise<void> {
  // Only set default if no model is currently selected
  const existingModel = localStorage.getItem('github-model');
  if (existingModel) return;

  try {
    const models = await getGitHubModels(token);
    const defaultModel = models.find(m => m.name === 'Llama-3.3-70B-Instruct');
    if (defaultModel) {
      localStorage.setItem('github-model', defaultModel.id);
      localStorage.setItem('github-model-name', `${defaultModel.publisher}/${defaultModel.name}`);
    }
  } catch (error) {
    console.error('Failed to set default model:', error);
  }
}

export function useGitHubAuth(): UseGitHubAuthReturn {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getGitHubToken();
      const cachedUser = getGitHubUser();

      if (token && cachedUser) {
        // We have a token and cached user - validate token is still good
        try {
          const freshUser = await fetchGitHubUser(token);
          setUser(freshUser);
          storeGitHubUser(freshUser); // Update cache
        } catch (err) {
          // Token is invalid, clear it
          clearGitHubToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Initiate device flow login
   */
  const login = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const deviceCodeResponse = await requestDeviceCode(GITHUB_CLIENT_ID);

      return {
        userCode: deviceCodeResponse.user_code,
        verificationUri: deviceCodeResponse.verification_uri,
        deviceCode: deviceCodeResponse.device_code,
        interval: deviceCodeResponse.interval,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start OAuth flow';
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Poll for authentication completion
   */
  const waitForAuth = useCallback(async (deviceCode: string, interval: number) => {
    const pollInterval = interval * 1000; // Convert to milliseconds
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setError('Authentication timeout - please try again');
        setIsLoading(false);
        return;
      }

      attempts++;

      try {
        const tokenResponse = await pollDeviceToken(GITHUB_CLIENT_ID, deviceCode);

        if (tokenResponse.access_token) {
          // Success! We have the token
          const token = tokenResponse.access_token;
          storeGitHubToken(token);

          // Fetch user info
          const userInfo = await fetchGitHubUser(token);
          setUser(userInfo);
          storeGitHubUser(userInfo);

          // Set default model if none is selected
          await setDefaultModelIfNeeded(token);

          setIsLoading(false);
          return;
        }

        if (tokenResponse.error === 'authorization_pending') {
          // User hasn't authorized yet, keep polling
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return poll();
        }

        if (tokenResponse.error === 'slow_down') {
          // GitHub asks us to slow down
          await new Promise((resolve) => setTimeout(resolve, pollInterval + 5000));
          return poll();
        }

        if (tokenResponse.error) {
          // Some other error occurred
          setError(tokenResponse.error_description || tokenResponse.error);
          setIsLoading(false);
          return;
        }

        // Unexpected response, keep trying
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Polling failed';
        setError(message);
        setIsLoading(false);
      }
    };

    await poll();
  }, []);

  /**
   * Log out and clear token
   */
  const logout = useCallback(() => {
    clearGitHubToken();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    waitForAuth,
    logout,
  };
}
