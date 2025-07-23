
/// <reference lib="webworker" />
import { defaultCache } from '@ducanh2912/next-pwa/dist/cache';
import { PrecacheController } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

const precacheController = new PrecacheController();
precacheController.addToCacheList(defaultCache);

self.addEventListener('install', (event) => {
  event.waitUntil(precacheController.install(event));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(precacheController.activate(event));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(precacheController.handle(event));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PrEPy';
  const options = {
    body: data.body || 'Notification de PrEPy',
    icon: '/icons/android-chrome-192x192.png',
    badge: '/icons/badge.png',
    ...data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
