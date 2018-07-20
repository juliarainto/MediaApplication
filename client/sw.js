var cacheName = 'Media Compressor';
var cacheFiles = ['/content/img/feather.jpeg', '/content/img/springs.jpeg'];

self.addEventListener('install', function (event) {
  console.log("[Serviceworker] Installed");
  event.waitUntil(caches.open(cacheName).then(function (cache) {
    console.log("[Serviceworker] Caching cacheFiles");
    return cache.addAll(cacheFiles);
  }));
});

self.addEventListener('fetch', function (event) {
  console.log("[Serviceworker] Fetching", event.request.url);
  event.respondWith(caches.match(event.request).then(function (response) {

    if (response) {
      return response;
    }
    var fetchRequest = event.request.clone();
    return fetch(fetchRequest).then(function (response) {

      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      var responseToCache = response.clone();
      caches.open(cacheName).then(function (cache) {
        cache.put(event.request, responseToCache);
      });

      return response;
    });
  }));
});

self.addEventListener('activate', function (event) {
  console.log("[Serviceworker] Activated");
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.map(function (thisCacheName) {
      if (thisCacheName !== cacheName) {
        console.log("[ServiceWorker] Removing Cached Files from", thisCacheName);
        return caches.delete(thisCacheName);
      }
    }));
  }));
});
