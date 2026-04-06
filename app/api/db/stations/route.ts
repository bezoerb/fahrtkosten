import { createClient } from 'db-vendo-client';
import { profile } from 'db-vendo-client/p/db/index.js';
import { NextRequest, NextResponse } from 'next/server';

const client = createClient(profile, 'fahrtkosten.zoerb.dev');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('s');
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const address = searchParams.get('address');

  try {
    if (search) {
      const stations = await client.locations(search, { results: 3 });
      return NextResponse.json(stations);
    }

    if (latitude && longitude) {
      const location = {
        type: 'location' as const,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ...(address ? { address } : {}),
      };
      const stations = await client.nearby(location, { results: 1 });
      const [station] = stations;
      return NextResponse.json(station);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('DB stations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 500 });
  }
}
