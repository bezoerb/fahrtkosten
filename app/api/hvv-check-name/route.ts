import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function createSignature(requestBody: object): string {
  const hmac = createHmac('sha1', process.env.HVV_PASSWORD!);
  hmac.update(JSON.stringify(requestBody));
  return hmac.digest('base64');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  const body = {
    version: 49,
    theName: {
      name: query,
      type: 'UNKNOWN',
    },
    coordinateType: 'EPSG_4326' as const,
    allowTypeSwitch: true,
  };

  const response = await fetch('https://gti.geofox.de/gti/public/checkName', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'geofox-auth-signature': createSignature(body),
      'geofox-auth-user': process.env.HVV_USERNAME!,
      'geofox-auth-type': 'HmacSHA1',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
