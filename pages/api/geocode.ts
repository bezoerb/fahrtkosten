// http://localhost:3000/api/geocode?target=auf%20dem%20brink%2027,%20stade

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

// https://api.mapbox.com/geocoding/v5/mapbox.places/glassh%C3%BCttenstrasse%2079%2C%20hamburg.json?
export default function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const url = new URL(req?.url ?? '', 'https://api.mapbox.com');

  const target = url.searchParams.get('target');
  url.pathname = `/geocoding/v5/mapbox.places/${target}.json`;

  url.searchParams.delete('target');
  url.searchParams.set('limit', '1');
  url.searchParams.set('proximity', 'ip');
  url.searchParams.set('language', 'de');
  url.searchParams.set('types', 'place,postcode,address');
  url.searchParams.set('access_token', process.env.MAPBOX_ACCESS_TOKEN);

  req.url = url.toString();

  console.log('MAPBOX:', req.url);

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
