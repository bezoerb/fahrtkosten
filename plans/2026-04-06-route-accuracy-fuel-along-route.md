# Design Spec: Route Accuracy & Fuel Along Route

**Date:** 2026-04-07
**Status:** Approved

## Problem

1. **Car route on map is inaccurate** — Mapbox directions API uses `overview=simplified`, producing a rough polyline that doesn't follow the actual road
2. **Gas station is unrelated to the route** — Tankerkönig searches by radius around start location, not along the actual driving route

## Solution

- Switch directions API to `overview=full` for precise geometry
- Add a server endpoint that samples the route, queries Tankerkönig in parallel, deduplicates and scores candidates by price + detour
- For the **shortest route**: reroute through the cheapest gas station (1× waypoint re-request)
- For the **fastest route**: only show gas stations that lie directly on the route (< 0.5km), no rerouting
- Show gas station markers on the map

## Scope

**Only car-related code**: directions API, Tankerkönig/fuel, useDirections, useTravelCosts (car fields only), map (car layer + station marker).
**Do NOT touch**: `useDeutscheBahn.ts`, `useHvv.ts`, DB/train code, HVV code, `result.tsx`, `lib/store.tsx`.

---

## Architecture

### Data Flow

```
User → Start + Ziel
         │
         ▼
   useDirections ─── GET /api/directions (overview=full) ──► Mapbox
         │                                                      │
         │◄─── fastest + shortest (volle Geometrie) ───────────┘
         │
         ├─ useFuelAlongRoute(shortest.coords, fuelType)
         │     └─ POST /api/fuel/along-route → Server samplet + Tankerkönig
         │        └─ { stations[], cheapest }
         │
         ├─ useFuelAlongRoute(fastest.coords, fuelType)
         │     └─ Stationen filtern: nur distanceToRoute < 0.5km
         │
         ├─ Reroute-Check (nur shortest):
         │     cheapest.distanceToRoute > 0.5km?
         │       ja → 1× GET /api/directions mit Waypoint → neue shortest
         │       nein → kein Reroute nötig
         │
         ▼
   useTravelCosts
         ├─ fuelPrice = cheapest?.station.price ?? tankerkoenig-Radius-Preis
         ├─ carShortest = ggf. re-routete Version
         ├─ carFastest = original
         │
         ▼
   map.tsx ─ Tankstellen-Marker (⛽ + Preis)
```

### Files

**New files:**

| File                                  | Responsibility                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/geo.ts`                          | Pure geo functions: `haversineDistance`, `sampleRoutePoints`, `pointToRouteDistance`, `routeLengthKm`                                        |
| `app/api/fuel/along-route/route.ts`   | POST endpoint: receives coordinates + fuelType, samples route, queries Tankerkönig in parallel, deduplicates, scores, returns sorted results |
| `app/api/fuel/along-route/scoring.ts` | Pure scoring logic, testable without API context                                                                                             |
| `hooks/useFuelAlongRoute.ts`          | SWR hook: single POST to `/api/fuel/along-route`                                                                                             |

**Changed files:**

| File                          | Change                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app/api/directions/route.ts` | `overview=simplified` → `overview=full`, optional waypoint params (`wp-lng-N`, `wp-lat-N`)                          |
| `hooks/useDirections.ts`      | Call `useFuelAlongRoute` for both routes, 1× reroute for shortest if detour needed, remove `useTankerkoenig` import |
| `hooks/useTravelCosts.ts`     | Use `effectiveFuelPrice` from station, pass station data through                                                    |
| `components/map.tsx`          | Import `Marker`, add `GasStationMarker` component, extend bounds                                                    |
| `lib/types.ts`                | Add `AlongRouteStation`, `AlongRouteResponse` types                                                                 |
| `lib/helper.ts`               | Add `postJSON` fetcher                                                                                              |

**Untouched files:** `useDeutscheBahn.ts`, `useHvv.ts`, `useTankerkoenig.ts`, `result.tsx`, `lib/store.tsx`, all DB/HVV API routes.

---

## Server Logic: `/api/fuel/along-route`

