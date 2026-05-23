const CACHE_NAME = "mn-store-v2";

/* =========================================
   INSTALL
========================================= */

self.addEventListener("install", event => {

    console.log("M&N Store App SW installed");

    self.skipWaiting();

});

/* =========================================
   ACTIVATE
========================================= */

self.addEventListener("activate", event => {

    console.log("M&N Store App SW activated");

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })

            );

        })

    );

    event.waitUntil(self.clients.claim());

});

/* =========================================
   FETCH
========================================= */

self.addEventListener("fetch", event => {

    event.respondWith(

        fetch(event.request)
            .catch(() => caches.match(event.request))

    );

});