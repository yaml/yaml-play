// In dev, Vite proxies /api to localhost. In production, hit sandbox directly.
const SANDBOX_URL = import.meta.env.DEV ? '/api' : 'https://localhost:7481';

// OAuth proxy URL - Cloudflare Worker in production, local sandbox in dev
// TODO: Replace with your actual Cloudflare Worker URL after deployment
const OAUTH_PROXY_URL = import.meta.env.PROD
  ? 'https://yaml-play-oauth.ingy.workers.dev'
  : `${SANDBOX_URL}/oauth`;

// Sandbox version - read from VERSION file at build time
const SANDBOX_VERSION = import.meta.env.VITE_SANDBOX_VERSION;

// Export for use in error messages
export function getRequiredSandboxVersion(): string {
  return SANDBOX_VERSION;
}

export interface SandboxResponse {
  status: number;
  output: string;
  versionMismatch?: {
    required: string;
    found: string;
  };
}

export async function checkSandboxAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${SANDBOX_URL}/`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function runParser(
  parserId: string,
  yamlText: string,
  _parserVersion: string
): Promise<SandboxResponse> {
  const url = `${SANDBOX_URL}/?version=${encodeURIComponent(SANDBOX_VERSION)}&parser=yaml-test-parse-${parserId}`;

  try {
    // Send as form data - sandbox expects request.form.get('text')
    const formData = new URLSearchParams();
    formData.append('text', yamlText);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      // Check if this is a version mismatch error (500 with specific message)
      const text = await response.text();
      const versionMatch = text.match(/Requires sandbox version (\S+)/);
      if (versionMatch) {
        return {
          status: -1,
          output: `Version mismatch: sandbox is ${versionMatch[1]}, but frontend requires ${SANDBOX_VERSION}`,
          versionMismatch: {
            required: SANDBOX_VERSION,
            found: versionMatch[1],
          },
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      output: data.output,
    };
  } catch (error) {
    // Check if this is already a SandboxResponse (from version mismatch handling above)
    if (error && typeof error === 'object' && 'versionMismatch' in error) {
      return error as SandboxResponse;
    }
    return {
      status: -1,
      output: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch available models from GitHub Models API
 */
export async function getGitHubModels(githubToken: string): Promise<{
  id: string;
  name: string;
  publisher: string;
}[]> {
  const url = `${SANDBOX_URL}/github-models`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub models: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub models:', error);
    return [];
  }
}

/**
 * Preview a test PR - generates test name and ID (or uses manual mode)
 */
export async function previewTestPR(data: {
  yaml: string;
  events: string;
  isError: boolean;
  model: string;  // GitHub Models ID or empty for manual mode
  githubToken: string;
  testName?: string;  // Optional: current test name for better similar test suggestions
  currentTags?: string[];  // Optional: current tags for better similar test suggestions
}): Promise<{
  testId: string;
  testName: string;
  tags: string[];
  preview: string;
  similarTests: Array<{ id: string; name: string; url: string }>;
  githubUsername: string | null;
  json: string | null;
  availableTags: string[];
  llmError?: string;
}> {
  const url = `${SANDBOX_URL}/preview-pr`;

  const formData = new URLSearchParams();
  formData.append('yaml', data.yaml);
  formData.append('events', data.events);
  formData.append('isError', data.isError ? 'true' : 'false');
  formData.append('model', data.model);
  formData.append('githubToken', data.githubToken);
  if (data.testName) {
    formData.append('testName', data.testName);
  }
  if (data.currentTags && data.currentTags.length > 0) {
    formData.append('currentTags', JSON.stringify(data.currentTags));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to preview PR: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Submit a test PR to yaml-test-suite
 */
export async function submitTestPR(data: {
  token: string;
  testId: string;
  testName: string;
  yaml: string;
  events: string;
  isError: boolean;
  similarTests: Array<{ id: string; name: string; url: string }>;
  tags: string[];
  from: string;
}): Promise<{ success: boolean; prUrl?: string; error?: string }> {
  const url = `${SANDBOX_URL}/submit-pr`;

  const formData = new URLSearchParams();
  formData.append('token', data.token);
  formData.append('testId', data.testId);
  formData.append('testName', data.testName);
  formData.append('yaml', data.yaml);
  formData.append('events', data.events);
  formData.append('isError', data.isError ? 'true' : 'false');
  formData.append('similarTests', JSON.stringify(data.similarTests));
  formData.append('tags', JSON.stringify(data.tags));
  formData.append('from', data.from);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to submit PR: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Device flow responses from GitHub
 */
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface DeviceTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

/**
 * Request a device code from GitHub (via OAuth proxy)
 * In production: uses Cloudflare Worker
 * In development: uses local sandbox server
 */
export async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
  const url = `${OAUTH_PROXY_URL}/device/code`;

  // In production (Cloudflare Worker), client_id is handled by the worker
  // In development (sandbox), we need to send client_id
  const formData = new URLSearchParams();
  if (import.meta.env.DEV) {
    formData.append('client_id', clientId);
    formData.append('scope', 'public_repo workflow');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: import.meta.env.DEV ? formData : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to request device code: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Poll for access token from GitHub (via OAuth proxy)
 * In production: uses Cloudflare Worker
 * In development: uses local sandbox server
 */
export async function pollDeviceToken(
  clientId: string,
  deviceCode: string
): Promise<DeviceTokenResponse> {
  const url = `${OAUTH_PROXY_URL}/device/token`;

  const formData = new URLSearchParams();
  formData.append('device_code', deviceCode);

  // In development (sandbox), we need to send client_id
  // In production (Cloudflare Worker), client_id is handled by the worker
  if (import.meta.env.DEV) {
    formData.append('client_id', clientId);
    formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to poll for token: ${response.statusText}`);
  }

  return await response.json();
}
