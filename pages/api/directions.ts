// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({});

proxy.on('error', function (error, req, res) {
  var json;
  console.log('proxy error', error);
  // if (!res.headersSent) {
  //   res.writeHead(500, { 'content-type': 'application/json' });
  // }

  json = { error: 'proxy_error', reason: error.message };
  res.end(JSON.stringify(json));
});

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function (proxyReq, req, res, options) {});

// http://localhost:3000/api/directions?lng-start=9.478571473907634&lat-start=53.59460976773673&lng-dest=9.565837164152539&lat-dest=53.508330841389885

// https://api.mapbox.com/directions/v5/mapbox/driving/9.478571473907634%2C53.59460976773673%3B9.565837164152539%2C53.508330841389885
export default function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const url = new URL(req?.url ?? '', 'https://api.mapbox.com');

  const latStart = url.searchParams.get('lat-start');
  const lngStart = url.searchParams.get('lng-start');
  const latDest = url.searchParams.get('lat-dest');
  const lngDest = url.searchParams.get('lng-dest');
  url.pathname = `/directions/v5/mapbox/driving/${lngStart},${latStart};${lngDest},${latDest}`;


  url.searchParams.delete('lat-start');
  url.searchParams.delete('lng-start');
  url.searchParams.delete('lat-dest');
  url.searchParams.delete('lng-dest');
  url.searchParams.set('alternatives', 'true');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'simplified');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('language', 'de');
  url.searchParams.set(
    'access_token',
    process.env.MAPBOX_ACCESS_TOKEN
  );

  req.url = url.toString();

  proxy.web(req, res, {
    target: 'https://api.mapbox.com',
    changeOrigin: true,
  });
}

// const API_URL = process.env.API_URL; // The actual URL of your API
// const proxy = httpProxy.createProxyServer();

// type Data = {
//   name: string;
// };

// export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
//   res.status(200).json({ name: 'John Doe' });
// }
