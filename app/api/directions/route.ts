import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latStart = searchParams.get('lat-start');
  const lngStart = searchParams.get('lng-start');
  const latDest = searchParams.get('lat-dest');
  const lngDest = searchParams.get('lng-dest');

  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${lngStart},${latStart};${lngDest},${latDest}`);
  url.searchParams.set('alternatives', 'true');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'simplified');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('language', 'de');
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN!);

  const response = await fetch(url.toString());
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
