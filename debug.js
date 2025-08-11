// Quick debug script
import {
  HVV_TARIFF_DAY,
  HVV_TARIFF_DAY_CHILD,
  HVV_TARIFF_GERMANY_TICKET,
  HVV_TARIFF_GROUP,
  HVV_TARIFF_SINGLE,
  HVV_TARIFF_SINGLE_CHILD,
} from './constants/hvv';

const mockTicketInfos = [
  {
    "tariffKindID": 1,
    "basePrice": 10.4,
  },
  {
    "tariffKindID": 2,
    "basePrice": 3,
  },
  {
    "tariffKindID": 11,
    "basePrice": 20.8,
  },
  {
    "tariffKindID": 12,
    "basePrice": 5.8,
  },
  {
    "tariffKindID": 13,
    "basePrice": 32.3,
  },
  {
    "tariffKindID": 35,
    "basePrice": 58,
  }
];

const getPrice = (ticketInfos) => {
  const price = ticketInfos.reduce((res, info) => res + info?.basePrice ?? 0, 0);
  return Math.round(price * 100) / 100;
};

// Test 5 adults, single ride
console.log("Testing 5 adults, single ride:");
console.log("Expected: Group ticket (32.3) should be cheaper than 5 singles (52.0)");

// Simulate the logic
const hvvAdultSingle = mockTicketInfos.find((info) => info.tariffKindID === HVV_TARIFF_SINGLE);
const hvvGroup = mockTicketInfos.find((info) => info.tariffKindID === HVV_TARIFF_GROUP);

console.log("hvvAdultSingle:", hvvAdultSingle);
console.log("hvvGroup:", hvvGroup);

const singlePrice = 5 * 10.4;
const groupPrice = 32.3;

console.log("5 singles price:", singlePrice);
console.log("Group price:", groupPrice);
console.log("Group should be chosen:", groupPrice < singlePrice);
