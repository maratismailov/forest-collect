importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);

    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
    workbox.routing.registerRoute(
        new RegExp('virtualearth.net/tiles/'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'bing-maps',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 300,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
            ],
        }),
    );
    workbox.routing.registerRoute(
        new RegExp('https://dev.virtualearth.net/'),
        new workbox.strategies.NetworkFirst({
            cacheName: 'bing-maps-metadata',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 300,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
            ],
        }),
    );
    workbox.routing.registerRoute(
        new RegExp('https://gd.caiag.kg'),
        new workbox.strategies.NetworkFirst({
            cacheName: 'gd.caiag.kg',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 300,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
            ],
        }),
    );

} else {
    console.log(`Boo! Workbox didn't load 😬`);
}