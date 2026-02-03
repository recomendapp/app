// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
	apiKey: "AIzaSyCZb4SCOT8YwxVXnwMzY19Py3JT3R4gW8s",
	authDomain: "recomend-b6aab.firebaseapp.com",
	projectId: "recomend-b6aab",
	storageBucket: "recomend-b6aab.firebasestorage.app",
	messagingSenderId: "413826532912",
	appId: "1:413826532912:web:cf87a65b51740f4a3a8ff5",
	measurementId: "5KBCKV9KBM",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log(
//     "[firebase-messaging-sw.js] Received background message ",
//     payload
//   );

//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: payload.notification.icon || "./logo.png",
//     data: { url: payload.data?.link },
//   };
//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// self.addEventListener("notificationclick", function (event) {
//   console.log("[firebase-messaging-sw.js] Notification click received.");

//   event.notification.close();

//   // This checks if the client is already open and if it is, it focuses on the tab. If it is not open, it opens a new tab with the URL passed in the notification payload
//   event.waitUntil(
//     clients
//       // https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll
//       .matchAll({ type: "window", includeUncontrolled: true })
//       .then(function (clientList) {
//         const url = event.notification.data.url;

//         if (!url) return;

//         // If relative URL is passed in firebase console or API route handler, it may open a new window as the client.url is the full URL i.e. https://example.com/ and the url is /about whereas if we passed in the full URL, it will focus on the existing tab i.e. https://example.com/about
//         for (const client of clientList) {
//           if (client.url === url && "focus" in client) {
//             return client.focus();
//           }
//         }

//         if (clients.openWindow) {
//           console.log("OPENWINDOW ON CLIENT");
//           return clients.openWindow(url);
//         }
//       })
//   );
// });