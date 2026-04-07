import { scoreStations } from '../app/api/fuel/along-route/scoring';

describe('along-route scoring', () => {
  it('does not add detour cost for stations on route', () => {
    const [station] = scoreStations([
      {
        station: {
          id: '1',
          name: 'On Route',
          brand: 'Brand',
          price: 1.7,
          lat: 53.55,
          lng: 10,
        },
        distanceToRoute: 0.2,
      },
    ]);

    expect(station.detourKm).toBe(0);
    expect(station.effectivePrice).toBe(1.7);
  });

  it('adds detour cost for stations away from route', () => {
    const [station] = scoreStations([
      {
        station: {
          id: '2',
          name: 'Detour',
          brand: 'Brand',
          price: 1.7,
          lat: 53.55,
          lng: 10,
        },
        distanceToRoute: 1.25,
      },
    ]);

    // detour = 2 * distanceToRoute = 2.5
    expect(station.detourKm).toBe(2.5);
    expect(station.effectivePrice).toBeCloseTo(2.075, 5);
  });

  it('sorts by effective price ascending', () => {
    const stations = scoreStations([
      {
        station: {
          id: 'a',
          name: 'Far but cheap',
          brand: 'Brand',
          price: 1.5,
          lat: 53.55,
          lng: 10,
        },
        distanceToRoute: 4,
      },
      {
        station: {
          id: 'b',
          name: 'Near and slightly pricier',
          brand: 'Brand',
          price: 1.65,
          lat: 53.55,
          lng: 10,
        },
        distanceToRoute: 0.1,
      },
    ]);

    expect(stations[0].station.id).toBe('b');
    expect(stations[1].station.id).toBe('a');
  });
});
