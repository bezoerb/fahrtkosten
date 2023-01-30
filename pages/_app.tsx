import '../styles/globals.css';
import type { AppProps } from 'next/app';
import {  Provider } from '../lib/store';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider {...pageProps.initialZustandState}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
