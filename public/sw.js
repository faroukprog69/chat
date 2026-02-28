self.addEventListener("push", function (event) {
  let data = {
    title: "Test Notification",
    body: "Push received 🚀",
    url: "/chat",
  };

  if (event.data) {
    try {
      data = event.data.json(); // push الحقيقي من السيرفر
    } catch (e) {
      data.body = event.data.text(); // push من DevTools
    }
  }

  const options = {
    body: data.body,
    icon: "/icon.png",
    badge: "/badge.png",
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/chat";

  event.waitUntil(clients.openWindow(urlToOpen));
});
