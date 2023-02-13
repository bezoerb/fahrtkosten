import { createDbHafas } from 'db-hafas';
import { Location, HafasClient, Products } from 'hafas-client';
import { NextApiRequest, NextApiResponse } from 'next';

import stations from 'db-hafas-stations';

/**
 * Reads all the text in a readable stream and returns it as a string,
 * via a Promise.
 * @param {stream.Readable} readable
 */
function getStations() {
  const stream = stations.full()
  return new Promise((resolve, reject) => {
    let data = [];
    stream.on('data', function (chunk) {
      data.push(chunk);
    });
    stream.on('end', function () {
      resolve(data);
    });
    stream.on('error', function (err) {
      reject(err);
    });
  });
}

const { locations, nearby } = createDbHafas('fahrtkosten.zoerb.dev') as HafasClient;

const hasTrain = (products: Products) =>
  products.national || products.nationalExpress || products.regional || products.regionalExpress;

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const getValue = (key: string): string => {
    const value = req.query?.[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const search = getValue('s');
  const latitude = getValue('latitude');
  const longitude = getValue('longitude');
  const address = getValue('address');

  if (search) {
    const stations = await locations(search, { results: 3 });
    res.status(200).json(stations);
    return;
  }

  if (latitude && longitude) {
    const location: Location = {
      type: 'location',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    if (address) {
      location.address = address;
    }
    const stations = await nearby(location, {
      results: 1,
    });

    const [station] = stations

    res.status(200).json(station);
    return;
  }

  // const result = await stations('hamburg');
  res.status(200).json({});
}
