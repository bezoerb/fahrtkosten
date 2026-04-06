import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const target = searchParams.get('target');

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(target!)}.json`);
  url.searchParams.set('limit', '1');
  url.searchParams.set('proximity', 'ip');
  url.searchParams.set('language', 'de');
  url.searchParams.set('types', 'place,postcode,address');
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN!);

  const response = await fetch(url.toString());
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
