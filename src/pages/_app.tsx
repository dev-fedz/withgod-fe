import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AppProvider } from '../context/AppContext';
import { PersistentLayout } from '../components/PersistentLayout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <AppProvider>
      <Head>
        <title>Shema — Bible & Devotions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="A youth-friendly personal Bible reader and devotion notebook" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <PersistentLayout>
        <Component {...pageProps} />
      </PersistentLayout>
    </AppProvider>
  );
}

