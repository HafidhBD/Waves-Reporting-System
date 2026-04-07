import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const config = {
      url: process.env.SYNOLOGY_URL || '(not set)',
      username: process.env.SYNOLOGY_USERNAME || '(not set)',
      password: process.env.SYNOLOGY_PASSWORD ? '***set***' : '(not set)',
      folder: process.env.SYNOLOGY_FOLDER || '(not set)',
    };

    const results: any = { config, steps: [] };

    // Step 1: Test if Synology URL is reachable
    const baseUrl = (process.env.SYNOLOGY_URL || '').replace(/\/$/, '');
    if (!baseUrl) {
      results.steps.push({ step: 'URL Check', status: 'FAIL', message: 'SYNOLOGY_URL not set' });
      return NextResponse.json(results);
    }

    try {
      const pingRes = await fetch(`${baseUrl}/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      const pingData = await pingRes.json();
      results.steps.push({
        step: 'Reachability',
        status: pingData.success ? 'OK' : 'FAIL',
        data: pingData.success ? 'Synology API reachable' : pingData,
      });
    } catch (err: any) {
      results.steps.push({
        step: 'Reachability',
        status: 'FAIL',
        message: err.message || String(err),
      });
      return NextResponse.json(results);
    }

    // Step 2: Test login
    const username = process.env.SYNOLOGY_USERNAME || '';
    const password = process.env.SYNOLOGY_PASSWORD || '';

    try {
      // Try multiple auth API versions (some DSM versions only support certain versions)
      let loginData: any = null;
      let loginSuccess = false;
      const authVersions = ['3', '6', '7'];
      const authEndpoints = ['/webapi/auth.cgi', '/webapi/entry.cgi'];

      for (const endpoint of authEndpoints) {
        if (loginSuccess) break;
        for (const ver of authVersions) {
          if (loginSuccess) break;
          try {
            const loginParams = new URLSearchParams({
              api: 'SYNO.API.Auth',
              version: ver,
              method: 'login',
              account: username,
              passwd: password,
              session: 'WavesTest',
              format: 'sid',
            });

            const loginRes = await fetch(`${baseUrl}${endpoint}?${loginParams}`, {
              method: 'GET',
              signal: AbortSignal.timeout(10000),
            });
            loginData = await loginRes.json();

            if (loginData.success && loginData.data?.sid) {
              loginSuccess = true;
              results.steps.push({
                step: 'Login',
                status: 'OK',
                sid: loginData.data.sid.substring(0, 8) + '...',
                workedWith: `${endpoint} v${ver}`,
              });
            } else {
              results.steps.push({
                step: `Login attempt (${endpoint} v${ver})`,
                status: 'FAIL',
                errorCode: loginData.error?.code,
                message: getAuthErrorMessage(loginData.error?.code),
              });
            }
          } catch (err: any) {
            results.steps.push({
              step: `Login attempt (${endpoint} v${ver})`,
              status: 'FAIL',
              message: err.message,
            });
          }
        }
      }

      if (loginSuccess && loginData?.data?.sid) {
        const sid = loginData.data.sid;
        const folder = process.env.SYNOLOGY_FOLDER || '/waves-uploads';

        // Step 3: Test folder listing
        try {
          const listParams = new URLSearchParams({
            api: 'SYNO.FileStation.List',
            version: '2',
            method: 'list_share',
            _sid: sid,
          });
          const listRes = await fetch(`${baseUrl}/webapi/entry.cgi?${listParams}`, {
            method: 'GET',
            signal: AbortSignal.timeout(10000),
          });
          const listData = await listRes.json();

          if (listData.success) {
            const shares = listData.data?.shares?.map((s: any) => s.path) || [];
            results.steps.push({ step: 'List Shares', status: 'OK', shares });

            const folderExists = shares.some((s: string) => s === folder);
            results.steps.push({
              step: 'Folder Check',
              status: folderExists ? 'OK' : 'FAIL',
              message: folderExists ? `Folder "${folder}" exists` : `Folder "${folder}" NOT found. Available: ${shares.join(', ')}`,
            });
          } else {
            results.steps.push({ step: 'List Shares', status: 'FAIL', data: listData.error });
          }
        } catch (err: any) {
          results.steps.push({ step: 'List Shares', status: 'FAIL', message: err.message });
        }

        // Step 4: Test upload with a tiny test file
        try {
          const testFileName = '_waves_test.txt';
          const testContent = Buffer.from('Waves test ' + new Date().toISOString());
          const boundary = '----WavesTest' + Date.now();
          const folderPath = folder.replace(/\/$/, '');

          const preamble = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="api"',
            '', 'SYNO.FileStation.Upload',
            `--${boundary}`,
            'Content-Disposition: form-data; name="version"',
            '', '2',
            `--${boundary}`,
            'Content-Disposition: form-data; name="method"',
            '', 'upload',
            `--${boundary}`,
            'Content-Disposition: form-data; name="_sid"',
            '', sid,
            `--${boundary}`,
            'Content-Disposition: form-data; name="path"',
            '', folderPath,
            `--${boundary}`,
            'Content-Disposition: form-data; name="create_parents"',
            '', 'true',
            `--${boundary}`,
            'Content-Disposition: form-data; name="overwrite"',
            '', 'true',
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${testFileName}"`,
            'Content-Type: text/plain',
            '', '',
          ].join('\r\n');

          const epilogue = `\r\n--${boundary}--\r\n`;
          const body = Buffer.concat([
            Buffer.from(preamble, 'utf-8'),
            testContent,
            Buffer.from(epilogue, 'utf-8'),
          ]);

          const uploadRes = await fetch(`${baseUrl}/webapi/entry.cgi`, {
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': String(body.length),
            },
            body,
            signal: AbortSignal.timeout(15000),
          });

          const uploadData = await uploadRes.json();
          results.steps.push({
            step: 'Test Upload',
            status: uploadData.success ? 'OK' : 'FAIL',
            data: uploadData.success ? 'Test file uploaded successfully!' : uploadData.error,
          });
        } catch (err: any) {
          results.steps.push({ step: 'Test Upload', status: 'FAIL', message: err.message });
        }

        // Logout test session
        try {
          await fetch(`${baseUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=logout&session=WavesTest&_sid=${sid}`);
        } catch { /* ignore */ }

      } else {
        results.steps.push({
          step: 'Login Summary',
          status: 'FAIL',
          message: 'All login attempts failed. See individual attempts above.',
        });
      }
    } catch (err: any) {
      results.steps.push({ step: 'Login', status: 'FAIL', message: err.message });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getAuthErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    400: 'No such account or incorrect password',
    401: 'Account disabled',
    402: 'Permission denied',
    403: 'Two-factor authentication required',
    404: 'Two-factor authentication failed',
    406: 'OTP enforcement required',
    407: 'Max login tries exceeded',
    408: 'Account locked',
    409: 'Account expired',
    410: 'Password expired',
    411: 'IP blocked',
  };
  return messages[code] || `Unknown error code: ${code}`;
}
