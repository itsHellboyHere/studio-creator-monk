self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "CreatorMonk Studio";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    tag: data.tag || "cm-notification",
    renotify: true,
    data: { url: data.url || "/clients" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
        console.log("SW: found clients:", clients.length);
        clients.forEach(client => {
          console.log("SW: messaging client:", client.url);
          client.postMessage({ type: "PUSH_RECEIVED", data });
        });
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/clients";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});