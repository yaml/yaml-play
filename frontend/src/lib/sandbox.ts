// In dev, Vite proxies /api to localhost. In production, hit sandbox directly.
const SANDBOX_URL = import.meta.env.DEV ? '/api' : 'https://localhost:7481';

// Sandbox version - the version of the yaml-play-sandbox Docker image
// This is different from individual parser versions
const SANDBOX_VERSION = import.meta.env.VITE_SANDBOX_VERSION || '0.1.33';

export interface SandboxResponse {
  status: number;
  output: string;
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      output: data.output,
    };
  } catch (error) {
    return {
      status: -1,
      output: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
