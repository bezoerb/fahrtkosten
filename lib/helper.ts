export const getUrl = (uri, params) => {
  const url = new URL(uri, 'http://localhost:3000/');
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString().replace('http://localhost:3000/', '/');
};

export const get = async (uri, params) => {
  const url = getUrl(uri, params || {});
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  return fetch(url, options);
};

export const getJSON = async ([uri, params]) => {
  const response = await get(uri, params || {});
  return response.json();
};

export const post = async (uri, body) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };

  return fetch(uri, options);
};

export const postJSON = async ([uri, body]) => {
  const response = await post(uri, body || {});
  return response.json();
};

export const omit = (input: Record<string, any>, keys: string[]): Record<string, any> =>
  Object.fromEntries(Object.entries(input).filter(([key]) => !keys.includes(key)));

export const take = (input: Record<string, any>, keys: string[]): Record<string, any> =>
  Object.fromEntries(Object.entries(input).filter(([key]) => keys.includes(key)));
