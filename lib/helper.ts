export const getUrl = (uri, params) => {
  const url = new URL(uri, 'http://localhost:3000/');
  Object.entries<string>(params).forEach(([key, value]) => url.searchParams.set(key, value));

  return url.toString().replace('http://localhost:3000/', '/');
};

export const get = async (uri, params) => {
  const url = getUrl(uri, params);
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  return fetch(url, options);
};

export const getJSON = async (uri, params) => {
  const response = await get(uri, params);
  return response.json();
};

export const omit = (input: Record<string, any>, keys: string[]): Record<string, any> =>
  Object.fromEntries(Object.entries(input).filter(([key]) => !keys.includes(key)));

export const take = (input: Record<string, any>, keys: string[]): Record<string, any> =>
  Object.fromEntries(Object.entries(input).filter(([key]) => keys.includes(key)));
