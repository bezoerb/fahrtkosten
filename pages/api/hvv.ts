// http://localhost:3000/api/hvv?start=auf%20dem%20brink%2027,%20stade&dest=glassh%C3%BCttenstra%C3%9Fe%2079,%20hamburg

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { createHmac } from 'crypto';

function createSignature(requestBody: object): string {
  const hmac = createHmac('sha1', process.env.HVV_PASSWORD);
  hmac.update(JSON.stringify(requestBody));
  return hmac.digest('base64');
}

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

type SDName = {
  type: string;
  name?: string;
  coordinate?: {
    x: number;
    y: number;
  };
};

type Body = {
  version: number;
  language: string;
  start: SDName;
  dest: SDName;
  tariffInfoSelector: Array<any>;
};

proxy.on('proxyReq', (proxyReq, req) => {
  const url = new URL(req?.url ?? '', 'https://gti.geofox.de');
  const start = url.searchParams.get('start');
  const dest = url.searchParams.get('dest');
  const latStart = url.searchParams.get('lat-start');
  const lngStart = url.searchParams.get('lng-start');
  const latDest = url.searchParams.get('lat-dest');
  const lngDest = url.searchParams.get('lng-dest');

  // Make any needed POST parameter changes
  const body: Body = {
    version: 49,
    language: 'de',
    start: {
      // name: start,
      type: 'UNKNOWN',
    },
    dest: {
      // name: dest,
      type: 'UNKNOWN',
    },
    tariffInfoSelector: [
      {
        tariffRegions: false,
        tariff: 'all',
      },
    ],
  };

  if (latStart && lngStart) {
    body.start.coordinate = { x: parseFloat(lngStart), y: parseFloat(latStart) };
    body.start.type = 'COORDINATE';
  } else if (start) {
    body.start.name = start;
  }

  if (latDest && lngDest) {
    body.dest.coordinate = { x: parseFloat(lngDest), y: parseFloat(latDest) };
    body.dest.type = 'COORDINATE';
  } else if (dest) {
    body.dest.name = dest;
  }

  const bodyData = JSON.stringify(body);
  proxyReq.setHeader('Accept', 'application/json');
  proxyReq.setHeader('Content-Type', 'application/json;charset=UTF-8');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.setHeader('geofox-auth-signature', createSignature(body));
  proxyReq.setHeader('geofox-auth-user', process.env.HVV_USERNAME);
  proxyReq.setHeader('geofox-auth-type', 'HmacSHA1');

  // Stream the content
  proxyReq.write(bodyData);
});

// https://gti.geofox.de/gti/public/getRoute
export default function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const url = new URL(req?.url ?? '', 'https://gti.geofox.de');
  url.pathname = `/gti/public/getRoute`;
  req.url = url.toString();
  req.method = 'POST';

  //   res.status(200).json({ url: req.url, method: req.method, body: req.body, headers: req.headers });
  proxy.web(req, res, {
    target: 'https://gti.geofox.de',
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