**Request:** `POST { coordinates: [number, number][], fuelType: 'e5' | 'e10' | 'diesel' }`

**Algorithm:**

1. `routeLengthKm(coordinates)` — compute total route length
2. Determine sample interval: `Math.max(routeLengthKm / MAX_SAMPLES, MIN_INTERVAL_KM)` — short routes get fewer samples, long routes cap at `MAX_SAMPLES`
3. `sampleRoutePoints(coordinates, intervalKm)` — evenly-spaced points along route
4. Per sample: parallel Tankerkönig request (radius 10km)
5. Deduplicate by station ID
6. Per station: compute `pointToRouteDistance(station, routeCoordinates)`
7. Filter: discard stations with `distanceToRoute > MAX_DISTANCE_KM`
8. Score: `effectivePrice = price + (detourKm × FUEL_COST_PER_KM)` — `detourKm` only counts if `distanceToRoute > DIRECT_THRESHOLD_KM`
9. Return sorted by `effectivePrice`

**Constants (configurable):**

```
MAX_SAMPLES = 8            // Rate-limit protection, reducible if hitting limits
MIN_INTERVAL_KM = 20       // Minimum distance between samples
MAX_DISTANCE_KM = 5        // Max station distance from route
DIRECT_THRESHOLD_KM = 0.5  // Below this = "on the route", no detour cost
FUEL_COST_PER_KM = 0.15    // Detour cost factor in €/km
```

**Response:**

```ts
{
  stations: AlongRouteStation[],   // sorted by effectivePrice
  cheapest: AlongRouteStation | null
}
```

Scoring logic lives in `scoring.ts` — pure function, unit-testable.

---

## Client Hooks

### `useFuelAlongRoute(coordinates, fuelType)`

- SWR hook with `postJSON` fetcher
- Key: `['/api/fuel/along-route', { coordinates, fuelType }]` — null when no coordinates
- Returns: `{ data: AlongRouteResponse, error, isLoading }`

### `useDirections` changes

- Fetch routes with `overview=full`
- Call `useFuelAlongRoute` for shortest route coordinates → get `cheapestStation`
- Call `useFuelAlongRoute` for fastest route coordinates → filter to `distanceToRoute < 0.5km`
- If `cheapestStation.distanceToRoute > 0.5km`: 1× reroute via `/api/directions` with waypoint
- Rerouted result replaces original `shortest` (new distance, duration, price, geojson)
- Remove `useTankerkoenig` import from this hook
- Return: `{ fastest, shortest, cheapestStation, fastestOnRouteStations[] }`

### `useTravelCosts` changes

- `effectiveFuelPrice = cheapestStation?.station.price ?? tankerkoenigPrice` (fallback stays)
- `Result` type gets `station?: AlongRouteStation` on `carShortest`
- DB/HVV code: untouched

---

## Map & UI

### `map.tsx` changes

- Import `Marker` from `react-map-gl`
- New `GasStationMarker` sub-component: ⛽ emoji + price label
- Render marker for `cheapestStation` on shortest route
- Optionally render smaller markers for on-route stations on fastest route
- Extend `extendBounds` to include station coordinates
- Map interactions remain disabled (`scrollZoom=false`, `dragPan=false`, etc.)
- Train/HVV layers: untouched
- Legend: no new entry (marker is self-explanatory)

### `result.tsx` — no changes

Already displays `fuelPrice` which will now receive the effective price from the station.

---

## Types

```ts
type AlongRouteStation = {
  station: {
    id: string;
    name: string;
    brand: string;
    price: number;
    lat: number;
    lng: number;
  };
  distanceToRoute: number; // km
  detourKm: number; // 0 if < DIRECT_THRESHOLD
  effectivePrice: number; // price + detour cost
};

type AlongRouteResponse = {
  stations: AlongRouteStation[];
  cheapest: AlongRouteStation | null;
};
```

---

## Testing

- `__tests__/geo.test.ts` — unit tests for all geo functions
- `__tests__/scoring.test.ts` — unit tests for scoring logic
- Existing tests must continue passing
- `pnpm exec tsc --noEmit` — no type errors
- `pnpm build` — production build succeeds
