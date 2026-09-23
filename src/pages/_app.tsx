import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AppProvider } from '../context/AppContext';
import { PersistentLayout } from '../components/PersistentLayout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Head>
        <title>WithGod — Bible & Devotions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="A youth-friendly personal Bible reader and devotion notebook" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PersistentLayout>
        <Component {...pageProps} />
      </PersistentLayout>
    </AppProvider>
  );
}
