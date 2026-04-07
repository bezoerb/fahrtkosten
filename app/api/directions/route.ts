import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latStart = searchParams.get('lat-start');
  const lngStart = searchParams.get('lng-start');
  const latDest = searchParams.get('lat-dest');
  const lngDest = searchParams.get('lng-dest');

  if (!latStart || !lngStart || !latDest || !lngDest) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }
  const waypointIndices = new Set<number>();
  for (const key of searchParams.keys()) {
    const wpLngMatch = key.match(/^wp-lng-(\d+)$/);
    const wpLatMatch = key.match(/^wp-lat-(\d+)$/);
    if (wpLngMatch) {
      waypointIndices.add(Number(wpLngMatch[1]));
    }
    if (wpLatMatch) {
      waypointIndices.add(Number(wpLatMatch[1]));
    }
  }

  const waypointCoordinates = [...waypointIndices]
    .sort((a, b) => a - b)
    .map((index) => {
      const waypointLng = searchParams.get(`wp-lng-${index}`);
      const waypointLat = searchParams.get(`wp-lat-${index}`);
      return waypointLng && waypointLat ? `${waypointLng},${waypointLat}` : null;
    })
    .filter((waypoint): waypoint is string => Boolean(waypoint));

  const coordinates = [`${lngStart},${latStart}`, ...waypointCoordinates, `${lngDest},${latDest}`].join(';');
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
  url.searchParams.set('alternatives', 'true');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('language', 'de');
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN!);

  const response = await fetch(url.toString());
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
