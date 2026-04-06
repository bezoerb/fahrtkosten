import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function createSignature(requestBody: object): string {
  const hmac = createHmac('sha1', process.env.HVV_PASSWORD!);
  hmac.update(JSON.stringify(requestBody));
  return hmac.digest('base64');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start');
  const dest = searchParams.get('dest');
  const latStart = searchParams.get('lat-start');
  const lngStart = searchParams.get('lng-start');
  const latDest = searchParams.get('lat-dest');
  const lngDest = searchParams.get('lng-dest');

  const body: any = {
    version: 49,
    language: 'de',
    start: { type: 'UNKNOWN' },
    dest: { type: 'UNKNOWN' },
    tariffInfoSelector: [{ tariffRegions: false, tariff: 'all' }],
  };

  if (latStart && lngStart) {
    body.start.coordinate = { x: parseFloat(lngStart), y: parseFloat(latStart) };
    body.start.type = 'COORDINATE';
  } else if (start) {
    body.start.name = start;
  }

  if (latDest && lngDest) {
    body.dest.coordinate = { x: parseFloat(lngDest), y: parseFloat(latDest) };
    body.dest.type = 'COORDINATE';
  } else if (dest) {
    body.dest.name = dest;
  }

  const response = await fetch('https://gti.geofox.de/gti/public/getRoute', {
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
