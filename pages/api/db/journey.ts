import { createClient } from 'hafas-client';
import { profile as dbProfileRaw } from 'hafas-client/p/db/index.js';
import { parseHook } from 'hafas-client/lib/profile-hooks.js';
import { parseJourney as _parseJourney } from 'hafas-client/parse/journey.js';
import { NextApiRequest, NextApiResponse } from 'next';

// create a client with the Deutsche Bahn profile
const client2 = createClient(dbProfileRaw, 'fahrtkosten.zoerb.dev');

const parseJourneyWithPrice = ({ parsed }, raw) => {
  parsed.price = null;
  if (
    raw.trfRes &&
    Array.isArray(raw.trfRes.fareSetL) &&
    raw.trfRes.fareSetL[0] &&
    Array.isArray(raw.trfRes.fareSetL[0].fareL)
  ) {
    const fare = raw.trfRes.fareSetL[0].fareL.filter((f) => f.isBookable === true && f.isPartPrice === false)[0];

    if (fare && fare.price.amount > 0) {
      parsed.price = {
        amount: fare.price.amount / 100,
        currency: 'EUR',
        hint: null,
      };
    }
  }

  return parsed;
};

const client = createClient(
  {
    ...dbProfileRaw,
    // @ts-ignore
    parseJourney: parseHook(_parseJourney, parseJourneyWithPrice),
  },
  'fahrtkosten.zoerb.dev'
);
// @ts-ignore
const profile = client.profile;

type Opt = {
  bahncard?: null;
  class?: number;
  age?: any;
  departure?: number | Date;
  products?: Record<string, any>;
  stopovers?: boolean; // return stations on the way?
  transfers?: number; // maximum nr of transfers
  transferTime?: number; // minimum time for a single transfer in minutes
};

const fetchJourneys = async (from, to, opt: Opt = {}) => {
  from = profile.formatLocation(profile, from, 'from');
  to = profile.formatLocation(profile, to, 'to');

  if ('earlierThan' in opt && 'laterThan' in opt) {
    throw new TypeError('opt.earlierThan and opt.laterThan are mutually exclusive.');
  }
  if ('departure' in opt && 'arrival' in opt) {
    throw new TypeError('opt.departure and opt.arrival are mutually exclusive.');
  }

  opt = Object.assign(
    {
      bahncard: null,
      class: 2,

      stopovers: false, // return stations on the way?
      transfers: -1, // maximum nr of transfers
      transferTime: 0, // minimum time for a single transfer in minutes
    },
    opt
  );

  const filters = [profile.formatProductsFilter({ profile }, opt.products || {})];

  const query = {
    getPasslist: !!opt.stopovers,
    maxChg: opt.transfers,
    minChgTime: opt.transferTime,
    depLocL: [from],
    arrLocL: [to],
    jnyFltrL: filters,
    trfReq: {
      cType: 'PK',
      tvlrProf: [
        {
          type: opt.age || 'E',
          ...(opt.bahncard ? { redtnCard: opt.bahncard } : {}),
        },
      ],
      jnyCl: opt.class,
    },
  };

  // // @ts-ignore
  // query.outDate = profile.formatDate(profile, opt.departure);
  // // @ts-ignore
  // query.outTime = profile.formatTime(profile, opt.departure);

  const { res, common } = await profile.request({ profile, opt }, 'fahrtkosten.zoerb.dev', {
    cfg: { polyEnc: 'GPA' },
    meth: 'BestPriceSearch',
    // todo
    req: query,
    // req: profile.transformJourneysQuery({ profile, opt }, query),
  });
  if (!Array.isArray(res.outConL)) return [];

  const ctx = { profile, opt, common, res };
  const journeys = res.outConL.map((j) => profile.parseJourney(ctx, j));

  return journeys;
};

const journeys = async (from, to, params, day = Date.now()) => {
  try {
    const journeys = await fetchJourneys(from, to, {
      departure: day,
      class: params.class,
      bahncard: params.bc,
      age: params.age === 'Y' ? 'Y' : 'E',
    });

    console.log(journeys);

    return journeys.filter((journey) => {
      const plannedDeparture = new Date(journey.legs[0].plannedDeparture);
      const plannedArrival = new Date(journey.legs[journey.legs.length - 1].plannedArrival);
      const duration = +plannedArrival - +plannedDeparture;
      const changes = journey.legs.length - 1;
      console.log({ price: journey.price, duration, changes });
      return (
        (!params.duration || duration <= params.duration * 60 * 60 * 1000) &&
        (params.maxChanges === undefined || params.maxChanges === null || params.maxChanges >= changes) &&
        Boolean(journey.price)
      );
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const getValue = (key: string): string => {
    const value = req.query?.[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const from = getValue('from');
  const to = getValue('to');
  const age = parseInt(getValue('age')) || 18;

  if (from && from) {
    try {
      const result2 = await client2.journeys(from, to, { results: 1, polylines: true, age });

      res.status(200).json(result2);
    } catch {}
  }
  res.status(200).json({});
}
