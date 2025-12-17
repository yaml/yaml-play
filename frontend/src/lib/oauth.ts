const GITHUB_TOKEN_KEY = 'github-token';
const GITHUB_USER_KEY = 'github-user';

// TODO: Replace 'YOUR_CLIENT_ID_HERE' with your actual GitHub OAuth App Client ID
// Create one at: https://github.com/settings/developers
// Or set via environment variable: VITE_GITHUB_CLIENT_ID
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liRrgge8JKovPTxm';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

/**
 * Store GitHub OAuth token in localStorage
 */
export function storeGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
}

/**
 * Get GitHub OAuth token from localStorage
 */
export function getGitHubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * Clear GitHub OAuth token from localStorage
 */
export function clearGitHubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY);
  localStorage.removeItem(GITHUB_USER_KEY);
}

/**
 * Store GitHub user info in localStorage
 */
export function storeGitHubUser(user: GitHubUser): void {
  localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
}

/**
 * Get GitHub user info from localStorage
 */
export function getGitHubUser(): GitHubUser | null {
  const userJson = localStorage.getItem(GITHUB_USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Fetch user info from GitHub API
 */
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name,
  };
}
