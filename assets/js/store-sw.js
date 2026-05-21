self.addEventListener("install", event => {
    console.log("M&N Store App SW installed");
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    console.log("M&N Store App SW activated");
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
    // Store App fetch passthrough
});