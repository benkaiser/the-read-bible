const resourceCache = 'resourceCache';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  './', // Alias for index.html
  'read',
  'listen',
  'readchapter',
  'readChapter.js',
  'listen.js',
  'read.js',
  'index.css',
  'deps.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(resourceCache)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

function fetchAndCache(request) {
  return caches.open(resourceCache).then(cache => {
    return fetch(request).then(response => {
      // Put a copy of the response in the runtime cache.
      return cache.put(request, response.clone()).then(() => {
        return response;
      });
    });
  });
}

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin) && !event.request.url.contains('recordings.json')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          event.waitUntil(fetchAndCache(event.request));
          return cachedResponse;
        }

        return fetchAndCache(event.request);
      })
    );
  }
});