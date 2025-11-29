// In dev, Vite proxies /api to localhost. In production, hit sandbox directly.
const SANDBOX_URL = import.meta.env.DEV ? '/api' : 'https://localhost:7481';

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
