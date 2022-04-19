// http://localhost:3000/api/fuel?lat=53.5941513048023&lng=9.47848564322075

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

export default function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const url = new URL(req?.url ?? '', 'https://creativecommons.tankerkoenig.de');

  url.pathname = 'json/list.php';
  url.searchParams.set('apikey', process.env.TANKER_KOENIG_KEY);
  url.searchParams.set('rad', '20');
  url.searchParams.set('sort', 'dist');
  url.searchParams.set('type', 'all');

  req.url = url.toString();

  // res.status(200).json({ url  })
  proxy.web(req, res, {
    target: 'https://creativecommons.tankerkoenig.de',
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
