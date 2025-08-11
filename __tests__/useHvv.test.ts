import {
  HVV_TARIFF_DAY,
  HVV_TARIFF_DAY_CHILD,
  HVV_TARIFF_GERMANY_TICKET,
  HVV_TARIFF_GROUP,
  HVV_TARIFF_SINGLE,
  HVV_TARIFF_SINGLE_CHILD,
} from '../constants/hvv';
import { calculateTickets, getPrice } from '../hooks/useHvv';

import type { TicketInfo } from '../lib/types';

// Real HVV ticket data
const mockTicketInfos: TicketInfo[] = [
  {
    tariffKindID: 1,
    tariffKindLabel: 'Einzelkarte',
    tariffLevelID: 90,
    tariffLevelLabel: '5 Ringe',
    tariffGroupID: 1,
    tariffGroupLabel: 'Einzelkarten',
    basePrice: 10.4,
    regionType: 'RING',
    notRecommended: false,
    shopLinkRegular:
      'https://shop.hvv.de/index.php/generic/culture/de?return=https%3A%2F%2Fshop.hvv.de%2Findex.php%2Ffahrplanauskunft%3Fkarte%3DEinzelkarte%26bereich%3D5+Ringe%26start%3DStade%26gueltig%3D2025-08-11%26zones%3DE%2CA',
  },
  {
    tariffKindID: 2,
    tariffKindLabel: 'Einzelkarte Kind',
    tariffLevelID: 90,
    tariffLevelLabel: '5 Ringe',
    tariffGroupID: 1,
    tariffGroupLabel: 'Einzelkarten',
    basePrice: 3,
    regionType: 'RING',
    notRecommended: false,
    shopLinkRegular:
      'https://shop.hvv.de/index.php/generic/culture/de?return=https%3A%2F%2Fshop.hvv.de%2Findex.php%2Ffahrplanauskunft%3Fkarte%3DEinzelkarte+Kind%26bereich%3D5+Ringe%26start%3DStade%26gueltig%3D2025-08-11%26zones%3DE%2CA',
  },
  {
    tariffKindID: 11,
    tariffKindLabel: 'Tageskarte',
    tariffLevelID: 90,
    tariffLevelLabel: '5 Ringe',
    tariffGroupID: 2,
    tariffGroupLabel: 'Tageskarten',
    basePrice: 20.8,
    regionType: 'RING',
    notRecommended: false,
    shopLinkRegular:
      'https://shop.hvv.de/index.php/generic/culture/de?return=https%3A%2F%2Fshop.hvv.de%2Findex.php%2Ffahrplanauskunft%3Fkarte%3DTageskarte%26bereich%3D5+Ringe%26start%3DStade%26gueltig%3D2025-08-11%26zones%3DE%2CA',
  },
  {
    tariffKindID: 12,
    tariffKindLabel: 'Tageskarte Kind',
    tariffLevelID: 90,
    tariffLevelLabel: '5 Ringe',
    tariffGroupID: 2,
    tariffGroupLabel: 'Tageskarten',
    basePrice: 5.8,
    regionType: 'RING',
    notRecommended: false,
    shopLinkRegular:
      'https://shop.hvv.de/index.php/generic/culture/de?return=https%3A%2F%2Fshop.hvv.de%2Findex.php%2Ffahrplanauskunft%3Fkarte%3DTageskarte+Kind%26bereich%3D5+Ringe%26start%3DStade%26gueltig%3D2025-08-11%26zones%3DE%2CA',
  },
  {
    tariffKindID: 13,
    tariffKindLabel: 'Gruppenkarte',
    tariffLevelID: 90,
    tariffLevelLabel: '5 Ringe',
    tariffGroupID: 2,
    tariffGroupLabel: 'Tageskarten',
    basePrice: 32.3,
    regionType: 'RING',
    notRecommended: false,
    shopLinkRegular:
      'https://shop.hvv.de/index.php/generic/culture/de?return=https%3A%2F%2Fshop.hvv.de%2Findex.php%2Ffahrplanauskunft%3Fkarte%3DGruppenkarte%26bereich%3D5+Ringe%26start%3DStade%26gueltig%3D2025-08-11%26zones%3DE%2CA',
  },
  {
    tariffKindID: 35,
    tariffKindLabel: 'Deutschlandticket',
    tariffLevelID: 99,
    tariffLevelLabel: 'Bundesweit im Nahverkehr',
    tariffGroupID: 3,
    tariffGroupLabel: 'Deutschlandticket',
    basePrice: 58,
    notRecommended: false,
    shopLinkRegular: 'https://abo2.hvv.de/de/subscriber/order?ka=9999',
  },
] as TicketInfo[];


