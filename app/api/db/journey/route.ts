import { createClient } from 'db-vendo-client';
import { profile } from 'db-vendo-client/p/db/index.js';
import { NextRequest, NextResponse } from 'next/server';

const client = createClient(profile, 'fahrtkosten.zoerb.dev');

export const maxDuration = 60;

const fetchJourneys = async (from: string, to: string, params: any, day = Date.now()) => {
  try {
    const when = new Date(day);
    const result = await client.journeys(from, to, {
      departure: when,
      results: null,
      bestprice: true,
      tickets: true,
      polylines: true,
    });

    return result.journeys.filter((journey) => {
      const plannedDeparture = new Date(journey.legs[0].plannedDeparture);
      const plannedArrival = new Date(journey.legs[journey.legs.length - 1].plannedArrival);
      const duration = +plannedArrival - +plannedDeparture;
      const changes = journey.legs.length - 1;
      return (
        (!params.duration || duration <= params.duration * 60 * 60 * 1000) &&
        (params.maxChanges === undefined || params.maxChanges === null || params.maxChanges >= changes)
      );
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (from && to) {
    try {
      const tomorrow = new Date(Date.now() + 60 * 60 * 24 * 1000);
      tomorrow.setHours(1);
      tomorrow.setMinutes(0);
      const result = await fetchJourneys(from, to, {}, +tomorrow);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json([], { status: 404 });
    }
  }

  return NextResponse.json({});
}
