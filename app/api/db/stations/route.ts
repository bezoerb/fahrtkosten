import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createClient } from 'db-vendo-client';
import { profile } from 'db-vendo-client/p/db/index.js';
import { NextRequest, NextResponse } from 'next/server';

const client = createClient(profile, 'fahrtkosten.zoerb.dev');

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CACHE_DIR = join(tmpdir(), 'fahrtkosten-db-stations-cache');

const cacheFilePath = (key: string) => {
  const hash = createHash('sha256').update(key).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
};

const getCached = async (key: string): Promise<unknown | undefined> => {
  try {
    const filePath = cacheFilePath(key);
    const fileStat = await stat(filePath);
    if (Date.now() - fileStat.mtimeMs > CACHE_TTL_MS) {
      return undefined;
    }
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};

const setCache = async (key: string, data: unknown) => {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cacheFilePath(key), JSON.stringify(data), 'utf-8');
  } catch {
    // cache write failure is non-critical
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('s');
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const address = searchParams.get('address');

  try {
    if (search) {
      const cacheKey = `search:${search}`;
      const cached = await getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
      const stations = await client.locations(search, { results: 3 });
      await setCache(cacheKey, stations);
      return NextResponse.json(stations);
    }

    if (latitude && longitude) {
      const cacheKey = `nearby:${latitude},${longitude}`;
      const cached = await getCached(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
      const location = {
        type: 'location' as const,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ...(address ? { address } : {}),
      };
      const stations = await client.nearby(location, { results: 1 });
      const [station] = stations;
      await setCache(cacheKey, station);
      return NextResponse.json(station);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('DB stations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch station data' }, { status: 500 });
  }
}