describe('calculateTickets', () => {
  describe('Debug test', () => {
    it('should find group ticket correctly', () => {
      const hvvGroup = mockTicketInfos.find((info) => info.tariffKindID === HVV_TARIFF_GROUP);
      console.log('HVV_TARIFF_GROUP constant:', HVV_TARIFF_GROUP);
      console.log('hvvGroup found:', hvvGroup);
      expect(hvvGroup).toBeDefined();
      expect(hvvGroup?.basePrice).toBe(32.3);
    });

    it('should debug 5 adults single ride calculation', () => {
      console.log('=== DEBUGGING 5 adults, single ride ===');
      const result = calculateTickets(5, 0, false, mockTicketInfos);
      const price = getPrice(result);
      console.log('Final result:', { price, ticketCount: result.length });

      // The group ticket should be chosen
      expect(price).toBe(32.3);
    });
  });

  describe('Single rides (twoWay = false)', () => {
    it('should calculate correct price for 1 adult single ride', () => {
      const result = calculateTickets(1, 0, false, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(10.4);
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_SINGLE);
    });

    it('should calculate correct price for 1 adult + 1 child single ride', () => {
      const result = calculateTickets(1, 1, false, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(13.4); // 10.4 + 3.0
      expect(result).toHaveLength(2);
    });

    it('should calculate correct price for multiple adults single ride', () => {
      const result = calculateTickets(3, 0, false, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(31.2); // 3 * 10.4
      expect(result).toHaveLength(3);
    });

    it('should choose group ticket for 5 adults single ride when cheaper', () => {
      const result = calculateTickets(5, 0, false, mockTicketInfos);
      const price = getPrice(result);

      // 5 singles: 5 * 10.4 = 52.0 vs Group: 32.3
      expect(price).toBe(32.3); // Group ticket is much cheaper
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should choose group ticket for 3 adults + 2 children single ride when cheaper', () => {
      const result = calculateTickets(3, 2, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 3 * 10.4 + 2 * 3.0 = 37.2 vs Group: 32.3
      expect(price).toBe(32.3); // Group ticket is cheaper
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should prefer single tickets for 2 adults when cheaper than group', () => {
      const result = calculateTickets(2, 0, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 2 * 10.4 = 20.8 vs Group: 32.3
      expect(price).toBe(20.8); // Singles are cheaper
      expect(result).toHaveLength(2);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_SINGLE);
    });

    it('should consider adult day ticket for 1 adult + 3 children single ride', () => {
      const result = calculateTickets(1, 3, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 1 * 10.4 + 3 * 3.0 = 19.4 vs Adult day: 20.8
      expect(price).toBe(19.4); // Singles are cheaper
      expect(result).toHaveLength(4);
    });

    it('should handle large groups with combination of tickets for single rides', () => {
      const result = calculateTickets(6, 2, false, mockTicketInfos);
      const price = getPrice(result);
      // Group (5 people) + 3 singles: 32.3 + 1 * 10.4 = 42,7
      // vs all singles: 6 * 10.4 + 2 * 3.0 = 68.4
      expect(price).toBe(48.7);
      expect(result).toHaveLength(4); // 1 group + 3 singles
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });
  });

  describe('Two-way rides (twoWay = true)', () => {
    it('should choose day ticket for 1 adult two-way', () => {
      const result = calculateTickets(1, 0, true, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(20.8); // Day ticket vs 2 singles (20.8)
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_DAY);
    });

    it('should choose group ticket for 2 adults two-way', () => {
      const result = calculateTickets(2, 0, true, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(32.3); // Group ticket (32.3) vs 2 day tickets (41.6)
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should handle adult day ticket with children correctly', () => {
      const result = calculateTickets(1, 2, true, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(20.8); // Adult day ticket covers 1 adult + up to 3 children
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_DAY);
    });

    it('should handle adult day ticket with more than 3 children', () => {
      const result = calculateTickets(1, 4, true, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(26.6); // Adult day (20.8) + 1 child day (5.8) = 26.6
      expect(result).toHaveLength(2);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_DAY);
      expect(result[1].tariffKindID).toBe(HVV_TARIFF_DAY_CHILD);
    });

    it('should choose group ticket for 5 people', () => {
      const result = calculateTickets(3, 2, true, mockTicketInfos);
      const price = getPrice(result);
      expect(price).toBe(32.3); // Group ticket covers up to 5 people
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should handle more than 5 people correctly', () => {
      const result = calculateTickets(5, 1, true, mockTicketInfos);
      const price = getPrice(result);
      // Group ticket (32.3) + 1 child day ticket (5.8) = 38.1
      expect(price).toBe(38.1);
      expect(result).toHaveLength(2);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
      expect(result[1].tariffKindID).toBe(HVV_TARIFF_DAY_CHILD);
    });

    it('should handle the problematic case: 5 adults + 1 child', () => {
      const result = calculateTickets(5, 1, true, mockTicketInfos);
      const price = getPrice(result);
      // Should NOT use group ticket for 6 people
      // Instead: Group ticket (5 people) + 1 child day ticket
      expect(price).toBe(38.1); // 32.3 + 5.8
      expect(result).toHaveLength(2);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
      expect(result[1].tariffKindID).toBe(HVV_TARIFF_DAY_CHILD);
    });

    it('should handle large groups efficiently', () => {
      const result = calculateTickets(3, 4, true, mockTicketInfos);
      const price = getPrice(result);
      // 7 people total: Group (5) + 2 children
      // Group ticket (32.3) + 2 child day tickets (2 * 5.8 = 11.6) = 43.9
      expect(price).toBe(43.9);
      expect(result).toHaveLength(3);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should optimize between adult day ticket and group ticket for complex scenarios', () => {
      const result = calculateTickets(2, 3, true, mockTicketInfos);
      const price = getPrice(result);
      // Options:
      // 1. Adult day (covers 1+3) + 1 adult day: 20.8 + 20.8 = 41.6
      // 2. Group ticket (covers all 5): 32.3
      // 3. 2 adult days + 3 child days: 41.6 + 17.4 = 59.0
      expect(price).toBe(32.3); // Group should be cheapest
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });
  });

  describe('Edge cases', () => {
    it('should return empty array when no adult tickets available', () => {
      const emptyTickets: TicketInfo[] = [];
      const result = calculateTickets(1, 0, false, emptyTickets);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when children present but no child tickets available', () => {
      const adultOnlyTickets: TicketInfo[] = [
        {
          tariffKindID: HVV_TARIFF_SINGLE,
          basePrice: 10.4,
        } as TicketInfo,
      ];
      const result = calculateTickets(1, 1, false, adultOnlyTickets);
      expect(result).toHaveLength(0);
    });

    it('should handle 0 adults and 0 children', () => {
      const result = calculateTickets(0, 0, false, mockTicketInfos);
      expect(result).toHaveLength(0);
    });

    it('should handle only children (no adults)', () => {
      const result = calculateTickets(0, 2, true, mockTicketInfos);
      expect(result).toHaveLength(2); // Should return child day tickets
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_DAY_CHILD);
    });

    it('should compare with Germany ticket for large groups', () => {
      const result = calculateTickets(10, 5, true, mockTicketInfos);
      const price = getPrice(result);
      // Should choose the most economical option
      // Germany tickets: 15 * 58 = 870
      // Regular tickets would be much cheaper
      expect(price).toBeLessThan(870);
    });
  });

  describe('Cross-scenario optimizations', () => {
    it('should choose day tickets over singles for single rides when beneficial', () => {
      // This would happen if day ticket price was lower than single ticket price
      // With current real prices, singles are usually better for single rides
      const result = calculateTickets(1, 0, false, mockTicketInfos);
      const price = getPrice(result);
      // Single: 10.4 vs Day: 20.8 - single is better
      expect(price).toBe(10.4);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_SINGLE);
    });

    it('should choose group tickets over day tickets for single rides when beneficial', () => {
      const result = calculateTickets(4, 1, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 4 * 10.4 + 1 * 3.0 = 44.6
      // Group: 32.3
      // Adult day combinations would be more expensive
      expect(price).toBe(32.3);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should handle edge case: exactly 5 people single ride', () => {
      const result = calculateTickets(4, 1, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 4 * 10.4 + 1 * 3.0 = 44.6
      // Group: 32.3 (covers all 5)
      expect(price).toBe(32.3);
      expect(result).toHaveLength(1);
      expect(result[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });

    it('should optimize for families: 2 adults + 3 children single ride', () => {
      const result = calculateTickets(2, 3, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 2 * 10.4 + 3 * 3.0 = 29.8
      // Group: 32.3
      // Adult day + adult single: 20.8 + 10.4 = 31.2
      expect(price).toBe(29.8); // Singles are cheapest
      expect(result).toHaveLength(5);
    });

    it('should handle mixed optimization for 1 adult + 4 children', () => {
      const result = calculateTickets(1, 4, false, mockTicketInfos);
      const price = getPrice(result);
      // Singles: 1 * 10.4 + 4 * 3.0 = 22.4
      // Group: 32.3
      // Adult day + 1 child single: 20.8 + 3.0 = 23.8
      expect(price).toBe(22.4); // Singles are cheapest
      expect(result).toHaveLength(5);
    });
  });

  describe('Price optimization with real data', () => {
    it('should always choose the cheapest option for 2 adults 1 child', () => {
      const result = calculateTickets(2, 1, true, mockTicketInfos);
      const price = getPrice(result);

      // Manually calculate alternatives:
      // Naive: 2 * 20.8 + 1 * 5.8 = 47.4
      // Group: 32.3 (covers all 3 people)
      // Adult day + child: 20.8 + 5.8 = 26.6 (but doesn't cover 2nd adult)

      expect(price).toBe(32.3); // Adult day should cover 1 adult + 1 child, need 1 more adult day
      expect(result).toHaveLength(1);
    });

    it('should optimize for different group sizes', () => {
      // Test 4 people (2 adults, 2 children)
      const result4 = calculateTickets(2, 2, true, mockTicketInfos);
      const price4 = getPrice(result4);

      // Adult day covers 1 adult + 2 children, need 1 more adult day
      // 20.8 + 20.8 = 41.6 vs Group 32.3
      expect(price4).toBe(32.3); // Group should be cheaper
      expect(result4[0].tariffKindID).toBe(HVV_TARIFF_GROUP);
    });
  });
});
