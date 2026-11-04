// The Firebase service worker, served as /firebase-messaging-sw.js. A service worker cannot read
// environment variables, so this route writes the Firebase settings into it. It shows a
// notification for pushes that arrive while the app is closed or in the background.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export function GET() {
  const body = `
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
firebase.messaging().onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || "fieldpro", { body: n.body || "", data: payload.data || {} });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const job = event.notification.data && event.notification.data.job;
  event.waitUntil(clients.openWindow(job ? "/tech/jobs/" + job : "/tech"));
});
`;
  return new Response(body, { headers: { "Content-Type": "application/javascript", "Service-Worker-Allowed": "/" } });
}
