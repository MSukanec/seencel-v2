const CACHE_NAME = 'seencel-v2';
const OFFLINE_URL = '/offline';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;

    // Skip API requests (always go to network)
    if (event.request.url.includes('/api/')) return;

    // Skip Supabase requests
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If request is for a page, show offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ============================================================================
// WEB PUSH NOTIFICATIONS
// ============================================================================

// Push event - show notification when received from server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Seencel',
            body: event.data.text(),
        };
    }

    const title = data.title || 'Seencel';
    const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        tag: data.tag || 'seencel-notification',
        renotify: true,
        data: {
            url: data.data?.url || '/',
            notificationId: data.data?.notification_id,
        },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );

    // Update app badge count
    if ('setAppBadge' in navigator) {
        // We don't know the exact count here, so just set a generic badge
        navigator.setAppBadge().catch(() => { });
    }
});

// Notification click - open/focus the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Otherwise open a new window
            return self.clients.openWindow(urlToOpen);
        })
    );
});
