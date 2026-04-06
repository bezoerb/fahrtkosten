import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const url = new URL('https://creativecommons.tankerkoenig.de/json/list.php');
  url.searchParams.set('lat', lat!);
  url.searchParams.set('lng', lng!);
  url.searchParams.set('apikey', process.env.TANKER_KOENIG_KEY!);
  url.searchParams.set('rad', '20');
  url.searchParams.set('sort', 'dist');
  url.searchParams.set('type', 'all');

  const response = await fetch(url.toString());
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
