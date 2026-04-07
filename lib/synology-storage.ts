/**
 * Synology FileStation API Storage Helper
 *
 * Handles uploading and fetching files from Synology NAS via the built-in
 * FileStation API. Used as persistent backup storage to survive Hostinger
 * redeployments.
 *
 * Required environment variables:
 *   SYNOLOGY_URL       - e.g. https://waveswp.synology.me:5001
 *   SYNOLOGY_USERNAME  - DSM username
 *   SYNOLOGY_PASSWORD  - DSM password
 *   SYNOLOGY_FOLDER    - Shared folder path, e.g. /waves-uploads
 */

const getConfig = () => ({
  baseUrl: (process.env.SYNOLOGY_URL || '').replace(/\/$/, ''),
  username: process.env.SYNOLOGY_USERNAME || '',
  password: process.env.SYNOLOGY_PASSWORD || '',
  folder: process.env.SYNOLOGY_FOLDER || '/waves-uploads',
});

const isConfigured = (): boolean => {
  const { baseUrl, username, password } = getConfig();
  return !!(baseUrl && username && password);
};

// Session cache to avoid logging in on every request
let cachedSid: string | null = null;
let sidExpiry = 0;

/**
 * Login to Synology DSM and get a session ID (sid)
 */
async function getSid(): Promise<string | null> {
  // Return cached sid if still valid (cache for 55 minutes, sessions last 60)
  if (cachedSid && Date.now() < sidExpiry) {
    return cachedSid;
  }

  const { baseUrl, username, password } = getConfig();

  try {
    const params = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: username,
      passwd: password,
      session: 'WavesBackup',
      format: 'sid',
    });

    const res = await fetch(`${baseUrl}/webapi/auth.cgi?${params}`, {
      method: 'GET',
    });

    const data = await res.json();
    if (data.success && data.data?.sid) {
      cachedSid = data.data.sid;
      sidExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
      console.log('[Synology] Login successful');
      return cachedSid;
    }

    console.error('[Synology] Login failed:', data.error);
    cachedSid = null;
    return null;
  } catch (error) {
    console.error('[Synology] Login error:', error);
    cachedSid = null;
    return null;
  }
}

/**
 * Upload a file to Synology via FileStation Upload API
 */
export async function uploadToSynology(fileName: string, buffer: Buffer): Promise<boolean> {
  if (!isConfigured()) {
    console.warn('[Synology] Not configured, skipping backup upload');
    return false;
  }

  const sid = await getSid();
  if (!sid) return false;

  const { baseUrl, folder } = getConfig();

  try {
    // Build multipart form data manually for Node.js fetch
    const boundary = '----WavesUpload' + Date.now();
    const folderPath = folder.replace(/\/$/, '');

    const preamble = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="api"',
      '',
      'SYNO.FileStation.Upload',
      `--${boundary}`,
      'Content-Disposition: form-data; name="version"',
      '',
      '2',
      `--${boundary}`,
      'Content-Disposition: form-data; name="method"',
      '',
      'upload',
      `--${boundary}`,
      'Content-Disposition: form-data; name="_sid"',
      '',
      sid,
      `--${boundary}`,
      'Content-Disposition: form-data; name="path"',
      '',
      folderPath,
      `--${boundary}`,
      'Content-Disposition: form-data; name="create_parents"',
      '',
      'true',
      `--${boundary}`,
      'Content-Disposition: form-data; name="overwrite"',
      '',
      'true',
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      'Content-Type: application/octet-stream',
      '',
      '',
    ].join('\r\n');

    const epilogue = `\r\n--${boundary}--\r\n`;

    const preambleBuffer = Buffer.from(preamble, 'utf-8');
    const epilogueBuffer = Buffer.from(epilogue, 'utf-8');
    const body = Buffer.concat([preambleBuffer, buffer, epilogueBuffer]);

    const response = await fetch(`${baseUrl}/webapi/entry.cgi`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    });

    const data = await response.json();
    if (data.success) {
      console.log(`[Synology] Backup uploaded: ${fileName}`);
      return true;
    }

    // Error 414 = path already exists (file exists) — treat as success
    if (data.error?.code === 414) {
      console.log(`[Synology] File already exists, overwritten: ${fileName}`);
      return true;
    }

    console.error(`[Synology] Upload failed:`, data.error);
    // If auth error, clear cached sid so next attempt re-authenticates
    if (data.error?.code === 119 || data.error?.code === 105) {
      cachedSid = null;
      sidExpiry = 0;
    }
    return false;
  } catch (error) {
    console.error('[Synology] Upload error:', error);
    return false;
  }
}

/**
 * Fetch a file from Synology via FileStation Download API
 * Returns the file buffer or null if not found
 */
export async function fetchFromSynology(fileName: string): Promise<Buffer | null> {
  if (!isConfigured()) {
    return null;
  }

  const sid = await getSid();
  if (!sid) return null;

  const { baseUrl, folder } = getConfig();
  const filePath = `${folder.replace(/\/$/, '')}/${fileName}`;

  try {
    const params = new URLSearchParams({
      api: 'SYNO.FileStation.Download',
      version: '2',
      method: 'download',
      path: filePath,
      mode: 'download',
      _sid: sid,
    });

    const response = await fetch(`${baseUrl}/webapi/entry.cgi?${params}`, {
      method: 'GET',
    });

    // FileStation returns the raw file bytes on success
    // On error, it returns JSON with { success: false }
    const contentType = response.headers.get('content-type') || '';

    if (response.ok && !contentType.includes('application/json')) {
      const arrayBuffer = await response.arrayBuffer();
      console.log(`[Synology] Fetched from backup: ${fileName}`);
      return Buffer.from(arrayBuffer);
    }

    // If JSON response, it's an error
    try {
      const data = await response.json();
      if (data.error?.code === 408) {
        // 408 = file not found
        return null;
      }
      console.error(`[Synology] Fetch failed:`, data.error);
      if (data.error?.code === 119 || data.error?.code === 105) {
        cachedSid = null;
        sidExpiry = 0;
      }
    } catch {
      // Not JSON — unknown error
    }

    return null;
  } catch (error) {
    console.error('[Synology] Fetch error:', error);
    return null;
  }
}

/**
 * Check if Synology storage is configured and reachable
 */
export async function checkSynologyConnection(): Promise<boolean> {
  if (!isConfigured()) {
    return false;
  }

  const sid = await getSid();
  return !!sid;
}
